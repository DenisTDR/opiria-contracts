const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");

const BigNumber = require('big-number');


const generateTimes = require("../scripts/generateTimes");
const advanceToPresale = require("../scripts/timings").advanceToPresale;
const advanceToSale = require("../scripts/timings").advanceToSale;
const resetTimes = require("../scripts/timings").resetTimes;


contract('OpiriaCrowdsale', function (accounts) {
    const caller = accounts[0];
    // {from: caller}

    it("should increase time to presale", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();
        await advanceToPresale(csInstance);
        const isPresale = await csInstance.isPresale.call();
        assert.equal(isPresale, true, "not in presale");
        await resetTimes(csInstance, caller);
    });


    it("should increase time to sale", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();

        const isPresale = await csInstance.isPresale.call();
        assert.equal(isPresale, false, "is presale before testing for sale ...");

        await advanceToSale(csInstance);
        const isSale = await csInstance.isSale.call();
        assert.equal(isSale, true, "not in sale");
        await resetTimes(csInstance, caller);

    });

    it("should change dates", async () => {


        const realNow = Math.round(new Date().getTime() / 1000);
        const latestBlockNow = web3.eth.getBlock('latest').timestamp;

        const now = Math.max(realNow, latestBlockNow);

        const presaleStartsIn = 10;
        const presaleDuration = 3600 * 24 * 3;
        const timeBetweenSales = 10;
        const saleDuration = 3600 * 24 * 10;

        let actualPresaleOpeningTime;
        let actualPresaleClosingTime;
        let actualOpeningTime;
        let actualClosingTime;

        const times = generateTimes(now, presaleStartsIn, presaleDuration, timeBetweenSales, saleDuration);
        let csInstance = await OpiriaCrowdsale.deployed();
        const tx = await csInstance.changeTimes(...times, {from: caller});
        // console.log("awaiting random ...");
        // await timeout(45 * 1000);

        actualPresaleOpeningTime = await csInstance.presaleOpeningTime.call();
        actualPresaleClosingTime = await csInstance.presaleClosingTime.call();
        actualOpeningTime = await csInstance.openingTime.call();
        actualClosingTime = await csInstance.closingTime.call();

        assert.equal(actualPresaleOpeningTime.toNumber(), times[0], `presaleOpeningTime not updated`);
        assert.equal(actualPresaleClosingTime.toNumber(), times[1], `presaleClosingTime not updated`);
        assert.equal(actualOpeningTime.toNumber(), times[2], `openingTime not updated`);
        assert.equal(actualClosingTime.toNumber(), times[3], `closingTime not updated `);

        await resetTimes(csInstance, caller);

        assert.isAbove(actualPresaleOpeningTime.toNumber(), now, "invalid reset");
    });

    it("should change etherUsdRate", async () => {
        let etherUsdRateToSet = 1000;
        let presaleWeiLimitCalc = BigNumber(10).pow(18).mult(5000).div(etherUsdRateToSet);

        let csInstance = await OpiriaCrowdsale.deployed();
        await csInstance.setEtherUsdRate(etherUsdRateToSet, {from: caller});
        let etherUsdRate = await csInstance.rate.call();
        assert.equal(etherUsdRate.toNumber(), etherUsdRateToSet, "etherUsdRate not updated");
        let presaleWeiLimit = await csInstance.presaleWeiLimit.call();
        // console.log("presaleWeiLimit    =" + presaleWeiLimit);
        // console.log("presaleWeiLimitCalc=" + presaleWeiLimitCalc);
        assert.equal(presaleWeiLimit.toString(), presaleWeiLimitCalc.toString(), "etherUsdRate not updated");


        const initialEtherUsdRate = require("../scripts/initial-config").initialEtherUsdRate;
        await csInstance.setEtherUsdRate(initialEtherUsdRate, {from: caller});
    });
});


const timeout = ms => new Promise(res => setTimeout(res, ms));
