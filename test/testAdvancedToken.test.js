//
// This script tests the airdrop functionality
// The bigNumber objectsretrieved from the balances are paresed into strings, and then into int
// 
const BitcoinEther = artifacts.require('MyAdvancedToken')
const truffleAssert = require('truffle-assertions')

contract('BitcoinEther', async (accounts) => {
  var bitcoinEther
  var accOnePreviousBalance
  var accTwoPreviouBalance

  let mintAccOne = 150
  let mintAccTwo = 200

  before(async () => {
    bitcoinEther = await BitcoinEther.deployed()
  })

  describe('Airdrop testing', async () => {
    before('Send init airdrop package', async () => {
      accOnePreviousBalance = await bitcoinEther.balanceOf(accounts[0])
      accTwoPreviouBalance = await bitcoinEther.balanceOf(accounts[1])
      await bitcoinEther.airdrop(
        [accounts[0], accounts[1]],
        [mintAccOne, mintAccTwo],
        1,
      )
    })

    it('Balances where issued OK', async () => {
      var accOneCurrentBalance = await bitcoinEther.balanceOf(accounts[0])
      var accTwoCurrentBalance = await bitcoinEther.balanceOf(accounts[1])

      accOnePreviousBalance = accOnePreviousBalance + 1 // Now the big number object is a string
      accOnePreviousBalance = parseInt(accOnePreviousBalance) - 1 // now is a number, we place a -1 to erase the previous '+1'
      accOnePreviousBalance = accOnePreviousBalance + mintAccOne
      accOneCurrentBalance = accOneCurrentBalance + 1
      accOneCurrentBalance = parseInt(accOneCurrentBalance) - 1

      accTwoPreviouBalance = accTwoPreviouBalance + 1
      accTwoPreviouBalance = parseInt(accTwoPreviouBalance) - 1
      accTwoPreviouBalance = accTwoPreviouBalance + mintAccTwo
      accTwoCurrentBalance = accTwoCurrentBalance + 1
      accTwoCurrentBalance = (parseInt(accTwoCurrentBalance) - 1) / 10 //div 10 as it starts in balance 0

      assert.equal(
        accOneCurrentBalance,
        accOnePreviousBalance,
        'Account one wrong balance',
      )
      assert.equal(
        accTwoCurrentBalance,
        accTwoPreviouBalance,
        'Account two wrong balance',
      )
    })

    it('Cannot resend an airdorp with the same package ID', async () => {
      await truffleAssert.reverts(
        bitcoinEther.airdrop([accounts[0], accounts[1]], [15, 20], 1),
      )
    })
  })
})
