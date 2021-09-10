//
// Initial Main script
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

//geth commands are these ones, input to start the ethereum protocol in the command line window:
//
//command to start geth with private chain
//geth --datadir newEra --rpc --rpccorsdomain "*" --rpcapi="db,eth,net,web3,personal,web3" --networkid 777 --nodiscover console
//
//command to start geth with public chain
//geth --datadir main --rpc --rpccorsdomain "*" --rpcapi="db,eth,net,web3,personal,web3" --cache=2048 console
//
//end geth commands


//from here the js starts, easy to acces through the UI developers interface from the ethereum wallet


//open protocol to interact with the outside of blockchain
//
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


//variables for the script to obtain array of accounts
//WARNING 2d array: Index 0 initialize the array with nothing inside


//**********************************************************************************************************/


// ***********************Input Start and End block*********
var endBlock = 4960000;
var genesis =  3960000;
//**********************************************************


// ***********************input number of transaccions, 50K*******
var numberOfTransacions = 150000;
// **********************************************************


// ************ Input tx per package, 119 to aim for 5.11M Gas per block***********
var txPerPackage = 222;
// **********************************************************


// ********* Input initial supply to distribute, 11.45M, 18 decimals used = 11450000000000000000000000
var initialSupply = 11450000000000000000000000;
// *********************************************************************************


// ************** Ipunt ammount of wealthiest addresses, 10% = 0.1 *********************
var a = 0.4;
// ************************************************************************************

// Ammount of more used addresses
var b = 1-a;


var accountsAndBalance = [[]];
var accountAndTransaction = [[]];

//keep track of added addresses
var accountsArray = [];

//pruner
var arrayPruneAddress =[];
var arrayPruneAddressBalance=[];

//issuance ammount
var userIssuance=[];

var txCount = 0;

var dStart = new Date();
var timeStart = dStart.getTime();



//data will be sent on each index, each index represents an array
var arraySendAddress = [[]];
var arraySendStake = [[]];



//
// Start SCRIPT! =D  ***********************************************************
//


//Get all external addresses above 1.5 eth
for(var blockNumber = genesis; blockNumber <= endBlock; blockNumber++){

   txCount = web3.eth.getBlockTransactionCount(blockNumber);

   if (txCount != null && txCount > 0){

      for(var txIndex = 0; txIndex < txCount; txIndex++){

         var transaction = web3.eth.getTransactionFromBlock(blockNumber, txIndex);
         var addressSender = transaction.from;
         var addressTo = transaction.to;


            //add sender 
            if ( (addressSender != null) && (web3.isAddress(addressSender) == true) && (web3.eth.getCode(addressSender) == '0x') && (accountsArray.indexOf(addressSender) < 0) ){ 

               var accountBalanceSender = web3.fromWei(web3.eth.getBalance(addressSender).toNumber(), 'ether');
               var transactionCountSender = web3.eth.getTransactionCount(addressSender);

               if ((accountBalanceSender != null) && (accountBalanceSender > 1.5)){               
                  accountsAndBalance.push([accountBalanceSender,addressSender]);
                  accountAndTransaction.push([transactionCountSender,addressSender]);
                  //keep track of added address
                  accountsArray.push(addressSender);
               } 
            }//
             

            //add recevier
            if ( (addressTo != null) && (web3.isAddress(addressTo) == true) && (web3.eth.getCode(addressTo) == '0x') && (accountsArray.indexOf(addressTo) < 0) ){
   
               var accountBalanceTo = web3.fromWei(web3.eth.getBalance(addressTo).toNumber(), 'ether');
               var transactionCountTo = web3.eth.getTransactionCount(addressTo);

               if ( (accountBalanceTo != null) && (accountBalanceTo > 1.5)){
                  accountsAndBalance.push([accountBalanceTo,addressTo]);
                  accountAndTransaction.push([transactionCountTo,addressTo]);
                  //keep track of added address
                  accountsArray.push(addressTo);
               } 
            }//


      }//for - txindex
   }//if tx count
}//for - blockNumber



console.log("Addresses array size more than 1.5 ETH is: "+ accountsAndBalance.length);


//
//NO USE - Unlesss properly saved in local hardrive, no with the following command:
//save array as string in local storage
//localStorage.setItem("addresesOk", JSON.stringify(accountsArrayOk));
//


var dEnd = new Date();
var timeEnd = dEnd.getTime();
var totalTime = ((timeEnd - timeStart)*0.001) / 60;
console.log("Computational Time: " + totalTime + " minutes");



//******************PRUNE*********************************


dStart = new Date();
timeStart = dStart.getTime();


//sort out from bigger stake to smaller stake
accountsAndBalance.sort(function(a,b){
return b[0]-a[0]
});
//

dEnd = new Date();
timeEnd = dEnd.getTime();
totalTime = ((timeEnd - timeStart)*0.001) / 60;
console.log("Computational Time Sort account and balance: " + totalTime + " minutes");



dStart = new Date();
timeStart = dStart.getTime();


//sort out from more transactions made to less transactions made
accountAndTransaction.sort(function(a,b){
return b[0]-a[0]
});
//

dEnd = new Date();
timeEnd = dEnd.getTime();
totalTime = ((timeEnd - timeStart)*0.001) / 60;
console.log("Computational Time Sort account and transaction count: " + totalTime + " minutes");




//
//Now we have all the external addresses that intercated during the last X blocks, and that have more than 1.5ETH at the time of the snapshot
//These addresses are sorted out by their balance, from more stake to lower stake
//These addresses are sorted out by their transaction count, from more transactions to less transactions
//



//
//********pass from 2d array to two array and issue the supply
//


var funds = 0;

var maxRichTx = a*numberOfTransacions;
var maxUsageTx = b*numberOfTransacions;

//starts in 1, d2 array in js initializes in null


for (var i = 1; i <= maxRichTx; i++){
    arrayPruneAddress.push(accountsAndBalance[i][1]);
    arrayPruneAddressBalance.push(accountsAndBalance[i][0]);
}



for (var i = 1; i <= maxUsageTx; i++){
    
    if (arrayPruneAddress.indexOf(accountAndTransaction[i][1]) < 0){
       arrayPruneAddress.push(accountAndTransaction[i][1]);
       arrayPruneAddressBalance.push(web3.fromWei(web3.eth.getBalance(accountAndTransaction[i][1]).toNumber(), 'ether'));
    } else {maxUsageTx++;}  // <------- ******CAUTION WARNING = INFINITE LOOP POSSIBLE!!!! **********************

}


//obtain total funds to calculate stake
for (var i = 0; i < arrayPruneAddress.length;i++){
    funds += arrayPruneAddressBalance[i];
}


//obtain corresponding issuance ammount

for (var i = 0; i < arrayPruneAddress.length; i++){
    //we dont want to pass decimals to solidity
    var stake = Math.floor(initialSupply*(arrayPruneAddressBalance[i]/funds));
    userIssuance.push(stake);
}

   
// ********************************************************************************************
// break the big arrays into smaller arrays of 119 addresses
// ********************************************************************************************
 

var auxAddressIndex = 0;

//each package has 119 addresses
var numberOfPackages = Math.ceil(numberOfTransacions/txPerPackage);


//introduce per package the richest ones
for (var i = 0; i < Math.ceil(numberOfPackages); i++){
var arrayAuxAddress = [];
var arrayAuxBalance = [];

    for (var txIndex = 0; txIndex < txPerPackage; txIndex++){   
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



// airdrop function
function airDrop (){

 for (var idx =0; idx <= burst ; idx++){
     sendManualPackage(i);
     i++;
     wait(5000); //5s

 }//end for

 burstIdx++;

}//end func airdrop



//manual send of package, for missing packages or called by airdop automatically
function sendManualPackage (packageIdx) {
    var totalFunds = 0;

    for (var aux = 0; aux < txPerPackage; aux++){

        if ((web3.isAddress(arraySendAddress[packageIdx][aux]) == true)){         
           totalFunds += arraySendStake[packageIdx][aux];
    
        }  else {
                 arrayErrors.push("Empty or not valid address in index of: "+packageIdx+", position: "+aux); 
           }
    }


    if ( (totalFunds != null) && (totalFunds > 0) && (SmartContractCall(readPackage_packageIdx) == false) ){
          SmartContractCall_Send((arraySendAddress[packageIdx], arraySendStake[packageIdx], totalFunds, packageIdx));
    }
}

// ***********************************************************************************************

// Call function airdrop, for missing packages call manual function and input the idx of the missed package

//
//End and beginning of the new era...
//