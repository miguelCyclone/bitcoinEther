const MyAdvancedToken = artifacts.require("MyAdvancedToken");

module.exports = function (deployer) {
  deployer.deploy(MyAdvancedToken, 12000, 21000, "BitcoinEther", "BTCE", 12, 1);
};
