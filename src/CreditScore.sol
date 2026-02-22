// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CreditScore — On-chain credit scoring based on repayment history
/// @notice Computes a 300–850 score (FICO-like) from on-chain lending behavior
contract CreditScore is Ownable {
    struct CreditProfile {
        uint256 totalLoans;
        uint256 onTimeRepayments;
        uint256 defaults;
        uint256 totalBorrowed; // cumulative CTC borrowed (18 decimals)
        uint256 totalRepaid; // cumulative CTC repaid (18 decimals)
        uint256 lastUpdated;
    }

    uint256 public constant MIN_SCORE = 300;
    uint256 public constant MAX_SCORE = 850;
    uint256 public constant BASE_SCORE = 500;
    uint256 public constant REPAYMENT_BONUS = 50; // per on-time repayment
    uint256 public constant MAX_REPAYMENT_BONUS = 300; // cap at 6 on-time repayments
    uint256 public constant DEFAULT_PENALTY = 100; // per default
    uint256 public constant VOLUME_THRESHOLD = 10 ether; // bonus kicks in above this
    uint256 public constant VOLUME_BONUS = 25; // bonus for high-volume borrowers

    mapping(address => CreditProfile) private _profiles;

    /// @notice Only authorized updaters (LendingPool contracts)
    mapping(address => bool) public authorizedUpdaters;

    event ScoreUpdated(address indexed borrower, uint256 newScore);
    event UpdaterAuthorized(address indexed updater);
    event UpdaterRevoked(address indexed updater);

    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address owner_) Ownable(owner_) {}

    /// @notice Authorize a LendingPool to update credit scores
    function authorizeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
        emit UpdaterAuthorized(updater);
    }

    /// @notice Revoke updater authorization
    function revokeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRevoked(updater);
    }

    /// @notice Record an on-time repayment
    function recordRepayment(address borrower, uint256 amount) external onlyAuthorized {
        CreditProfile storage profile = _profiles[borrower];
        profile.onTimeRepayments++;
        profile.totalRepaid += amount;
        profile.lastUpdated = block.timestamp;
        emit ScoreUpdated(borrower, getScore(borrower));
    }

    /// @notice Record a default (failed to repay by maturity)
    function recordDefault(address borrower) external onlyAuthorized {
        CreditProfile storage profile = _profiles[borrower];
        profile.defaults++;
        profile.lastUpdated = block.timestamp;
        emit ScoreUpdated(borrower, getScore(borrower));
    }

    /// @notice Record a new loan being taken
    function recordLoan(address borrower, uint256 amount) external onlyAuthorized {
        CreditProfile storage profile = _profiles[borrower];
        profile.totalLoans++;
        profile.totalBorrowed += amount;
        profile.lastUpdated = block.timestamp;
    }

    /// @notice Calculate credit score for an address
    /// @dev Algorithm: base 500 + repayment bonus (max 300) - default penalty + volume bonus
    ///      Range clamped to [300, 850]
    function getScore(address borrower) public view returns (uint256) {
        CreditProfile storage profile = _profiles[borrower];

        // No history → return base score
        if (profile.totalLoans == 0) {
            return BASE_SCORE;
        }

        // Start with base
        uint256 score = BASE_SCORE;

        // +50 per on-time repayment, capped at +300
        uint256 repayBonus = profile.onTimeRepayments * REPAYMENT_BONUS;
        if (repayBonus > MAX_REPAYMENT_BONUS) {
            repayBonus = MAX_REPAYMENT_BONUS;
        }
        score += repayBonus;

        // -100 per default
        uint256 penalty = profile.defaults * DEFAULT_PENALTY;
        if (penalty >= score - MIN_SCORE) {
            return MIN_SCORE;
        }
        score -= penalty;

        // Volume bonus: +25 if total borrowed > threshold
        if (profile.totalBorrowed > VOLUME_THRESHOLD) {
            score += VOLUME_BONUS;
        }

        // Clamp to range
        if (score > MAX_SCORE) {
            return MAX_SCORE;
        }
        if (score < MIN_SCORE) {
            return MIN_SCORE;
        }

        return score;
    }

    /// @notice Get the full credit profile for an address
    function getProfile(address borrower) external view returns (CreditProfile memory) {
        return _profiles[borrower];
    }

    /// @notice Get a human-readable credit rating
    function getRating(address borrower) external view returns (string memory) {
        uint256 score = getScore(borrower);
        if (score >= 750) return "Excellent";
        if (score >= 650) return "Good";
        if (score >= 550) return "Fair";
        if (score >= 450) return "Poor";
        return "Very Poor";
    }
}
