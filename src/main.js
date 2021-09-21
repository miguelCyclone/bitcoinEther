//
// This script gets the addresses from the blockchain, it prunes them, and makes a weight selection algorithm
// Finally, then it makes the airdrop in burst packages with ID for error management
// This can be expanded with a mongoose nodejs application to save the addresses on a DB
//
// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)
// WARNING 2d array: Index 0 initialize the array with nothing inside
//

// init provider
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// ***********************Input Start and End block*********
var endBlock = 4960000;
var genesis = 3960000;
//**********************************************************

// ***********************input number of transaccions, 50K*******
var numberOfTransacions = 150000;
// **********************************************************

// ************ Input tx per package, 119 to aim for 5.11M Gas per block***********
var txPerPackage = 222;
// **********************************************************

// ********* Input initial supply to distribute, 11.45M, 18 decimals used = 11450000000000000000000000
var initialSupply = 11450000000000000000000000;
// ***********************************************************************************

// ************** Input ammount of wealthiest addresses, 10% = 0.1 *******************
var a = 0.4;
// ***********************************************************************************

// ************** Input ammount of addresses tht transfer the must *******************
var b = 1 - a;
// ***********************************************************************************

// Save the addresses and balance
var accountsAndBalance = [[]];

// Save the addresses and transaction count
var accountAndTransaction = [[]];

//keep track of added addresses
var accountsArray = [];

// We save the pruned addresses
var arrayPruneAddress = [];
var arrayPruneAddressBalance = [];

// Airdrop ammount to each user
var userIssuance = [];

// Number of transactions per block
var txCount = 0;

// Compute the total time for reading the blockchain
var dStart = new Date();
var timeStart = dStart.getTime();
var dEnd = new Date();
var timeEnd = dEnd.getTime();
var totalTime = 0;

//data will be sent on each index, each index represents an array
var arraySendAddress = [[]];
var arraySendStake = [[]];

//
// Start SCRIPT! =D  ***********************************************************
//

//Get all external addresses above 1.5 eth
for (var blockNumber = genesis; blockNumber <= endBlock; blockNumber++) {
  txCount = web3.eth.getBlockTransactionCount(blockNumber);

  if (txCount != null && txCount > 0) {
    for (var txIndex = 0; txIndex < txCount; txIndex++) {
      var transaction = web3.eth.getTransactionFromBlock(blockNumber, txIndex);
      var addressSender = transaction.from;
      var addressTo = transaction.to;

      //add sender
      if (
        addressSender != null &&
        web3.isAddress(addressSender) == true &&
        web3.eth.getCode(addressSender) == "0x" &&
        accountsArray.indexOf(addressSender) < 0
      ) {
        var accountBalanceSender = web3.fromWei(
          web3.eth.getBalance(addressSender).toNumber(),
          "ether"
        );
        var transactionCountSender =
          web3.eth.getTransactionCount(addressSender);

        if (accountBalanceSender != null && accountBalanceSender > 1.5) {
          accountsAndBalance.push([accountBalanceSender, addressSender]);
          accountAndTransaction.push([transactionCountSender, addressSender]);
          //keep track of added address
          accountsArray.push(addressSender);
        }
      } //

      //add recevier
      if (
        addressTo != null &&
        web3.isAddress(addressTo) == true &&
        web3.eth.getCode(addressTo) == "0x" &&
        accountsArray.indexOf(addressTo) < 0
      ) {
        var accountBalanceTo = web3.fromWei(
          web3.eth.getBalance(addressTo).toNumber(),
          "ether"
        );
        var transactionCountTo = web3.eth.getTransactionCount(addressTo);

        if (accountBalanceTo != null && accountBalanceTo > 1.5) {
          accountsAndBalance.push([accountBalanceTo, addressTo]);
          accountAndTransaction.push([transactionCountTo, addressTo]);
          //keep track of added address
          accountsArray.push(addressTo);
        }
      } //
    } //for - txindex
  } //if tx count
} //for - blockNumber

console.log(
  "Addresses array size more than 1.5 ETH is: " + accountsAndBalance.length
);

//
// NO USE - Unlesss properly saved in local hardrive, no with the following command:
// save array as string in local storage
// localStorage.setItem("addresesOk", JSON.stringify(accountsArrayOk));
//

// Compute total computaiton time
totalTime = ((timeEnd - timeStart) * 0.001) / 60;
console.log("Computational Time: " + totalTime + " minutes");

//******************PRUNE*********************************

dStart = new Date();
timeStart = dStart.getTime();

// sort out from bigger stake to smaller stake
accountsAndBalance.sort(function (a, b) {
  return b[0] - a[0];
});
//

dEnd = new Date();
timeEnd = dEnd.getTime();
totalTime = ((timeEnd - timeStart) * 0.001) / 60;
console.log(
  "Computational Time Sort account and balance: " + totalTime + " minutes"
);

dStart = new Date();
timeStart = dStart.getTime();

//sort out from more transactions made to less transactions made
accountAndTransaction.sort(function (a, b) {
  return b[0] - a[0];
});
//

dEnd = new Date();
timeEnd = dEnd.getTime();
totalTime = ((timeEnd - timeStart) * 0.001) / 60;
console.log(
  "Computational Time Sort account and transaction count: " +
    totalTime +
    " minutes"
);

//
//Now we have all the external addresses that intercated during the last X blocks, and that have more than 1.5ETH at the time of the snapshot
//These addresses are sorted out by their balance, from more stake to lower stake
//These addresses are sorted out by their transaction count, from more transactions to less transactions
//

//
//********pass from 2d array to two array and issue the supply
//

var funds = 0;

var maxRichTx = a * numberOfTransacions;
var maxUsageTx = b * numberOfTransacions;

//starts in 1, d2 array in js initializes in null

for (var i = 1; i <= maxRichTx; i++) {
  arrayPruneAddress.push(accountsAndBalance[i][1]);
  arrayPruneAddressBalance.push(accountsAndBalance[i][0]);
}

for (var i = 1; i <= maxUsageTx; i++) {
  if (arrayPruneAddress.indexOf(accountAndTransaction[i][1]) < 0) {
    arrayPruneAddress.push(accountAndTransaction[i][1]);
    arrayPruneAddressBalance.push(
      web3.fromWei(
        web3.eth.getBalance(accountAndTransaction[i][1]).toNumber(),
        "ether"
      )
    );
  } else {
    maxUsageTx++;
  } // <------- ******CAUTION WARNING = INFINITE LOOP POSSIBLE!!!! **********************
}

// obtain total funds to calculate stake
for (var i = 0; i < arrayPruneAddress.length; i++) {
  funds += arrayPruneAddressBalance[i];
}

// obtain corresponding issuance ammount

for (var i = 0; i < arrayPruneAddress.length; i++) {
  // we dont want to pass decimals to solidity
  var stake = Math.floor(initialSupply * (arrayPruneAddressBalance[i] / funds));
  userIssuance.push(stake);
}

// ********************************************************************************************
// break the big arrays into smaller arrays of 119 addresses
// ********************************************************************************************

var auxAddressIndex = 0;

//each package has 119 addresses
var numberOfPackages = Math.ceil(numberOfTransacions / txPerPackage);

//introduce per package the richest ones
for (var i = 0; i < Math.ceil(numberOfPackages); i++) {
  var arrayAuxAddress = [];
  var arrayAuxBalance = [];

  for (var txIndex = 0; txIndex < txPerPackage; txIndex++) {
    arrayAuxAddress.push(arrayPruneAddress[auxAddressIndex]);
    arrayAuxBalance.push(userIssuance[auxAddressIndex]);
    auxAddressIndex++;
  }
  arraySendAddress.push(arrayAuxAddress);
  arraySendStake.push(arrayAuxBalance);
}

//
//Now we have the addresses and their issuance on separate packages of 119 addresses each
//ArraySendAddress and ArraySendTake, have length of max number of packages, each index is an array with the data to sent on each package
//If a transaction fails, is easy to know wich package didnt got into the blockchain, just by looking at the mapping in the SC of the
//packages added
//

//
// First index 0 in 2D array, is NULL - dont use
// arraySendAddress
// arraySendStake

//    *****************   Data to send to the blockchain:  *********************************************

var SmartContractCall = Interaction_ABI_ADdress_functionName;

var arrayErrors = [];
var arrayNotConfirmed = [];
var arrayConfirmed = [];

// send in burst of 10 packages
var burst = 10;
var burstIdx = 1;

//index for arraySend...
var i = 1;

// automated airdrop function caped to 10 packages for bettter control
function automatedAirDrop() {
  for (var idx = 0; idx <= burst; idx++) {
    manualAirdrop(i);
    i++;
    wait(5000); //5s
  } //end for

  burstIdx++;
} //end func airdrop

//manual send of package, for missing packages or called by airdop automatically
function manualAirdrop(packageIdx) {
  // total funds to be sent on a single package
  var totalFunds = 0;
  for (var aux = 0; aux < txPerPackage; aux++) {
    // check the string in the array is a valid Ethereum address
    if (web3.isAddress(arraySendAddress[packageIdx][aux]) == true) {
      // obtain total funds
      totalFunds += arraySendStake[packageIdx][aux];
    } else {
      arrayErrors.push(
        "Empty or not valid address in index of: " +
          packageIdx +
          ", position: " +
          aux
      );
    }
  }
  if (
    totalFunds != null &&
    totalFunds > 0 &&
    SmartContractCall(readPackage_packageIdx) == false
  ) {
    SmartContractCall_Send(
      (arraySendAddress[packageIdx],
      arraySendStake[packageIdx],
      totalFunds,
      packageIdx)
    );
  }
}

// ***********************************************************************************************

// Call function airdrop, for missing packages call manual function and input the idx of the missed package

// To do
// Mongoose DB nodejs app
// Script to check that all addresses have been airdrop with the right ammount
// break code into modular functions from different files for better reading

//
// End :)
//
