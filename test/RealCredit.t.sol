// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/RWAToken.sol";
import "../src/CreditScore.sol";
import "../src/LendingPool.sol";
import "../src/RealCreditFactory.sol";

contract RWATokenTest is Test {
    RWAToken rwa;
    address admin = address(this);
    address alice = address(0xA11CE);

    function setUp() public {
        rwa = new RWAToken("RealCredit RWA", "rcRWA", admin);
    }

    function test_MintRWA() public {
        uint256 tokenId = rwa.mint(
            alice,
            RWAToken.AssetType.INVOICE,
            10_000 ether, // $10K face value
            block.timestamp + 30 days,
            "Acme Corp",
            keccak256("QmDocHash123")
        );

        assertEq(tokenId, 1);
        assertEq(rwa.ownerOf(1), alice);
        assertEq(rwa.totalMinted(), 1);

        RWAToken.RWAMetadata memory meta = rwa.getMetadata(1);
        assertEq(uint256(meta.assetType), uint256(RWAToken.AssetType.INVOICE));
        assertEq(meta.faceValue, 10_000 ether);
        assertFalse(meta.verified);
        assertTrue(meta.active);
        assertEq(meta.issuerName, "Acme Corp");
    }

    function test_VerifyRWA() public {
        rwa.mint(alice, RWAToken.AssetType.TREASURY_BILL, 50_000 ether, block.timestamp + 90 days, "US Treasury", bytes32(0));
        assertFalse(rwa.isVerified(1));

        rwa.verify(1);
        assertTrue(rwa.isVerified(1));
    }

    function test_VerifyRWA_OnlyOwner() public {
        rwa.mint(alice, RWAToken.AssetType.INVOICE, 1 ether, block.timestamp + 1 days, "X", bytes32(0));

        vm.prank(alice);
        vm.expectRevert();
        rwa.verify(1);
    }

    function test_BurnRWA() public {
        rwa.mint(alice, RWAToken.AssetType.REAL_ESTATE, 100_000 ether, block.timestamp + 365 days, "Property Inc", bytes32(0));

        vm.prank(alice);
        rwa.burn(1);

        assertFalse(rwa.isActive(1));
        vm.expectRevert();
        rwa.ownerOf(1); // burned
    }

    function test_MintRevertZeroValue() public {
        vm.expectRevert("Face value must be > 0");
        rwa.mint(alice, RWAToken.AssetType.INVOICE, 0, block.timestamp + 1 days, "X", bytes32(0));
    }

    function test_MintRevertPastMaturity() public {
        vm.expectRevert("Maturity must be in the future");
        rwa.mint(alice, RWAToken.AssetType.INVOICE, 1 ether, block.timestamp - 1, "X", bytes32(0));
    }

    function test_MultipleMints() public {
        rwa.mint(alice, RWAToken.AssetType.INVOICE, 1 ether, block.timestamp + 1 days, "A", bytes32(0));
        rwa.mint(alice, RWAToken.AssetType.TREASURY_BILL, 2 ether, block.timestamp + 2 days, "B", bytes32(0));
        rwa.mint(alice, RWAToken.AssetType.REAL_ESTATE, 3 ether, block.timestamp + 3 days, "C", bytes32(0));

        assertEq(rwa.totalMinted(), 3);
        assertEq(rwa.getFaceValue(1), 1 ether);
        assertEq(rwa.getFaceValue(2), 2 ether);
        assertEq(rwa.getFaceValue(3), 3 ether);
    }
}

contract CreditScoreTest is Test {
    CreditScore cs;
    address admin = address(this);
    address pool = address(0xBEEF);
    address borrower = address(0xB0B);

    function setUp() public {
        cs = new CreditScore(admin);
        cs.authorizeUpdater(pool);
    }

    function test_BaseScore() public view {
        assertEq(cs.getScore(borrower), 500);
    }

    function test_ScoreAfterRepayment() public {
        vm.prank(pool);
        cs.recordLoan(borrower, 1 ether);

        vm.prank(pool);
        cs.recordRepayment(borrower, 1 ether);

        // 500 base + 50 repayment = 550
        assertEq(cs.getScore(borrower), 550);
    }

    function test_ScoreAfterMultipleRepayments() public {
        vm.startPrank(pool);
        for (uint256 i = 0; i < 6; i++) {
            cs.recordLoan(borrower, 1 ether);
            cs.recordRepayment(borrower, 1 ether);
        }
        vm.stopPrank();

        // 500 + 300 (6 * 50, capped at 300) = 800
        assertEq(cs.getScore(borrower), 800);
    }

    function test_ScoreRepaymentBonusCapped() public {
        vm.startPrank(pool);
        for (uint256 i = 0; i < 10; i++) {
            cs.recordLoan(borrower, 1 ether);
            cs.recordRepayment(borrower, 1 ether);
        }
        vm.stopPrank();

        // 500 + 300 (capped) = 800 (10 ether is NOT > 10 ether, no volume bonus)
        assertEq(cs.getScore(borrower), 800);
    }

    function test_ScoreAfterDefault() public {
        vm.startPrank(pool);
        cs.recordLoan(borrower, 1 ether);
        cs.recordDefault(borrower);
        vm.stopPrank();

        // 500 - 100 = 400
        assertEq(cs.getScore(borrower), 400);
    }

    function test_ScoreFloorAt300() public {
        vm.startPrank(pool);
        cs.recordLoan(borrower, 1 ether);
        cs.recordDefault(borrower);
        cs.recordDefault(borrower);
        cs.recordDefault(borrower);
        vm.stopPrank();

        // Would be 500 - 300 = 200, but clamped to 300
        assertEq(cs.getScore(borrower), 300);
    }

    function test_VolumeBonus() public {
        vm.startPrank(pool);
        cs.recordLoan(borrower, 11 ether); // > 10 ether threshold
        cs.recordRepayment(borrower, 11 ether);
        vm.stopPrank();

        // 500 + 50 (1 repayment) + 25 (volume bonus) = 575
        assertEq(cs.getScore(borrower), 575);
    }

    function test_GetRating() public {
        assertEq(cs.getRating(borrower), "Poor"); // 500 falls in Poor range (450-549)

        vm.startPrank(pool);
        for (uint256 i = 0; i < 6; i++) {
            cs.recordLoan(borrower, 1 ether);
            cs.recordRepayment(borrower, 1 ether);
        }
        vm.stopPrank();

        assertEq(cs.getRating(borrower), "Excellent"); // 800
    }

    function test_UnauthorizedUpdater() public {
        address rando = address(0xDEAD);
        vm.prank(rando);
        vm.expectRevert("Not authorized");
        cs.recordRepayment(borrower, 1 ether);
    }

    function test_RevokeUpdater() public {
        cs.revokeUpdater(pool);
        vm.prank(pool);
        vm.expectRevert("Not authorized");
        cs.recordLoan(borrower, 1 ether);
    }

    function test_GetProfile() public {
        vm.startPrank(pool);
        cs.recordLoan(borrower, 5 ether);
        cs.recordRepayment(borrower, 5 ether);
        cs.recordLoan(borrower, 3 ether);
        cs.recordDefault(borrower);
        vm.stopPrank();

        CreditScore.CreditProfile memory p = cs.getProfile(borrower);
        assertEq(p.totalLoans, 2);
        assertEq(p.onTimeRepayments, 1);
        assertEq(p.defaults, 1);
        assertEq(p.totalBorrowed, 8 ether);
        assertEq(p.totalRepaid, 5 ether);
    }
}

contract LendingPoolTest is Test {
    RWAToken rwa;
    CreditScore cs;
    LendingPool pool;
    address admin = address(this);
    address lender = address(0xCAFE);
    address borrower = address(0xB0B);

    function setUp() public {
        rwa = new RWAToken("Test RWA", "tRWA", admin);
        cs = new CreditScore(admin);
        pool = new LendingPool(address(rwa), address(cs), admin);
        cs.authorizeUpdater(address(pool));

        // Fund lender and borrower
        vm.deal(lender, 100 ether);
        vm.deal(borrower, 10 ether);
    }

    // ── Helpers ──

    function _mintVerifiedRWA(address to, uint256 faceValue) internal returns (uint256) {
        uint256 tokenId = rwa.mint(to, RWAToken.AssetType.INVOICE, faceValue, block.timestamp + 30 days, "Test Issuer", bytes32(0));
        rwa.verify(tokenId);
        return tokenId;
    }

    function _depositAsLender(uint256 amount) internal {
        vm.prank(lender);
        pool.deposit{value: amount}();
    }

    // ── Deposit Tests ──

    function test_Deposit() public {
        _depositAsLender(10 ether);
        assertEq(pool.totalDeposited(), 10 ether);
        assertEq(pool.totalShares(), 10 ether);
        assertEq(pool.shares(lender), 10 ether);
    }

    function test_DepositMultipleLenders() public {
        _depositAsLender(10 ether);

        address lender2 = address(0xBEEF);
        vm.deal(lender2, 10 ether);
        vm.prank(lender2);
        pool.deposit{value: 5 ether}();

        assertEq(pool.totalDeposited(), 15 ether);
        assertEq(pool.shares(lender), 10 ether);
        assertEq(pool.shares(lender2), 5 ether);
    }

    function test_Withdraw() public {
        _depositAsLender(10 ether);

        uint256 balBefore = lender.balance;
        vm.prank(lender);
        pool.withdraw(10 ether);

        assertEq(lender.balance, balBefore + 10 ether);
        assertEq(pool.totalDeposited(), 0);
        assertEq(pool.totalShares(), 0);
    }

    function test_WithdrawInsufficientShares() public {
        _depositAsLender(10 ether);

        vm.prank(lender);
        vm.expectRevert("Insufficient shares");
        pool.withdraw(20 ether);
    }

    // ── Borrow Tests ──

    function test_Borrow() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        uint256 borrowAmount = 7 ether; // 70% LTV of 10 ether
        pool.borrow(tokenId, borrowAmount);
        vm.stopPrank();

        assertEq(pool.totalBorrowed(), 7 ether);
        assertEq(rwa.ownerOf(tokenId), address(pool)); // NFT held by pool
        assertEq(borrower.balance, 10 ether + 7 ether); // original 10 + borrowed 7

        (address loanBorrower, uint256 loanRwaId, uint256 principal,,,,, ) = pool.loans(1);
        assertEq(loanBorrower, borrower);
        assertEq(loanRwaId, tokenId);
        assertEq(principal, 7 ether);
    }

    function test_BorrowExceedsLTV() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        vm.expectRevert("Exceeds 70% LTV");
        pool.borrow(tokenId, 8 ether); // > 70% of 10 ether
        vm.stopPrank();
    }

    function test_BorrowUnverifiedRWA() public {
        _depositAsLender(50 ether);
        uint256 tokenId = rwa.mint(borrower, RWAToken.AssetType.INVOICE, 10 ether, block.timestamp + 30 days, "X", bytes32(0));
        // NOT verified

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        vm.expectRevert("RWA not verified");
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();
    }

    function test_BorrowInsufficientLiquidity() public {
        _depositAsLender(1 ether); // only 1 ether in pool
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        vm.expectRevert("Insufficient pool liquidity");
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();
    }

    // ── Repay Tests ──

    function test_Repay() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        // Fast-forward 30 days
        vm.warp(block.timestamp + 30 days);

        uint256 owed = pool.getAmountOwed(1);
        assertTrue(owed > 5 ether); // principal + interest

        vm.deal(borrower, owed + 1 ether); // ensure enough to repay
        vm.prank(borrower);
        pool.repay{value: owed}(1);

        // NFT returned to borrower
        assertEq(rwa.ownerOf(tokenId), borrower);
        assertEq(pool.totalBorrowed(), 0);

        // Credit score updated
        uint256 score = cs.getScore(borrower);
        assertEq(score, 550); // 500 base + 50 for 1 repayment
    }

    function test_RepayWithExcessRefund() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        uint256 owed = pool.getAmountOwed(1);
        uint256 overpay = owed + 1 ether;

        vm.deal(borrower, overpay);
        uint256 balBefore = borrower.balance;
        vm.prank(borrower);
        pool.repay{value: overpay}(1);

        // Should get 1 ether refund
        assertEq(borrower.balance, balBefore - owed);
    }

    // ── Liquidation Tests ──

    function test_Liquidate() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        // Get the loan due date
        (,,,, , uint256 dueDate,, ) = pool.loans(1);

        // Warp past due date + grace period
        vm.warp(dueDate + 7 days + 1);

        pool.liquidate(1);

        // Loan is liquidated
        (,,,,,, bool repaid, bool liquidated) = pool.loans(1);
        assertFalse(repaid);
        assertTrue(liquidated);

        // Credit score penalized
        uint256 score = cs.getScore(borrower);
        assertEq(score, 400); // 500 - 100 default
    }

    function test_LiquidateTooEarly() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        // Only warp to due date (within grace period)
        (,,,, , uint256 dueDate,, ) = pool.loans(1);
        vm.warp(dueDate + 1 days);

        vm.expectRevert("Not yet liquidatable");
        pool.liquidate(1);
    }

    // ── Interest Rate Tests ──

    function test_InterestRateByScore() public view {
        // New borrower → score 500 → 10% rate
        assertEq(pool.getBorrowerRate(borrower), 1000);
    }

    function test_InterestAccrues() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        // At t=0, owed should be exactly principal
        assertEq(pool.getAmountOwed(1), 5 ether);

        // After 1 year at 10% rate, interest = 0.5 ether
        vm.warp(block.timestamp + 365 days);
        uint256 owed = pool.getAmountOwed(1);
        // 5 ether * 1000/10000 * 1 year = 0.5 ether interest
        assertEq(owed, 5.5 ether);
    }

    // ── View Function Tests ──

    function test_PoolUtilization() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        // utilization = 5/50 = 10% = 1000 bps
        assertEq(pool.getUtilization(), 1000);
    }

    function test_ShareValueIncreasesWithInterest() public {
        _depositAsLender(50 ether);
        uint256 tokenId = _mintVerifiedRWA(borrower, 10 ether);

        vm.startPrank(borrower);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        // Warp 1 year and repay
        vm.warp(block.timestamp + 365 days);
        uint256 owed = pool.getAmountOwed(1);

        vm.deal(borrower, owed);
        vm.prank(borrower);
        pool.repay{value: owed}(1);

        // After repayment, pool has original 45 ether + 5 ether principal + 0.5 ether interest
        // totalDeposited = 50 + 0.5 = 50.5 ether
        assertEq(pool.totalDeposited(), 50.5 ether);

        // Share value should have increased
        uint256 shareVal = pool.getShareValue(50 ether);
        assertEq(shareVal, 50.5 ether);
    }
}

contract FactoryTest is Test {
    RealCreditFactory factory;
    address admin = address(this);

    function setUp() public {
        factory = new RealCreditFactory();
    }

    function test_DeploysCreditScore() public view {
        assertTrue(address(factory.creditScore()) != address(0));
    }

    function test_CreateRWAToken() public {
        address token = factory.createRWAToken("Invoice RWA", "iRWA");
        assertTrue(token != address(0));
        assertEq(factory.totalRWATokens(), 1);
        assertTrue(factory.isRWAToken(token));

        address[] memory all = factory.getAllRWATokens();
        assertEq(all.length, 1);
        assertEq(all[0], token);
    }

    function test_CreateLendingPool() public {
        address token = factory.createRWAToken("Invoice RWA", "iRWA");
        address poolAddr = factory.createLendingPool(token);
        assertTrue(poolAddr != address(0));
        assertEq(factory.totalPools(), 1);
        assertTrue(factory.isLendingPool(poolAddr));
        assertEq(factory.rwaToPool(token), poolAddr);
    }

    function test_CreatePoolRequiresRegisteredRWA() public {
        vm.expectRevert("Not a registered RWA token");
        factory.createLendingPool(address(0xDEAD));
    }

    function test_CreatePoolOnlyOnce() public {
        address token = factory.createRWAToken("Invoice RWA", "iRWA");
        factory.createLendingPool(token);

        vm.expectRevert("Pool already exists");
        factory.createLendingPool(token);
    }

    function test_MultipleCollections() public {
        factory.createRWAToken("Invoices", "iRWA");
        factory.createRWAToken("T-Bills", "tRWA");
        factory.createRWAToken("Real Estate", "reRWA");

        assertEq(factory.totalRWATokens(), 3);
    }

    function test_OnlyOwner() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert();
        factory.createRWAToken("X", "X");
    }
}

/// @dev Full lifecycle integration test
contract LifecycleTest is Test {
    RealCreditFactory factory;
    RWAToken rwa;
    LendingPool pool;
    CreditScore cs;

    address admin = address(this);
    address issuer = address(0x1);
    address lender1 = address(0x2);
    address lender2 = address(0x3);
    address borrower1 = address(0x4);
    address borrower2 = address(0x5);

    function setUp() public {
        // Deploy via factory
        factory = new RealCreditFactory();
        address tokenAddr = factory.createRWAToken("RealCredit Invoices", "rcINV");
        address poolAddr = factory.createLendingPool(tokenAddr);

        rwa = RWAToken(tokenAddr);
        pool = LendingPool(payable(poolAddr));
        cs = factory.creditScore();

        // Fund accounts
        vm.deal(lender1, 100 ether);
        vm.deal(lender2, 100 ether);
        vm.deal(borrower1, 10 ether);
        vm.deal(borrower2, 10 ether);
    }

    function test_FullLifecycle() public {
        // ── Step 1: Lenders deposit CTC ──
        vm.prank(lender1);
        pool.deposit{value: 50 ether}();
        vm.prank(lender2);
        pool.deposit{value: 30 ether}();

        assertEq(pool.totalDeposited(), 80 ether);

        // ── Step 2: Issuer mints RWA tokens ──
        uint256 rwa1 = rwa.mint(
            borrower1,
            RWAToken.AssetType.INVOICE,
            20 ether, // $20K face value
            block.timestamp + 60 days,
            "Acme Corp",
            keccak256("invoice-001")
        );
        uint256 rwa2 = rwa.mint(
            borrower2,
            RWAToken.AssetType.TREASURY_BILL,
            30 ether, // $30K face value
            block.timestamp + 90 days,
            "US Treasury",
            keccak256("tbill-042")
        );

        // ── Step 3: Admin verifies RWAs ──
        rwa.verify(rwa1);
        rwa.verify(rwa2);

        // ── Step 4: Borrower1 borrows against invoice ──
        vm.startPrank(borrower1);
        rwa.approve(address(pool), rwa1);
        pool.borrow(rwa1, 14 ether); // 70% of 20 ether
        vm.stopPrank();

        assertEq(borrower1.balance, 24 ether); // 10 initial + 14 borrowed
        assertEq(cs.getScore(borrower1), 525); // 500 base + 25 volume bonus (14 > 10 ether)

        // ── Step 5: Borrower2 borrows against t-bill ──
        vm.startPrank(borrower2);
        rwa.approve(address(pool), rwa2);
        pool.borrow(rwa2, 15 ether); // 50% of 30 ether
        vm.stopPrank();

        assertEq(pool.totalBorrowed(), 29 ether);

        // ── Step 6: Borrower1 repays on time ──
        vm.warp(block.timestamp + 30 days);
        uint256 owed1 = pool.getAmountOwed(1);

        vm.deal(borrower1, owed1);
        vm.prank(borrower1);
        pool.repay{value: owed1}(1);

        // Credit score improved
        assertEq(cs.getScore(borrower1), 575); // 500 + 50 repayment + 25 volume (14 > 10)
        assertEq(cs.getRating(borrower1), "Fair");

        // NFT returned
        assertEq(rwa.ownerOf(rwa1), borrower1);

        // ── Step 7: Borrower2 defaults ──
        // Get loan due date
        (,,,, , uint256 dueDate2,, ) = pool.loans(2);
        vm.warp(dueDate2 + 7 days + 1);

        pool.liquidate(2);

        assertEq(cs.getScore(borrower2), 425); // 500 - 100 default + 25 volume bonus (15 > 10 ether)
        assertEq(cs.getRating(borrower2), "Very Poor"); // 425 < 450

        // ── Step 8: Verify pool economics ──
        // totalDeposited should have increased by interest from loan 1
        assertTrue(pool.totalDeposited() > 80 ether);

        // ── Step 9: Lender1 withdraws with profit ──
        uint256 lenderShares = pool.shares(lender1);
        uint256 shareValue = pool.getShareValue(lenderShares);
        assertTrue(shareValue > 50 ether); // earned some interest

        // ── Step 10: Borrower1 takes another loan (better rate now) ──
        uint256 rwa3 = rwa.mint(
            borrower1,
            RWAToken.AssetType.INVOICE,
            10 ether,
            block.timestamp + 60 days,
            "Beta Corp",
            keccak256("invoice-002")
        );
        rwa.verify(rwa3);

        // Score 575 → rate should be 10% (500-649 bracket)
        assertEq(pool.getBorrowerRate(borrower1), 1000);

        vm.startPrank(borrower1);
        rwa.approve(address(pool), rwa3);
        pool.borrow(rwa3, 5 ether);
        vm.stopPrank();

        // Repay again
        vm.warp(block.timestamp + 15 days);
        uint256 owed3 = pool.getAmountOwed(3);
        vm.deal(borrower1, owed3);
        vm.prank(borrower1);
        pool.repay{value: owed3}(3);

        // Score should be 625 now: 500 + 100 (2 repayments) + 25 (volume > 10 ether)
        assertEq(cs.getScore(borrower1), 625);
    }

    function test_LiquidationNFTStaysInPool() public {
        vm.prank(lender1);
        pool.deposit{value: 50 ether}();

        uint256 tokenId = rwa.mint(borrower1, RWAToken.AssetType.INVOICE, 10 ether, block.timestamp + 30 days, "X", bytes32(0));
        rwa.verify(tokenId);

        vm.startPrank(borrower1);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        (,,,, , uint256 dueDate,, ) = pool.loans(1);
        vm.warp(dueDate + 7 days + 1);
        pool.liquidate(1);

        // NFT still held by pool
        assertEq(rwa.ownerOf(tokenId), address(pool));
    }

    function test_CannotRepayAfterLiquidation() public {
        vm.prank(lender1);
        pool.deposit{value: 50 ether}();

        uint256 tokenId = rwa.mint(borrower1, RWAToken.AssetType.INVOICE, 10 ether, block.timestamp + 30 days, "X", bytes32(0));
        rwa.verify(tokenId);

        vm.startPrank(borrower1);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);
        vm.stopPrank();

        (,,,, , uint256 dueDate,, ) = pool.loans(1);
        vm.warp(dueDate + 7 days + 1);
        pool.liquidate(1);

        vm.deal(borrower1, 10 ether);
        vm.prank(borrower1);
        vm.expectRevert("Loan was liquidated");
        pool.repay{value: 6 ether}(1);
    }

    function test_CannotDoubleCollateralize() public {
        vm.prank(lender1);
        pool.deposit{value: 50 ether}();

        uint256 tokenId = rwa.mint(borrower1, RWAToken.AssetType.INVOICE, 10 ether, block.timestamp + 30 days, "X", bytes32(0));
        rwa.verify(tokenId);

        vm.startPrank(borrower1);
        rwa.approve(address(pool), tokenId);
        pool.borrow(tokenId, 5 ether);

        vm.expectRevert("RWA already collateralized");
        pool.borrow(tokenId, 2 ether);
        vm.stopPrank();
    }
}
