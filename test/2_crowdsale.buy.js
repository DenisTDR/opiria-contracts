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

    it("should receive tokens after payment", async () => {
        const csInstance = await OpiriaCrowdsale.deployed();

        let tokenInstance = await OpiriaToken.deployed();
        let testerBalance = await tokenInstance.balanceOf.call(tester);

        const etherUsdRate = await csInstance.etherUsdRate.call();

        let tokenToReceive = new BigNumber(amountToSend).mult(etherUsdRate).mult(10).mult(120).div(100);
        assert.equal(testerBalance.toString(10), tokenToReceive.toString(10), `doesn't have received tokens`);

    });
    return;
    it("should not accept payment before presale 123", async () => {
        let tokenInstance;
        let csInstance;


        // await increaseTime(10 * 60);

        csInstance = await OpiriaCrowdsale.deployed();
        // console.log("csInstance.address=" + csInstance.address);

        // const initialBalance = await web3.eth.getBalance(tester);
        // console.log("initialBalance=" + initialBalance);
        try {
            let tx = await csInstance.send(web3.toWei(1.5, "ether"), {from: tester});
            console.log("pe then");
            // const newBalance = await web3.eth.getBalance(tester);
        }
        catch (err) {
            console.log("pe catch: " + err.message);
            if (err.message === "VM Exception while processing transaction: revert") {
                return;
            }
            else {
                assert.equal(err.receipt.status, '0x00', 'status not 0')
            }
            // assert.equal(err.message, "VM Exception while processing transaction: revert", "different error");
        }
    });
});
