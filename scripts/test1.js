// var OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
// var OpiriaToken = artifacts.require("./OpiriaToken.sol");

const isAddress = require("./address.checker");

module.exports = function (callback) {
    // const realNow = Math.round(new Date().getTime() / 1000);
    // const latestBlockNow = web3.eth.getBlock('latest').timestamp;
    // console.log(realNow);
    // console.log(latestBlockNow);
    console.log(isAddress("0x6425c6BE902d692AE2db752B3c268AFAdb099D3ba"));
    console.log(isAddress("0x6425c6BE902d692AE2db752B3c268AFAdb099D3x".toLowerCase()));
    console.log(isAddress("0x6425c6BE902d692AE2db752B3c268AFAdb099D3B".toUpperCase()));
    callback();

};