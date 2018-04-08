const OpiriaCrowdsale = artifacts.require("./OpiriaCrowdsale.sol");
const OpiriaToken = artifacts.require("./OpiriaToken.sol");

const BigNumber = require('big-number');

const isAddress = require("../scripts/address.checker");

const crowdsaleDeploy = require("../scripts/crowdsale-deploy");

contract('OpiriaCrowdsale',  (accounts) => {

    let csInstance = null;
    let tokenInstance = null;

    beforeEach(async () => {
        if(csInstance !== null) {
            return;
        }

        csInstance = await crowdsaleDeploy(web3, accounts, artifacts);
        tokenInstance = await OpiriaToken.at(await csInstance.token.call());
    });

    it("should have token owned", async () => {

        const actualTokenAddress = await csInstance.token.call();
        assert.equal(actualTokenAddress, tokenInstance.address, "token invalid");

        const actualTokenOwner = await tokenInstance.owner.call();
        assert.equal(actualTokenOwner, csInstance.address, "token owner invalid");
    });

    it("should have wallet", async () => {

        const wallet = await csInstance.wallet.call();
        assert.equal(isAddress(wallet), true, "wallet not an eth address");
        // console.log("wallet=" + wallet);
    });
    it("should have initial etherUsedRate", async () => {

        const actualEtherUsdRate = await csInstance.rate.call();
        const etherUsdRateToTest = require("../scripts/initial-config").initialEtherUsdRate;
        assert.equal(actualEtherUsdRate.toNumber(), etherUsdRateToTest, "inequal etherUsdRate");

        let presaleWeiLimitCalc = BigNumber(10).pow(18).mult(5000).div(etherUsdRateToTest);
        let presaleWeiLimit = await csInstance.presaleWeiLimit.call();
        assert.equal(presaleWeiLimit.toString(), presaleWeiLimitCalc.toString(), "etherUsdRate not updated");
        // console.log("presaleWeiLimit=" + presaleWeiLimit);

    });

});