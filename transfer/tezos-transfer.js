module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    const { InMemorySigner } = require ('@taquito/signer');
    var objectConstructor = ({}).constructor;
    function TezosTransfer(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        try {
            var obj = JSON.parse(config.faucet);
            this.email = obj.email;
            this.password = obj.password;
            this.mnemonic = obj.mnemonic.join(' ');
            this.secret = obj.secret;
        } catch (e) { }
        this.destination = config.destination;
        this.amount = config.amount;
        //this.vars = config.vars;
        var node = this;
        var withInit = false;
        node.on('input', function(msg) {
            // overwrite node parameter with payload data
            if (Array.isArray(msg.payload) && 'faucet' in msg.payload) {
                try {
                    var obj = JSON.parse(msg.payload.faucet);
                    node.email = obj.email;
                    node.password = obj.password;
                    node.mnemonic = obj.mnemonic.join(' ');
                    node.secret = obj.secret;
                } catch (e) { }
            }
            if (Array.isArray(msg.payload) && 'destination' in msg.payload) {
                node.destination = msg.payload.destination;
            }
            if (Array.isArray(msg.payload) && 'amount' in msg.payload) {
                node.amount = msg.payload.amount;
            }
            var provider = { rpc: node.rpc };
            if (Array.isArray(msg.payload) && 'secret' in msg.payload) {
                provider.signer = new InMemorySigner(msg.payload.secret);
                Tezos.setProvider(provider);
            } else {
                Tezos.setProvider(provider);
                Tezos.importKey(
                    node.email,
                    node.password,
                    node.mnemonic,
                    node.secret
                );
            }

            this.status({fill:"grey",shape:"dot",text:"transfering ..."});
            console.log("transferring "+node.amount+" to "+node.destination);
            Tezos.contract.transfer({ to: node.destination, amount: node.amount })
            .then(op => {
                console.log(`Operation ${op.hash} created.`);
                this.status({});
                msg.payload = { res:true, op: op };
                node.send(msg);
            })
            .catch(error => {
                console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                this.status({fill:"red",shape:"dot",text:"fail!"})
            });
        });
    }
    RED.nodes.registerType("tezos-transfer",TezosTransfer);
}