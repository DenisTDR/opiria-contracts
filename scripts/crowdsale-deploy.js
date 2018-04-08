
const crowdsaleConstructorParameters = require("./crowdsale-constructor-parameters.factory");


module.exports = async (web3, accounts, artifacts) => {

    const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
    const OpiriaToken = artifacts.require("./OpiriaToken.sol");

    const caller = accounts[0];

    return OpiriaToken.new({from: caller}).then(tokenInstance => {
        const constructorParams = crowdsaleConstructorParameters(tokenInstance.address, web3, accounts);
        return OpiriaCrowdsale.new(...constructorParams, {from: caller}).then(csInstance => {
            return tokenInstance.pause()
                .then(() => {
                    return tokenInstance.transferOwnership(csInstance.address, {from: caller});
                }).then(() => {
                    return csInstance;
                });
        });
    });
};