const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
const OpiriaToken = artifacts.require("./OpiriaToken.sol");


const web3 = OpiriaCrowdsale.web3;

const advanceToPresale = require("../scripts/timings").advanceToPresale;
const resetTimes = require("../scripts/timings").resetTimes;

const BigNumber = require('big-number');


contract('OpiriaCrowdsale', function (accounts) {
    const owner = accounts[0];
    const tester = accounts[2];

    it("should start with 0 tokens", async () => {
        let tokenInstance = await OpiriaToken.deployed();
        let testerBalance = await tokenInstance.balanceOf.call(tester);
        assert.equal(testerBalance.toNumber(), 0, `doesn't have 0 tokens`);
    });

    it("should not accept payment before presale", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();

        try {
            let presaleWeiLimit = await csInstance.presaleWeiLimit.call();

            const amountToSend = presaleWeiLimit.mul(2);

            // let tx = await csInstance.send(amountToSend.toString(), {from: tester, gas: 500 * 1000});
            await web3.eth.sendTransaction({
                from: tester,
                to: csInstance.address,
                value: amountToSend.toNumber(),
                gas: 500 * 1000
            });
            console.log("pe then");
        }
        catch (err) {
            // console.log("pe catch: " + err.message);
            if (err.message === "VM Exception while processing transaction: revert") {
                return;
            }
            else {
                assert.equal(err.receipt.status, '0x00', 'status not 0')
            }
        }
    });

    let amountToSend;

    it("should accept payment in presale", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();

        const actualOwner = await csInstance.owner.call();
        assert.equal(actualOwner, owner, "invalid owner");
        await advanceToPresale(csInstance);

        const isPresale = await csInstance.isPresale.call();
        const isSale = await csInstance.isSale.call();
        assert.equal(isSale, false, "in sale?");
        assert.equal(isPresale, true, "not in presale");

        try {

            let presaleWeiLimit = await csInstance.presaleWeiLimit.call();

            amountToSend = (new BigNumber(presaleWeiLimit.toString())).div(new BigNumber(10).pow(18)).add(1)
                .mult(new BigNumber(10).pow(18));
            let tx2 = await web3.eth.sendTransaction({
                from: tester,
                to: csInstance.address,
                value: amountToSend.toString(),
                gas: 500 * 1000
            });
        }
        catch (err) {
            console.log("pe catch: ", err);
            assert.isOk(false, "not ok, crashed");
        }
        // await resetTimes(csInstance, owner);
    });


    //tokens should be send after last test
    it("should receive tokens after payment", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();

        let tokenInstance = await OpiriaToken.deployed();
        let testerBalance = await tokenInstance.balanceOf.call(tester);

        const etherUsdRate = await csInstance.etherUsdRate.call();

        let tokenToReceive = new BigNumber(amountToSend).mult(etherUsdRate).mult(10);
        assert.equal(testerBalance.toString(10), tokenToReceive.toString(10), `invalid tokens number`);

    });

    it("should see bonus locked after payment", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();
        const etherUsdRate = await csInstance.etherUsdRate.call();
        let bonusTokens = new BigNumber(amountToSend).mult(etherUsdRate).mult(10).mult(20).div(100);
        const actualBonus = await csInstance.bonusOf.call(tester);
        assert.equal(bonusTokens.toString(10), actualBonus.toString(10), `invalid tokens bonus number`);
    });



});
