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
        const tokensWallet = accounts[3];
        const weiWallet = accounts[3];
        const constructorParams = [OpiriaToken.address, initialEtherUsdRate,
            weiWallet, tokensWallet, ...times];
        return deployer.deploy(OpiriaCrowdsale, ...constructorParams, {from: caller}).then(() => {
            let tokenInstance;
            return OpiriaToken.deployed().then(instance => {
                tokenInstance = instance;
                return tokenInstance.transferOwnership(OpiriaCrowdsale.address, {from: caller});
            }).then(() => {
                // console.log("deployed");
            });
        });
    });
};

