const generateTimes = require("./generateTimes");


module.exports = (tokenAddress, web3, accounts) => {
    const realNow = Math.round(new Date().getTime() / 1000);
    const latestBlockNow = web3.eth.getBlock('latest').timestamp;

    const now = Math.max(realNow, latestBlockNow);

    const presaleStartsIn = 30;
    const presaleDuration = 3600 * 24 * 3;
    const timeBetweenSales = 10;
    const saleDuration = 3600 * 24 * 10;

    const tokensWallet = accounts[1];
    const weiWallet = accounts[2];

    const initialEtherUsdRate = require("../scripts/initial-config").initialEtherUsdRate;

    const times = generateTimes(now, presaleStartsIn, presaleDuration, timeBetweenSales, saleDuration);

    const constructorParams = [tokenAddress, initialEtherUsdRate,
        weiWallet, tokensWallet, ...times];
    return constructorParams;
};