const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
const generateTimes = require("../scripts/generateTimes");

//duration is in seconds
const increaseTime = function (duration) {
    const id = Date.now();
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1);

            web3.currentProvider.sendAsync({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id + 1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res)
            });
        });
    });
};

const increaseTimeTo = function (target) {
    let now = latestTime();
    if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
    let diff = target - now;
    return increaseTime(diff);
};

const latestTime = function () {
    const ts = web3.eth.getBlock('latest').timestamp;
    // console.log(ts);
    return ts;
};

const advanceToPresale = async (csInstance) => {
    let isPresale = await csInstance.isPresale.call();
    assert.equal(isPresale, false, "already in presale");
    const actualPresaleOpeningTime = await csInstance.presaleOpeningTime.call();
    const latestBlockTime = latestTime();
    const diff = actualPresaleOpeningTime - latestBlockTime;
    assert.isAbove(diff, 0, "diff is negative");
    // console.log("advanceToPresale diff=" + diff);
    await increaseTime(diff + 60);
};
const advanceToSale = async (csInstance) => {
    let isSale = await csInstance.isSale.call();
    assert.equal(isSale, false, "already in sale");
    const actualOpeningTime = await csInstance.openingTime.call();
    const latestBlockTime = latestTime();
    const diff = actualOpeningTime - latestBlockTime;
    assert.isAbove(diff, 0, "diff is negative");
    // console.log("advanceToSale diff=" + diff);

    await increaseTime(diff + 60);
};

const resetTimes = async (csInstance, caller, offset) => {
    const realNow = Math.round(new Date().getTime() / 1000);
    const latestBlockNow = web3.eth.getBlock('latest').timestamp;

    const actualPresaleOpeningTime = await csInstance.presaleOpeningTime.call();
    const now = Math.max(realNow, latestBlockNow, actualPresaleOpeningTime);
    if (!offset) {
        offset = 0;
    }
    const presaleStartsIn = 60 + offset;
    const presaleDuration = 3600 * 24 * 3;
    const timeBetweenSales = 10;
    const saleDuration = 3600 * 24 * 10;
    const times = generateTimes(now, presaleStartsIn, presaleDuration, timeBetweenSales, saleDuration);

    assert.isAbove(times[0], now);
    assert.isAbove(times[1], times[0]);
    assert.isAbove(times[2], times[1]);
    assert.isAbove(times[3], times[2]);
    const tx = await csInstance.changeTimes(...times, {
        from: caller,
        gas: 500 * 1000
    });
};

module.exports = {
    increaseTime, increaseTimeTo, latestTime, advanceToPresale, advanceToSale, resetTimes
};
