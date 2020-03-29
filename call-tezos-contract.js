module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/mainnet' });
    function LowerCaseNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            Tezos.tz
                .getBalance('tz1NAozDvi5e7frVq9cUaC3uXQQannemB8Jw')
                .then(balance => {
                    msg.payload = balance.toNumber() / 1000000;
                    node.send(msg);
                })
                .catch(error => println(JSON.stringify(error)));
        });
    }
    RED.nodes.registerType("call-tezos-contract",LowerCaseNode);
}