pragma solidity ^0.4.0;

import './TimedPresaleCrowdsale.sol';
import '../zeppelin-solidity/contracts/math/SafeMath.sol';
import '../zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import './TokenCappedCrowdsale.sol';

contract OpiriaCrowdsale is TimedPresaleCrowdsale, MintedCrowdsale, TokenCappedCrowdsale {
    using SafeMath for uint256;

    uint256 public presaleBonusPercent;
    uint256 public presaleWeiLimit;

    uint256 public etherUsdRate;

    // Crowdsale(uint256 _rate, address _wallet, ERC20 _token)
    function OpiriaCrowdsale(uint256 _rate, address _wallet, ERC20 _token,
        uint256 _presaleOpeningTime, uint256 _presaleClosingTime, uint256 _openingTime, uint256 _closingTime,
        uint16 _initialEtherUsdRate) public
    TimedPresaleCrowdsale(_presaleOpeningTime, _presaleClosingTime, _openingTime, _closingTime)
    Crowdsale(_rate, _wallet, _token) {
        setEtherUsdRate(_initialEtherUsdRate);
    }

    //overridden
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        uint256 bonusPercent = _getBonusPercent();

        // 1 ether * etherUsdRate * 10    * (100 * bonusPercent) / 100

        return _weiAmount.mul(etherUsdRate * 10 * (100 + bonusPercent)).div(100);
    }

    function _getBonusPercent() internal view returns (uint256) {
        if (isPresale()) {
            return 20;
        }
        uint256 daysPassed = (now - openingTime) / 1 days;
        uint256 calcRate = 100;
        if (daysPassed < 15) {
            calcRate += (15 - daysPassed);
        }
        return calcRate;
    }

    //overridden
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        if (isPresale()) {
            require(_weiAmount >= presaleWeiLimit);
        }
        else {
            uint256 hoursUntilOpening = (now - openingTime) / 1 hours;
            if (hoursUntilOpening < 4) {
                require(_weiAmount <= 1 ether);
            }
        }

        uint256 tokens = _getTokenAmount(_weiAmount);
        require(notExceedingSaleCap(tokens));

    }

    function setEtherUsdRate(uint16 _etherUsdRate) public onlyOwner {
        etherUsdRate = _etherUsdRate;

        // the presaleWeiLimit must be 5000 in eth at the defined 'etherUsdRate'
        // presaleWeiLimit = 1 ether / etherUsdRate * 5000
        presaleWeiLimit = uint256(1 ether).mul(5000).div(etherUsdRate);
    }


    ///TODO: handle bonuses separately

    /**
    * Send tokens by the owner directly to an address.
    */
    function sendTokensTo(uint256 amount, address to) public onlyOwner {
        require(!isFinalized);
        require(notExceedingSaleCap(amount));
        require(MintableToken(token).mint(to, amount));
        TokenPurchase(msg.sender, to, 0, amount);
    }

}
