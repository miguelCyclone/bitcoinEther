const TokenERC20 = artifacts.require("TokenERC20");

module.exports = function (deployer) {
  deployer.deploy(TokenERC20, 10000000, 21000000, "BitcoinEther", "BTCE", 12, 1);
};
