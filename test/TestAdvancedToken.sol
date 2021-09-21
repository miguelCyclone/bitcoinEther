pragma solidity ^0.5.1;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Bitcoinether.sol";

contract TestAdvancedToken {
    // The address of the Bitcoinether contract to be tested
    MyAdvancedToken bitcoinEther =
        MyAdvancedToken(DeployedAddresses.MyAdvancedToken());

    // check the blockCount has increased correctly
    function testBlockCount() public {
        uint256 previousCount = bitcoinEther.blocksAddedCount();
        bitcoinEther.updateGlobal();
        uint256 afterCount = bitcoinEther.blocksAddedCount();
        Assert.isAbove(afterCount, previousCount, "Blockcount is incorrectly");
    }

    // check the block number was added to the SC
    function testBlockAddedOk() public {
        uint256 currentBlock = block.number;
        bitcoinEther.updateGlobal();
        bool blockAdded = bitcoinEther.blockAdded(currentBlock);
        Assert.isTrue(blockAdded, "The blockcnumber was added NoK");
    }

    // check block hasnt been added
    function testBlockNotAddedOk() public {
        uint256 currentBlock = block.number;
        bool blockAdded = bitcoinEther.blockAdded(currentBlock);
        Assert.isFalse(
            blockAdded,
            "The blockcnumber has already been added NoK"
        );
    }

    // check the reward ammount
    function testCheckRewards() public {
        address thisAddress = address(this);
        uint256 minerReward = bitcoinEther.minerReward();
        uint256 callerReward = bitcoinEther.contributorReward();
        uint256 previousBalanceMiner = bitcoinEther.balanceOf(block.coinbase);
        uint256 previousBalanceCaller = bitcoinEther.balanceOf(thisAddress);

        bitcoinEther.updateGlobal();

        uint256 rewardGivenToMiner = bitcoinEther.balanceOf(block.coinbase) -
            previousBalanceMiner;
        uint256 rewardGivenToCaller = bitcoinEther.balanceOf(thisAddress) -
            previousBalanceCaller;

        Assert.equal(
            minerReward,
            rewardGivenToMiner,
            "Miner got a different reward"
        );
        Assert.equal(
            callerReward,
            rewardGivenToCaller,
            "Caller got a different reward"
        );
    }

    function sendAirdrop() public {
        address[] memory addArr = new address[](2);
        addArr[0] = 0x130264998d39C49Fdaa83034fF5A007BE87Cffc4;
        addArr[1] = 0xde5e21b4e327F75251516b316DA9EDA8b68750Ee;

        uint256[] memory stakeArr = new uint256[](2);
        stakeArr[0] = 1500000000;
        stakeArr[0] = 2000000000;

        // if fails, this function throws
        bitcoinEther.airdrop(addArr, stakeArr, 2);
    }

    //
    // As the SC for BitcoinEther was deployed with Acc0 (owner), we cannot perform the Airdrop from this TestAdvancedToken SC
    // Therefore we test that another account cannot make the airdrop
    //
    function testSendAirdropFromNoOwner() public {
        //start from the opposite state
        bool r = true;
        // If it fails it returns false
        (r, ) = address(this).call(abi.encodePacked(this.sendAirdrop.selector));
        // It should failed, as this SC is not the owner of the token SC
        Assert.isFalse(r, "A not owner acc was able to call the Airdrop");
    }

    function lockAirdrop() public {
        bitcoinEther.lockAirdrop();
    }

    function testLockAirdropFromNoOwner() public {
        //start from the opposite state
        bool r = true;
        // If it fails it returns false
        (r, ) = address(this).call(abi.encodePacked(this.lockAirdrop.selector));
        // It should failed, as this SC is not the owner of the token SC
        Assert.isFalse(r, "A not owner acc was able to call the Airdrop");
    }
}
