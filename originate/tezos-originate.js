module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    const { InMemorySigner } = require ('@taquito/signer');
    var objectConstructor = ({}).constructor;
    function TezosOriginate(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        try {
            var obj = JSON.parse(config.faucet);
            this.email = obj.email;
            this.password = obj.password;
            this.mnemonic = obj.mnemonic.join(' ');
            this.secret = obj.secret;
        } catch (e) {}
        this.entry = config.entry;
        try { this.code = JSON.parse(config.code); } catch (e) { }
        try { this.storage = JSON.parse(config.storage); } catch (e) { }
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
            if (Array.isArray(msg.payload) && 'code' in msg.payload) {
                node.code = msg.payload.code;
            }
            if (Array.isArray(msg.payload) && 'storage' in msg.payload) {
                node.storage = msg.payload.storage;
            } else if (Array.isArray(msg.payload) && 'init' in msg.payload) {
                withInit = true;
                node.init = msg.payload.init;
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
            this.status({fill:"grey",shape:"dot",text:"originating ..."});
            console.log("calling originate ...");
            var arg;
            if (withInit) {
                arg = {
                    code: node.code,
                    init: node.init
                }
            } else {
                arg = {
                    code: node.code,
                    storage: node.storage
                }
            }
            Tezos.contract.originate(arg).then(originationOp => {
                this.status({fill:"green",shape:"dot",text:"retrieving address ..."});
                return originationOp.contract();
            }).then(contract => {
                this.status({});
                msg.payload = { res:true, addr:contract.address};
                node.send(msg);
            })
            .catch(error => {
                console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                this.status({fill:"red",shape:"ring",text:"fail"});
                msg.payload = { res:false };
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("tezos-originate",TezosOriginate);
}