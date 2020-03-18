var PassageMain = artifacts.require("./PassageMain.sol");

module.exports = function(deployer) {
  deployer.deploy(PassageMain, { gas: 5000000 });
};
