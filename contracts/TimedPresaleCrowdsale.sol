pragma solidity ^0.4.0;

import '../zeppelin-solidity/contracts/math/SafeMath.sol';
import '../zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol';
import '../zeppelin-solidity/contracts/ownership/Ownable.sol';
import '../zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol';

contract TimedPresaleCrowdsale is FinalizableCrowdsale {
    using SafeMath for uint256;

    uint256 public presaleOpeningTime;
    uint256 public presaleClosingTime;

    event CrowdsaleTimesChanged(uint256 presaleOpeningTime, uint256 presaleClosingTime, uint256 openingTime, uint256 closingTime);

    /**
     * @dev Reverts if not in crowdsale time range.
     */
    modifier onlyWhileOpen {
        require(isPresale() || isSale());
        _;
    }


    function TimedPresaleCrowdsale(uint256 _presaleOpeningTime, uint256 _presaleClosingTime, uint256 _openingTime, uint256 _closingTime)
    TimedCrowdsale(_openingTime, _closingTime) {

        changeTimes(_presaleOpeningTime, _presaleClosingTime, _openingTime, _closingTime);
    }

    function changeTimes(uint256 _presaleOpeningTime, uint256 _presaleClosingTime, uint256 _openingTime, uint256 _closingTime) public onlyOwner {
        require(_presaleOpeningTime >= now);
        require(_presaleClosingTime >= _presaleOpeningTime);
        require(_openingTime >= _presaleClosingTime);
        require(_closingTime >= _openingTime);

        presaleOpeningTime = _presaleOpeningTime;
        presaleClosingTime = _presaleClosingTime;
        openingTime = _openingTime;
        closingTime = _closingTime;

        CrowdsaleTimesChanged(_presaleOpeningTime, _presaleClosingTime, _openingTime, _closingTime);
    }

    function isPresale() public view returns (bool) {
        return now >= presaleOpeningTime && now <= presaleClosingTime;
    }

    function isSale() public view returns (bool) {
        return now >= openingTime && now <= closingTime;
    }
}
