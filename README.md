# Bitcoin Ether 2017
* Bring a value storage system to Ethereum
* It is uploaded to GitHub for showcase and educational purposes. It is not intended to be use under commercial activities, please read the license file

# License
* Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

# Architecture
* You can check the system architecture and project presentation at [Bitcoin_Ether.pdf](https://github.com/miguelCyclone/bitcoinEther/tree/master/projectPresentation)

# Key points
* Bootstrap a community through an Airdrop
* The accounts for the airdops are been read from the latest X blocks
* The accounts are pruned in base of trading activity and token holder

# Smart Contracts
* It is a PoC
* It creates a new token every ethereum cycle, that matches the bitcoin cycle
* The token is given to the miner of the eth block

# Script init
* It uses web3
* Reads from a starting block until a given block
* Weights each account for all the reading blocks
* The winning accounts are the ones that trade the must and the ones that hold more ETH

# Script airdrop
* It can be run by automated bursts, or by manual burst for better error management
* Each burst is caped to a certain number of transfer transaction
* The Burst are caped following the GAS consumption and block size

# Truffle testing
* Truffle provides a great suit for SC unit testing
* I have tested some variables and functionalities with truffle
* The behavioural of the SC was tested with Remix when I designed it, however, a more in depth behavioural testing shall be done with truffle

# To do
* Truffle SC behavioural testing
* Add a mongoose DB for the nodejs app to store the blockchain data (Afterwards dockerize the app)
* Currently it uses Web3, but it would be more friendly to update it to Ethers.js
