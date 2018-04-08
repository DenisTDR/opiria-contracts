const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
const OpiriaToken = artifacts.require("./OpiriaToken.sol");

// const eth = OpiriaCrowdsale.web3.eth;
const crowdsaleConstructorParameters = require("../scripts/crowdsale-constructor-parameters.factory");

module.exports = function (deployer, environment, accounts) {

    const caller = accounts[0];


    deployer.deploy(OpiriaToken, {from: caller}).then(() => {

        const constructorParams = crowdsaleConstructorParameters(OpiriaToken.address, web3, accounts);
        return deployer.deploy(OpiriaCrowdsale, ...constructorParams, {from: caller}).then(() => {
            let tokenInstance;
            return OpiriaToken.deployed().then(instance => {
                tokenInstance = instance;
                return tokenInstance.pause();
            }).then(() => {
                return tokenInstance.transferOwnership(OpiriaCrowdsale.address, {from: caller});
            }).then(() => {
                // console.log("deployed");
            });
        });
    });
};

