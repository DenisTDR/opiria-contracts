const generateTimes = function (now, presaleStartsIn, presaleDuration, timeBetweenSales, saleDuration) {

    const presaleStartTime = now + presaleStartsIn;
    const presaleEndTime = presaleStartTime + presaleDuration;
    const startTime = presaleEndTime + timeBetweenSales;
    const endTime = startTime + saleDuration;

    return [presaleStartTime, presaleEndTime, startTime, endTime]
};


module.exports = generateTimes;