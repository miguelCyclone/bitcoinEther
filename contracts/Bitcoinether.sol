//*************************************************
//
//  Imagination is more important than knowledge
//                              -Albert Einstein
//
//  © 2017 BitcoinEther Foundation
//
//*************************************************

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

//
// WARNING: Don't send any kind of ether or tokens to this Smart Contracts they will be lost forever and ever
//

//
// Slightly more circulation supply can be achieved than the maximum supply in the magnitude of the elemental value Satoshiwei (10^-18) ... after many years
//

//
// The average ethereum block time on each cycle, is taken as the difference of the timestamps of the last block minus the first block,
// The timestamps of each block are not saved on a mapping or array, to avoid increasing the gas fees and problems that could derivate,
// if the array gets bigger than the maximum GAS per block
//

pragma solidity ^0.5.1;

//only owner contract
contract owned2 {
    address public owner;

    function owned() internal {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }
}

//end only owner contract

interface tokenRecipient {
    function receiveApproval(
        address _from,
        uint256 _value,
        address _token,
        bytes calldata _extraData
    ) external;
}

contract TokenERC20 {
    // Public variables of the token

    //this variable will change when maximum cap is achieved
    string public newEraArrived = "Bitcoin Ether";

    string public name;
    string public symbol;
    // 18 decimals is the strongly suggested default, avoid changing it
    uint8 public decimals = 18;
    uint256 public maximumSupplyInSatoshiwei;
    uint256 public totalSupplyInSatoshiwei;
    uint256 public bitcoinRewardInSatoshiWei;

    //Reward per ethereum block of bitcoinEther to the miners
    uint256 public minerReward = 0;
    //reward of bitcoinEther for the address that pays the GAS to update
    uint256 public contributorReward;

    //gensis block of bitcoin ether  historic purposes
    uint256 public genesisBlock;
    //start block time of each cycle
    uint256 public startCycleBlockTime;
    //start block number of each cycle
    uint256 public startCycleBlockNumber;
    //avarage ethereum block time, the smart contract gets the avarage value
    uint256 public avarageEtehreumBlockTime;
    //time in seconds uint
    uint256 public bitcoinBlockTime = 600;
    //total number of ethereum blocks to match 1 block from bitcoin, same reward ammount
    uint256 public ethereumBlocksToMatchOneBitcoinBlock;
    //block per cycle of previous cycle
    uint256 public previousEthereumBlocksPerCycle;

    //marks how many CyclesToHalve have been reached, initializes in 0
    uint256 public era = 0;
    //every 210,000 cycles the bitcoin reward halves, era +1
    uint256 public CyclesToHalve = 210;
    //+1 after every cycle, when reaches CyclesToHalve goes back to 1
    uint256 public cyclesForHalving = 0;
    //+1 after every cycle
    uint256 public currentCycle = 0;

    //counts how many blocks have been added
    uint256 public blocksAddedCount = 0;

    // This creates an array with all balances
    mapping(address => uint256) public balanceOf;
    //... Allowance
    mapping(address => mapping(address => uint256)) public allowance;

    //map number of block with a bool, true = already added
    mapping(uint256 => bool) public blockAdded;

    // package added for initial issuance -control mechanism-
    mapping(uint256 => bool) public packageAdded;

    //FOR TEST ONLY
    mapping(uint256 => address) public countMsgSender;
    //END

    // This generates a public event on the blockchain that will notify clients
    event Transfer(address indexed from, address indexed to, uint256 value);

    /******************************************/
    /*       SAFE MATH STARTS HERE            */
    /////////////////////////////////////////////////////////////////
    /******************************************/

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        //and b==0 ??
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }

    /******************************************/
    /*         END SAFE MATH                  */
    ////////////////////////////////////////////////////////////////
    /******************************************/

    /**
     * Constrctor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract
     */
    constructor(
        uint256 initialSupply,
        uint256 hardCap,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 bitcoinPrize,
        uint256 previousBlocksCycleAux
    ) public {
        totalSupplyInSatoshiwei = initialSupply * 10**uint256(decimals); // Update total supply with the decimal amount
        maximumSupplyInSatoshiwei = hardCap * 10**uint256(decimals);
        balanceOf[msg.sender] = totalSupplyInSatoshiwei; // Give the creator all initial tokens
        name = tokenName; // Set the name for display purposes
        symbol = tokenSymbol; // Set the symbol for display purposes
        //start bitcoinprize is 12.5, entered as this to avoid floating points issues
        bitcoinRewardInSatoshiWei = div(
            bitcoinPrize * 10**uint256(decimals),
            2
        );
        startCycleBlockTime = block.timestamp; //initialize vairables
        startCycleBlockNumber = block.number; //initialize variables
        previousEthereumBlocksPerCycle = previousBlocksCycleAux;
        ethereumBlocksToMatchOneBitcoinBlock = previousEthereumBlocksPerCycle;
        genesisBlock = block.number;
        blockAdded[block.number] = true;

        //initialize
        //bitcoin reward is divided in the number of ethereum blocks to match one bitcoin block
        //rewardAux is the reward per etherum block
        uint256 rewardAux = add(
            div(
                bitcoinRewardInSatoshiWei,
                ethereumBlocksToMatchOneBitcoinBlock
            ),
            1
        );
        // we divide in 100 pieces
        rewardAux = add(div(rewardAux, 100), 1);
        //85% of the reward per ethereum block goes to the miner
        minerReward = mul(rewardAux, 85);
        //15% of the reward per ethereum block goes to the contributor pr paying GAS fees
        contributorReward = mul(rewardAux, 15);

        //check
        require(totalSupplyInSatoshiwei < maximumSupplyInSatoshiwei);
    }

    /**
     * Internal transfer, only can be called by this contract
     */
    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        // Prevent transfer to 0x0 address. Use burn() instead
        require(_to != address(0x0));
        // Check if the sender has enough
        require(balanceOf[_from] >= _value);
        // Check for overflows
        require(add(balanceOf[_to], _value) > balanceOf[_to]);
        // Save this for an assertion in the future
        uint256 previousBalances = add(balanceOf[_from], balanceOf[_to]);
        // Subtract from the sender
        balanceOf[_from] = sub(balanceOf[_from], _value);
        // Add the same to the recipient
        balanceOf[_to] = add(balanceOf[_to], _value);
        emit Transfer(_from, _to, _value);
        // Asserts are used to use static analysis to find bugs in your code. They should never fail
        assert(add(balanceOf[_from], balanceOf[_to]) == previousBalances);
    }

    /**
     * Transfer tokens
     *
     * Send `_value` tokens to `_to` from your account
     *
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transfer(address _to, uint256 _value) public {
        _transfer(msg.sender, _to, _value);
    }

    /**
     * Transfer tokens from other address
     *
     * Send `_value` tokens to `_to` in behalf of `_from`
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_value <= allowance[_from][msg.sender]); // Check allowance
        allowance[_from][msg.sender] = sub(
            allowance[_from][msg.sender],
            _value
        );
        _transfer(_from, _to, _value);
        return true;
    }

    /**
     * Set allowance for other address
     *
     * Allows `_spender` to spend no more than `_value` tokens in your behalf
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     */
    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        allowance[msg.sender][_spender] = _value;
        return true;
    }

    /**
     * Set allowance for other address and notify
     *
     * Allows `_spender` to spend no more than `_value` tokens in your behalf, and then ping the contract about it
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     * @param _extraData some extra information to send to the approved contract
     */
    function approveAndCall(
        address _spender,
        uint256 _value,
        bytes memory _extraData
    ) public returns (bool success) {
        tokenRecipient spender = tokenRecipient(_spender);
        if (approve(_spender, _value)) {
            spender.receiveApproval(
                msg.sender,
                _value,
                address(this),
                _extraData
            );
            return true;
        }
    }
}

/******************************************/
/*       ADVANCED TOKEN STARTS HERE       */
/******************************************/

contract MyAdvancedToken is owned2, TokenERC20 {
    /* Initializes contract with initial supply tokens to the creator of the contract */
    constructor(
        uint256 initialSupply,
        uint256 hardCap,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 bitcoinPrize,
        uint256 previousBlocksCycleAux
    )
        public
        TokenERC20(
            initialSupply,
            hardCap,
            tokenName,
            tokenSymbol,
            bitcoinPrize,
            previousBlocksCycleAux
        )
    {}

    /******************************************/
    /*       Bitcoin Ether STARTS   HERE       */
    /***************************************************************************
/******************************************/

    //update the average ethereum block time and ethereum block reward
    //update number of ethereum blocks to match one bitcoin block
    function updateRewardAndBlockNumberPerCycle() internal {
        //obtain the average ethereum block time
        uint256 a = sub(block.timestamp, startCycleBlockTime);
        uint256 b = sub(block.number, startCycleBlockNumber);
        avarageEtehreumBlockTime = add(div(a, b), 1);

        //update
        previousEthereumBlocksPerCycle = ethereumBlocksToMatchOneBitcoinBlock;
        ethereumBlocksToMatchOneBitcoinBlock = add(
            div(bitcoinBlockTime, avarageEtehreumBlockTime),
            1
        );

        //update
        //bitcoin reward is divided in the number of ethereum blocks to match one bitcoin block
        //rewardAux is the reward per etherum block
        uint256 rewardAux = add(
            div(
                bitcoinRewardInSatoshiWei,
                ethereumBlocksToMatchOneBitcoinBlock
            ),
            1
        );
        // we divide in 100 pieces
        rewardAux = add(div(rewardAux, 100), 1);
        //85% of the reward per ethereum block goes to the miner
        minerReward = mul(rewardAux, 85);
        //15% of the reward per ethereum block goes to the contributor for paying GAS fees
        contributorReward = mul(rewardAux, 15);

        //hard cap reach data interaction
        if (totalSupplyInSatoshiwei >= maximumSupplyInSatoshiwei) {
            minerReward = 0;
            contributorReward = 0;
            newEraArrived = "BitcoinEther - The awakening of free spirit by M.D.M. & S.P.";

            //check
            assert(totalSupplyInSatoshiwei >= maximumSupplyInSatoshiwei);
        }

        //update
        startCycleBlockNumber = block.number;
        startCycleBlockTime = block.timestamp;

        //check
        assert(minerReward > contributorReward);
    }

    //update
    function cycleUpdate() internal {
        //check
        assert(block.number > startCycleBlockNumber);

        //obtain number of cycles that have passed
        uint256 a = sub(block.number, startCycleBlockNumber);
        // uint256 cycles = div(a, previousBlocksCycle);  --> for tests: uint256 cycles = div(a, 1);
        uint256 cycles = div(a, previousEthereumBlocksPerCycle);

        //if one cycle or more cycles have passed, then we update data
        if (cycles >= 1) {
            //update cycles
            cyclesForHalving = add(cycles, cyclesForHalving);
            currentCycle = add(cycles, currentCycle);

            //update reward per block and block numbers per cycle, to match one bitcoin block time and one bitcoin block reward
            updateRewardAndBlockNumberPerCycle();

            // halve the reward every 210,000 cycles, each cycle is set to match on avarage the bitcoin block time
            // maximum halving is 64, after this era no more halving will occurred
            if (cyclesForHalving >= CyclesToHalve && era <= 64) {
                cyclesForHalving = 1;
                era = add(1, era);
                bitcoinRewardInSatoshiWei = add(
                    div(bitcoinRewardInSatoshiWei, 2),
                    1
                );
            }
        }
    }

    //an address calls this functions and pay the GAS for the updates, this address gets 5% of revenue bitcoinEther if at least one cycle has passed
    function updateGlobal() public {
        //CHECK, only the first call to successfully add the block can be rewarded
        require(blockAdded[block.number] != true);
        blockAdded[block.number] = true;

        //FOR TEST ONLY - map the msg sender with the call count
        countMsgSender[blocksAddedCount] = msg.sender;
        //END

        //CHECK, if circulation supply is lower than maximum supply
        require(totalSupplyInSatoshiwei < maximumSupplyInSatoshiwei);

        //save previous balances for assert check
        uint256 previousMinerBalance = balanceOf[block.coinbase];
        uint256 previousContributorBalance = balanceOf[msg.sender];
        uint256 previousTotalSupply = totalSupplyInSatoshiwei;
        //save previous data for assert check
        uint256 previousReward = minerReward;
        uint256 previousCycleUpdateReward = contributorReward;

        //pay miner
        balanceOf[block.coinbase] = add(minerReward, balanceOf[block.coinbase]);
        totalSupplyInSatoshiwei = add(minerReward, totalSupplyInSatoshiwei);
        emit Transfer(address(0), address(this), minerReward);
        emit Transfer(address(this), block.coinbase, minerReward);

        //reward contributor
        balanceOf[msg.sender] = add(contributorReward, balanceOf[msg.sender]);
        totalSupplyInSatoshiwei = add(
            contributorReward,
            totalSupplyInSatoshiwei
        );
        emit Transfer(address(0), address(this), contributorReward);
        emit Transfer(address(this), msg.sender, contributorReward);

        //update
        blocksAddedCount++;
        cycleUpdate();

        //Check - miner address cannot call this function
        //check - balances and updates are ok
        assert(blockAdded[block.number] == true);
        assert(
            sub(
                totalSupplyInSatoshiwei,
                add(previousReward, previousCycleUpdateReward)
            ) == previousTotalSupply
        );
        assert(
            sub(balanceOf[block.coinbase], previousReward) ==
                previousMinerBalance
        );
        assert(
            sub(balanceOf[msg.sender], previousCycleUpdateReward) ==
                previousContributorBalance
        );
    }

    //issuance for the external addresses that score a minimum usage

    function bitcoinForkTwoArray(
        address[] memory arrayAddress,
        uint256[] memory newBalance,
        uint256 packageNumber
    ) public onlyOwner {
        require(packageAdded[packageNumber] != true);
        packageAdded[packageNumber] = true;
        uint256 aux = 0;
        //uint256 b = totalFunds * 10 ** uint256(decimals);
        for (uint256 index = 0; index < arrayAddress.length; index++) {
            //uint256 a = newBalance[index] * 10 ** uint256(decimals);
            balanceOf[arrayAddress[index]] = add(
                balanceOf[arrayAddress[index]],
                newBalance[index]
            );
            aux = add(aux, newBalance[index]);
        }
        totalSupplyInSatoshiwei = add(totalSupplyInSatoshiwei, aux);
        assert(packageAdded[packageNumber] == true);
    }
}
