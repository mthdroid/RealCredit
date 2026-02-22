// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RWAToken.sol";
import "./CreditScore.sol";
import "./LendingPool.sol";

/// @title RealCreditFactory — Deploy RWA collections and lending pools
/// @notice One-stop factory for creating the full RealCredit infrastructure
contract RealCreditFactory is Ownable {
    CreditScore public creditScore;

    address[] public rwaTokens;
    address[] public lendingPools;

    mapping(address => address) public rwaToPool; // rwaToken → lendingPool
    mapping(address => bool) public isRWAToken;
    mapping(address => bool) public isLendingPool;

    event RWATokenCreated(address indexed rwaToken, string name, string symbol);
    event LendingPoolCreated(address indexed pool, address indexed rwaToken);
    event CreditScoreDeployed(address indexed creditScore);

    constructor() Ownable(msg.sender) {
        // Deploy a single CreditScore contract shared across all pools
        creditScore = new CreditScore(address(this));
        emit CreditScoreDeployed(address(creditScore));
    }

    /// @notice Create a new RWA token collection
    function createRWAToken(
        string calldata name,
        string calldata symbol
    ) external onlyOwner returns (address) {
        RWAToken token = new RWAToken(name, symbol, msg.sender);
        address tokenAddr = address(token);

        rwaTokens.push(tokenAddr);
        isRWAToken[tokenAddr] = true;

        emit RWATokenCreated(tokenAddr, name, symbol);
        return tokenAddr;
    }

    /// @notice Create a lending pool for an RWA token collection
    function createLendingPool(address rwaToken_) external onlyOwner returns (address) {
        require(isRWAToken[rwaToken_], "Not a registered RWA token");
        require(rwaToPool[rwaToken_] == address(0), "Pool already exists");

        LendingPool pool = new LendingPool(
            rwaToken_,
            address(creditScore),
            msg.sender
        );
        address poolAddr = address(pool);

        lendingPools.push(poolAddr);
        isLendingPool[poolAddr] = true;
        rwaToPool[rwaToken_] = poolAddr;

        // Authorize pool to update credit scores
        creditScore.authorizeUpdater(poolAddr);

        emit LendingPoolCreated(poolAddr, rwaToken_);
        return poolAddr;
    }

    /// @notice Get all RWA token addresses
    function getAllRWATokens() external view returns (address[] memory) {
        return rwaTokens;
    }

    /// @notice Get all lending pool addresses
    function getAllPools() external view returns (address[] memory) {
        return lendingPools;
    }

    /// @notice Get total number of RWA token collections
    function totalRWATokens() external view returns (uint256) {
        return rwaTokens.length;
    }

    /// @notice Get total number of lending pools
    function totalPools() external view returns (uint256) {
        return lendingPools.length;
    }
}
