const BitcoinEther = artifacts.require('MyAdvancedToken')
const truffleAssert = require('truffle-assertions')

contract('BitcoinEther', async (accounts) => {
  var bitcoinEther

  const MINT_ACC_ONE = 150
  const MINT_ACC_TWO = 200

  const FIRST_ID = 1
  const SECOND_ID = 2
  const THIRD_ID = 3

  const ADRR_ARR = [accounts[0], accounts[1]]
  const MINT_ARR = [MINT_ACC_ONE, MINT_ACC_TWO]

  before(async () => {
    bitcoinEther = await BitcoinEther.deployed()
  })

  describe('Airdrop testing', async () => {
    var accOnePreviousBalance
    var accTwoPreviouBalance
    before('Send init airdrop package', async () => {
      accOnePreviousBalance = await bitcoinEther.balanceOf.call(accounts[0])
      accTwoPreviouBalance = await bitcoinEther.balanceOf.call(accounts[1])
      await bitcoinEther.airdrop(
        ADRR_ARR,
        MINT_ARR,
        FIRST_ID,
      )
    })

    it('Balances where issued OK', async () => {
      var accOneCurrentBalance = await bitcoinEther.balanceOf.call(accounts[0])
      var accTwoCurrentBalance = await bitcoinEther.balanceOf.call(accounts[1])
      
      // The response from "balanceOf" are big_number_objects. We are adding a small mint ammount
      // we can use the key['words'] at index 0 to compare them
      // the function bigObject.toNumber() does not work, as it caped to 53 bits
      accOneCurrentBalance = accOneCurrentBalance.words[0]
      accTwoCurrentBalance = accTwoCurrentBalance.words[0]
      //

      assert.equal(
        accOneCurrentBalance,
        accOnePreviousBalance.words[0]+MINT_ACC_ONE,
        'Account one wrong balance',
      )
      assert.equal(
        accTwoCurrentBalance,
        accTwoPreviouBalance.words[0]+MINT_ACC_TWO,
        'Account two wrong balance',
      )
    })

    it('Cannot send an airdorp with the same package ID', async () => {
      await truffleAssert.reverts(
        bitcoinEther.airdrop(
          ADRR_ARR,
          MINT_ARR,
          FIRST_ID,
        )
      )
    })
    it('Can send an airdrop with a different package ID', async () => {
      await truffleAssert.passes(
        bitcoinEther.airdrop(
          ADRR_ARR,
          MINT_ARR,
          SECOND_ID,
        )
      )
    })
    // Owner is account 0 (default account)
    it('Not owner cannot lock the airdrop', async () => {
      await truffleAssert.reverts(
        bitcoinEther.lockAirdrop({from: accounts[1]}),
      )
    })

    it('No more airdrop after owner locks the key', async () => {
      await bitcoinEther.lockAirdrop()
      await truffleAssert.reverts(
        bitcoinEther.airdrop(
          ADRR_ARR,
          MINT_ARR,
          THIRD_ID,
        )
      )
    })
  })
})
