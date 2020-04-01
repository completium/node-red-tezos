module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    function CallTezosContract(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        this.addr = config.addr;
        var obj = JSON.parse(config.faucet);
        this.email = obj.email;
        this.password = obj.password;
        this.mnemonic = obj.mnemonic.join(' ');
        this.secret = obj.secret;
        this.entry = config.entry;
        this.arg = config.arg;
        var node = this;
        node.on('input', function(msg) {
            Tezos.setProvider({ rpc: node.rpc });
            Tezos.importKey(
                node.email,
                node.password,
                node.mnemonic,
                node.secret
            );
            Tezos.contract.at(node.addr)
            .then(contract => {
                const i = 7;
                console.log(`Incrementing storage value by ${i}...`);
                return contract.methods.increment(i).send();
            })
            .then(op => {
                console.log(`Waiting for ${op.hash} to be confirmed...`);
                return op.confirmation(1).then(() => op.hash);
            })
            .then(hash => {
                    console.log(`Operation injected: https://carthagenet.tzstats.com/${hash}`);
                    msg.payload = { res:true, op:hash };
                    node.send(msg);
                })
            .catch(error => {
                  println(`Error: ${JSON.stringify(error, null, 2)}`);
                  msg.payload = { res:false };
                  node.send(msg);
            });
        });
        /* Tezos.tz
                .getBalance(node.addr)
                .then(balance => {
                    msg.payload = balance.toNumber() / 1000000;
                    node.send(msg);
                })
                .catch(error => console.log(JSON.stringify(error)));
        }); */
    }
    RED.nodes.registerType("call-tezos-contract",CallTezosContract);
}