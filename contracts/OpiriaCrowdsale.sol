pragma solidity ^0.4.0;

import './TimedPresaleCrowdsale.sol';
import '../zeppelin-solidity/contracts/math/SafeMath.sol';
import '../zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import './TokenCappedCrowdsale.sol';
import '../zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';

contract OpiriaCrowdsale is TimedPresaleCrowdsale, MintedCrowdsale, TokenCappedCrowdsale {
    using SafeMath for uint256;

    uint256 public presaleBonusPercent;
    uint256 public presaleWeiLimit;

    uint256 public etherUsdRate;


    uint256 public totalBonus = 0;
    mapping(address => uint256) bonus;

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
        // 1 ether * etherUsdRate * 10    * (100 * bonusPercent) / 100

        return _weiAmount.mul(etherUsdRate * 10).div(100);
    }

    function _getBonusPercent() internal view returns (uint8) {
        if (isPresale()) {
            return 20;
        }
        uint256 daysPassed = (now - openingTime) / 1 days;
        uint8 calcPercent = 0;
        if (daysPassed < 15) {
            // daysPassed will be less than 15 so no worries about overflow here
            calcPercent = (15 - uint8(daysPassed));
        }
        return calcPercent;
    }

    //overridden
    function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
        _saveBonus(_beneficiary, _tokenAmount);
        _deliverTokens(_beneficiary, _tokenAmount);
    }

    function _saveBonus(address _beneficiary, uint256 tokens) internal {
        uint8 bonusPercent = _getBonusPercent();
        if (bonusPercent > 0) {
            uint256 bonusAmount = tokens.mul(bonusPercent).div(100);
            totalBonus = totalBonus.add(bonusAmount);
            bonus[_beneficiary] = bonus[_beneficiary].add(bonusAmount);
        }
    }

    //overridden
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        if (isPresale()) {
            require(_weiAmount >= presaleWeiLimit);
        }
        else {
            uint256 hoursFromOpening = (now - openingTime) / 1 hours;
            if (hoursFromOpening < 4) {
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


    ///TODO: handle bonuses separately + check
    /// TODO: team tokens claimance

    /**
    * Send tokens by the owner directly to an address.
    */
    function sendTokensTo(uint256 amount, address to) public onlyOwner {
        require(!isFinalized);
        require(notExceedingSaleCap(amount));
        require(MintableToken(token).mint(to, amount));
        TokenPurchase(msg.sender, to, 0, amount);
    }

    function unlockTokenTransfers() public onlyOwner {
        require(isFinalized);
        require(now > closingTime + 30 days);
        require(PausableToken(token).paused());
        PausableToken(token).unpause();
    }


    function distributeBonus(address[] addresses) onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            if (bonus[addresses[i]] > 0) {
                uint256 bonusAmount = bonus[addresses[i]];
                _deliverTokens(addresses[i], bonusAmount);
                totalBonus = totalBonus.sub(bonusAmount);
                bonus[addresses[i]] = 0;
            }
        }
    }

}
