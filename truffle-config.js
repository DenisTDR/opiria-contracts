module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        development: {
            host: "localhost",
            port: 5411,
            network_id: "*", // Match any network id
            // gas: 10 * 1000 * 1000
        }
    }
    // ,
    // optimizer: {
    //     enabled: true,
    //     runs: 200
    // }
};
