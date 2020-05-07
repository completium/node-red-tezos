module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    const { InMemorySigner } = require ('@taquito/signer');
    var objectConstructor = ({}).constructor;
    function executeFunctionByName(functionName, context /*, args */) {
        //var args = Array.prototype.slice.call(arguments, 2);
        var args = arguments[2];
        var namespaces = functionName.split(".");
        var func = namespaces.pop();
        for(var i = 0; i < namespaces.length; i++) {
          context = context[namespaces[i]];
        }
        //console.log(args);
        return context[func].apply(context, args);
    }
    function TezosCallContract(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        this.addr = config.addr;
        try {
            var obj = JSON.parse(config.faucet);
            this.email = obj.email;
            this.password = obj.password;
            this.mnemonic = obj.mnemonic.join(' ');
            this.secret = obj.secret;
        } catch(e) {}
        this.entry = config.entry;
        this.args = [config.arg];
        var node = this;
        node.on('input', function(msg) {
            // overwrite node parameter with payload data
            if ('addr' in msg.payload) {
                console.log("payload has addr field");
                node.addr = msg.payload.addr;
            }
            if ('faucet' in msg.payload) {
                var obj = JSON.parse(msg.payload.faucet);
                node.email = obj.email;
                node.password = obj.password;
                node.mnemonic = obj.mnemonic.join(' ');
                node.secret = obj.secret;
                node.entry = msg.payload.entry;
            }
            if ('entry' in msg.payload) {
                node.entry = msg.payload.entry;
            }
            if ('args' in msg.payload) {
                node.args = msg.payload.args;
            }
            var provider = { rpc: node.rpc };
            if ('secret' in msg.payload) {
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
            console.log(`Calling "${node.entry}" of "${node.addr}"`);
            Tezos.contract.at(node.addr)
            .then(contract => {
                console.log(`Calling "${node.entry}" with arg ${node.args}...`);
                this.status({fill:"grey",shape:"dot",text:"calling ..."});
                return executeFunctionByName("methods."+node.entry, contract, node.args).send();
            })
            .then(op => {
                console.log(`Operation ${op.hash} created.`);
                this.status({});
                msg.payload.call = {
                    res:true,
                    op: {
                        "hash"    : op.hash,
                        "raw"     : op.raw,
                        "results" : op.results,
                        "context" : op.context,
                        "params"  : op.params
                    }
                };
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
    RED.nodes.registerType("tezos-call-contract",TezosCallContract);
}