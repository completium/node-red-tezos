module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    function CallTezosContract(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        this.addr = config.addr;
        var node = this;
        node.on('input', function(msg) {
            Tezos.setProvider({ rpc: node.rpc });
            Tezos.tz
                .getBalance(node.addr)
                .then(balance => {
                    msg.payload = balance.toNumber() / 1000000;
                    node.send(msg);
                })
                .catch(error => console.log(JSON.stringify(error)));
        });
    }
    RED.nodes.registerType("call-tezos-contract",CallTezosContract);
}