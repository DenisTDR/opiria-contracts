const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
const OpiriaToken = artifacts.require("./OpiriaToken.sol");

// const eth = OpiriaCrowdsale.web3.eth;

const generateTimes = require("../scripts/generateTimes");


module.exports = function (deployer, environment, accounts) {

    const caller = accounts[0];

    const realNow = Math.round(new Date().getTime() / 1000);
    const latestBlockNow = web3.eth.getBlock('latest').timestamp;

    const now = Math.max(realNow, latestBlockNow);

    const presaleStartsIn = 60;
    const presaleDuration = 3600 * 24 * 3;
    const timeBetweenSales = 10;
    const saleDuration = 3600 * 24 * 10;

    const initialEtherUsdRate = require("../scripts/initial-config").initialEtherUsdRate;

    const times = generateTimes(now, presaleStartsIn, presaleDuration, timeBetweenSales, saleDuration);
    deployer.deploy(OpiriaToken, {from: caller}).then(() => {
        const constructorParams = [100, accounts[3], OpiriaToken.address, ...times, initialEtherUsdRate];
        // console.log("deployed token: " + OpiriaToken.address);
        return deployer.deploy(OpiriaCrowdsale, ...constructorParams, {from: caller}).then(() => {
            // console.log("deployed crowdsale: " + OpiriaCrowdsale.address);
            let tokenInstance;
            return OpiriaToken.deployed().then(instance => {
                // console.log(instance);
                tokenInstance = instance;
                return tokenInstance.owner.call();
            }).then(owner => {
                // console.log("old token owner: " + owner);
                return tokenInstance.transferOwnership(OpiriaCrowdsale.address, {from: caller});
            }).then(_ => {
                // return tokenInstance.owner.call();
            }).then(owner => {
                // console.log("new token owner: " + owner);
                // console.log("changed token owner");
                console.log("deployed");
            });
        });
    });
};

