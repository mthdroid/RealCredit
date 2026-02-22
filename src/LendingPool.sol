// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RWAToken.sol";
import "./CreditScore.sol";

/// @title LendingPool — Lend CTC against RWA-NFT collateral
/// @notice Lenders deposit CTC to earn yield; borrowers lock RWA tokens as collateral
contract LendingPool is ReentrancyGuard, Ownable {
    RWAToken public immutable rwaToken;
    CreditScore public immutable creditScore;

    uint256 public constant LTV_BPS = 7000; // 70% max LTV
    uint256 public constant BASE_RATE_BPS = 500; // 5% base annual interest
    uint256 public constant BPS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant LIQUIDATION_GRACE_PERIOD = 7 days;

    // Pool state
    uint256 public totalDeposited;
    uint256 public totalBorrowed;
    uint256 public totalShares;

    // Lender accounting
    mapping(address => uint256) public shares;

    // Loan state
    struct Loan {
        address borrower;
        uint256 rwaTokenId;
        uint256 principal;
        uint256 interestRateBps; // annual rate in basis points
        uint256 startTime;
        uint256 dueDate; // maturity date of underlying RWA
        bool repaid;
        bool liquidated;
    }

    uint256 private _nextLoanId;
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => uint256) public rwaToLoan; // rwaTokenId → loanId (0 = none)

    event Deposited(address indexed lender, uint256 amount, uint256 sharesReceived);
    event Withdrawn(address indexed lender, uint256 shares, uint256 amountReceived);
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 rwaTokenId, uint256 principal);
    event LoanRepaid(uint256 indexed loanId, uint256 totalPaid);
    event LoanLiquidated(uint256 indexed loanId, uint256 rwaTokenId);

    constructor(
        address rwaToken_,
        address creditScore_,
        address owner_
    ) Ownable(owner_) {
        rwaToken = RWAToken(rwaToken_);
        creditScore = CreditScore(creditScore_);
        _nextLoanId = 1;
    }

    // ═══════════════════════════════════════════
    //  LENDER FUNCTIONS
    // ═══════════════════════════════════════════

    /// @notice Deposit CTC into the pool to earn yield
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Must deposit > 0");

        uint256 newShares;
        if (totalShares == 0) {
            newShares = msg.value;
        } else {
            newShares = (msg.value * totalShares) / totalDeposited;
        }

        shares[msg.sender] += newShares;
        totalShares += newShares;
        totalDeposited += msg.value;

        emit Deposited(msg.sender, msg.value, newShares);
    }

    /// @notice Withdraw CTC + earned interest by redeeming shares
    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "Must withdraw > 0");
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");

        uint256 amount = (shareAmount * totalDeposited) / totalShares;

        // Ensure pool has enough liquidity
        uint256 available = address(this).balance;
        require(amount <= available, "Insufficient liquidity");

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposited -= amount;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, shareAmount, amount);
    }

    // ═══════════════════════════════════════════
    //  BORROWER FUNCTIONS
    // ═══════════════════════════════════════════

    /// @notice Borrow CTC against an RWA-NFT (max 70% LTV of face value)
    /// @param rwaTokenId The token to use as collateral
    /// @param amount Amount of CTC to borrow
    function borrow(uint256 rwaTokenId, uint256 amount) external nonReentrant {
        require(amount > 0, "Must borrow > 0");
        require(rwaToLoan[rwaTokenId] == 0, "RWA already collateralized");

        // Verify ownership and approval
        require(rwaToken.ownerOf(rwaTokenId) == msg.sender, "Not RWA owner");
        require(
            rwaToken.getApproved(rwaTokenId) == address(this) ||
            rwaToken.isApprovedForAll(msg.sender, address(this)),
            "Pool not approved"
        );

        // Check RWA is verified and active
        require(rwaToken.isVerified(rwaTokenId), "RWA not verified");
        require(rwaToken.isActive(rwaTokenId), "RWA not active");

        // Check LTV
        uint256 faceValue = rwaToken.getFaceValue(rwaTokenId);
        uint256 maxBorrow = (faceValue * LTV_BPS) / BPS;
        require(amount <= maxBorrow, "Exceeds 70% LTV");

        // Check liquidity
        require(amount <= address(this).balance, "Insufficient pool liquidity");

        // Get maturity date for due date
        RWAToken.RWAMetadata memory meta = rwaToken.getMetadata(rwaTokenId);

        // Calculate interest rate based on credit score
        uint256 interestRate = _calculateInterestRate(msg.sender);

        // Transfer NFT to pool as collateral
        rwaToken.transferFrom(msg.sender, address(this), rwaTokenId);

        // Create loan
        uint256 loanId = _nextLoanId++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            rwaTokenId: rwaTokenId,
            principal: amount,
            interestRateBps: interestRate,
            startTime: block.timestamp,
            dueDate: meta.maturityDate,
            repaid: false,
            liquidated: false
        });
        rwaToLoan[rwaTokenId] = loanId;

        totalBorrowed += amount;

        // Record loan in credit score
        creditScore.recordLoan(msg.sender, amount);

        // Send CTC to borrower
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Transfer failed");

        emit LoanCreated(loanId, msg.sender, rwaTokenId, amount);
    }

    /// @notice Repay a loan (principal + accrued interest)
    function repay(uint256 loanId) external payable nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.principal > 0, "Loan does not exist");
        require(!loan.repaid, "Already repaid");
        require(!loan.liquidated, "Loan was liquidated");
        require(loan.borrower == msg.sender, "Not borrower");

        uint256 totalOwed = getAmountOwed(loanId);
        require(msg.value >= totalOwed, "Insufficient repayment");

        loan.repaid = true;
        totalBorrowed -= loan.principal;

        // Interest goes to the pool (increases share value)
        uint256 interest = totalOwed - loan.principal;
        totalDeposited += interest;

        // Return NFT to borrower
        rwaToken.transferFrom(address(this), msg.sender, loan.rwaTokenId);
        rwaToLoan[loan.rwaTokenId] = 0;

        // Update credit score — on-time repayment
        creditScore.recordRepayment(msg.sender, loan.principal);

        // Refund excess payment
        if (msg.value > totalOwed) {
            (bool refunded, ) = msg.sender.call{value: msg.value - totalOwed}("");
            require(refunded, "Refund failed");
        }

        emit LoanRepaid(loanId, totalOwed);
    }

    /// @notice Liquidate an overdue loan — seize RWA NFT
    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.principal > 0, "Loan does not exist");
        require(!loan.repaid, "Already repaid");
        require(!loan.liquidated, "Already liquidated");
        require(
            block.timestamp > loan.dueDate + LIQUIDATION_GRACE_PERIOD,
            "Not yet liquidatable"
        );

        loan.liquidated = true;
        totalBorrowed -= loan.principal;
        rwaToLoan[loan.rwaTokenId] = 0;

        // Record default in credit score
        creditScore.recordDefault(loan.borrower);

        // RWA NFT stays in pool (could be auctioned later)
        emit LoanLiquidated(loanId, loan.rwaTokenId);
    }

    // ═══════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /// @notice Calculate total amount owed (principal + accrued interest)
    function getAmountOwed(uint256 loanId) public view returns (uint256) {
        Loan storage loan = loans[loanId];
        if (loan.repaid || loan.liquidated) return 0;

        uint256 elapsed = block.timestamp - loan.startTime;
        uint256 interest = (loan.principal * loan.interestRateBps * elapsed) / (BPS * SECONDS_PER_YEAR);
        return loan.principal + interest;
    }

    /// @notice Get share value in CTC
    function getShareValue(uint256 shareAmount) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shareAmount * totalDeposited) / totalShares;
    }

    /// @notice Get the current APY estimate (based on utilization)
    function getPoolAPY() external view returns (uint256) {
        if (totalDeposited == 0) return 0;
        // Simplified: utilization * base rate
        return (totalBorrowed * BASE_RATE_BPS) / totalDeposited;
    }

    /// @notice Pool utilization in basis points
    function getUtilization() external view returns (uint256) {
        if (totalDeposited == 0) return 0;
        return (totalBorrowed * BPS) / totalDeposited;
    }

    /// @notice Interest rate for a borrower based on credit score
    function _calculateInterestRate(address borrower) internal view returns (uint256) {
        uint256 score = creditScore.getScore(borrower);

        // Base 5% + risk premium
        // Score 800+ → 5% (base only)
        // Score 650-799 → 7.5%
        // Score 500-649 → 10%
        // Score <500 → 15%
        if (score >= 800) return 500;
        if (score >= 650) return 750;
        if (score >= 500) return 1000;
        return 1500;
    }

    /// @notice Get the interest rate a borrower would receive
    function getBorrowerRate(address borrower) external view returns (uint256) {
        return _calculateInterestRate(borrower);
    }

    /// @notice Total number of loans created
    function totalLoans() external view returns (uint256) {
        return _nextLoanId - 1;
    }

    /// @notice Allow contract to receive CTC
    receive() external payable {}
}
