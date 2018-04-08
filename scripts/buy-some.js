const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
const BigNumber = require('big-number');

module.exports = async (callback) => {
    const csInstance = await OpiriaCrowdsale.deployed();

    const buyer = web3.eth.accounts[4];

    let presaleWeiLimit = await csInstance.presaleWeiLimit.call();

    const amountToSend = (new BigNumber(presaleWeiLimit.toString())).div(new BigNumber(10).pow(18)).add(1)
        .mult(new BigNumber(10).pow(18));
    let tx2 = await web3.eth.sendTransaction({
        from: buyer,
        to: csInstance.address,
        value: amountToSend.toString(),
        gas: 500 * 1000
    });
    callback();
};