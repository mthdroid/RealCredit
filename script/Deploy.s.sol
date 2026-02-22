// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/RealCreditFactory.sol";
import "../src/RWAToken.sol";
import "../src/CreditScore.sol";
import "../src/LendingPool.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying with address:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Factory (auto-deploys CreditScore)
        RealCreditFactory factory = new RealCreditFactory();
        console.log("Factory deployed at:", address(factory));
        console.log("CreditScore deployed at:", address(factory.creditScore()));

        // 2. Create RWA Token collections
        address invoiceToken = factory.createRWAToken("RealCredit Invoices", "rcINV");
        console.log("Invoice RWA Token:", invoiceToken);

        address tbillToken = factory.createRWAToken("RealCredit T-Bills", "rcTBILL");
        console.log("T-Bill RWA Token:", tbillToken);

        address realEstateToken = factory.createRWAToken("RealCredit Real Estate", "rcRE");
        console.log("Real Estate RWA Token:", realEstateToken);

        // 3. Create Lending Pools for each
        address invoicePool = factory.createLendingPool(invoiceToken);
        console.log("Invoice Lending Pool:", invoicePool);

        address tbillPool = factory.createLendingPool(tbillToken);
        console.log("T-Bill Lending Pool:", tbillPool);

        address realEstatePool = factory.createLendingPool(realEstateToken);
        console.log("Real Estate Lending Pool:", realEstatePool);

        vm.stopBroadcast();

        // Summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Factory:          ", address(factory));
        console.log("CreditScore:      ", address(factory.creditScore()));
        console.log("Invoice Token:    ", invoiceToken);
        console.log("Invoice Pool:     ", invoicePool);
        console.log("T-Bill Token:     ", tbillToken);
        console.log("T-Bill Pool:      ", tbillPool);
        console.log("Real Estate Token:", realEstateToken);
        console.log("Real Estate Pool: ", realEstatePool);
    }
}
