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

    address public tokensWallet;

    uint256 public totalBonus = 0;
    mapping(address => uint256) public bonusOf;

    // Crowdsale(uint256 _rate, address _wallet, ERC20 _token)
    function OpiriaCrowdsale(ERC20 _token, uint16 _initialEtherUsdRate, address _wallet, address _tokensWallet,
        uint256 _presaleOpeningTime, uint256 _presaleClosingTime, uint256 _openingTime, uint256 _closingTime
    ) public
    TimedPresaleCrowdsale(_presaleOpeningTime, _presaleClosingTime, _openingTime, _closingTime)
    Crowdsale(_initialEtherUsdRate, _wallet, _token) {
        setEtherUsdRate(_initialEtherUsdRate);
        tokensWallet = _tokensWallet;
    }

    //overridden
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        // 1 ether * etherUsdRate * 10

        return _weiAmount.mul(rate).mul(10);
    }

    function _getBonusAmount(uint256 tokens) internal view returns (uint256) {
        uint8 bonusPercent = _getBonusPercent();
        uint256 bonusAmount = tokens.mul(bonusPercent).div(100);
        return bonusAmount;
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

        soldTokens = soldTokens.add(_tokenAmount);
    }

    function _saveBonus(address _beneficiary, uint256 tokens) internal {
        uint256 bonusAmount = _getBonusAmount(tokens);
        if (bonusAmount > 0) {
            totalBonus = totalBonus.add(bonusAmount);
            soldTokens = soldTokens.add(bonusAmount);
            bonusOf[_beneficiary] = bonusOf[_beneficiary].add(bonusAmount);
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
        uint256 bonusTokens = _getBonusAmount(tokens);
        require(notExceedingSaleCap(tokens.add(bonusTokens)));
    }

    function setEtherUsdRate(uint16 _etherUsdRate) public onlyOwner {
        rate = _etherUsdRate;

        // the presaleWeiLimit must be 5000 in eth at the defined 'etherUsdRate'
        // presaleWeiLimit = 1 ether / etherUsdRate * 5000
        presaleWeiLimit = uint256(1 ether).mul(5000).div(rate);
    }


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
        require(now > closingTime + 60 days);
        for (uint i = 0; i < addresses.length; i++) {
            if (bonusOf[addresses[i]] > 0) {
                uint256 bonusAmount = bonusOf[addresses[i]];
                _deliverTokens(addresses[i], bonusAmount);
                totalBonus = totalBonus.sub(bonusAmount);
                bonusOf[addresses[i]] = 0;
            }
        }
    }


    function finalization() internal {
        super.finalization();

        // mint 25% of total Tokens (13% for development, 5% for company/team, 6% for advisors, 2% bounty) into team wallet
        uint256 toMintNow = totalTokens.mul(25).div(100);

        if (!capIncreased) {
            // if the cap didn't increase (according to whitepaper) mint the 50MM tokens to the team wallet too
            toMintNow = toMintNow.add(50 * 1000 * 1000);
        }
        _deliverTokens(tokensWallet, toMintNow);
    }

    uint8 public reservedTokensClaimStage = 0;

    function claimReservedTokens() public onlyOwner {

        uint256 toMintNow = totalTokens.mul(5).div(100);
        if (reservedTokensClaimStage == 0) {
            require(now > closingTime + 6 * 30 days);
            reservedTokensClaimStage = 1;
            _deliverTokens(tokensWallet, toMintNow);
        }
        else if (reservedTokensClaimStage == 1) {
            require(now > closingTime + 12 * 30 days);
            reservedTokensClaimStage = 2;
            _deliverTokens(tokensWallet, toMintNow);
        }
        else if (reservedTokensClaimStage == 2) {
            require(now > closingTime + 12 * 30 days);
            reservedTokensClaimStage = 3;
            _deliverTokens(tokensWallet, toMintNow);
        }
        else {
            revert();
        }
    }
}
