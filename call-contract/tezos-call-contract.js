module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
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
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
    function TezosCallContract(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        this.addr = config.addr;
        var obj = JSON.parse(config.faucet);
        this.email = obj.email;
        this.password = obj.password;
        this.mnemonic = obj.mnemonic.join(' ');
        this.secret = obj.secret;
        this.entry = config.entry;
        this.args = [config.arg];
        var node = this;
        node.on('input', function(msg) {
            // overwrite node parameter with payload data
            if (hasOwnProperty(msg.payload,'addr')) {
                node.addr = msg.payload.addr;
            }
            if (hasOwnProperty(msg.payload,'faucet')) {
                var obj = JSON.parse(msg.payload.faucet);
                node.email = obj.email;
                node.password = obj.password;
                node.mnemonic = obj.mnemonic.join(' ');
                node.secret = obj.secret;
                node.entry = msg.payload.entry;
            }
            if (hasOwnProperty(msg.payload,'entry')) {
                node.entry = msg.payload.entry;
            }
            if (hasOwnProperty(msg.payload,'args')) {
                node.args = msg.payload.args;
            }
            Tezos.setProvider({ rpc: node.rpc });
            Tezos.importKey(
                node.email,
                node.password,
                node.mnemonic,
                node.secret
            );
            Tezos.contract.at(node.addr)
            .then(contract => {
                console.log(`Calling "${node.entry}" with arg ${node.args}...`);
                this.status({fill:"grey",shape:"dot",text:"calling ..."});
                return executeFunctionByName("methods."+node.entry, contract, node.args).send();
            })
            .then(op => {
                console.log(`Waiting for ${op.hash} to be confirmed...`);
                this.status({fill:"blue",shape:"dot",text:"waiting for confirmation ..."});
                return op.confirmation(1).then(() => op.hash);
            })
            .then(hash => {
                console.log(`Operation injected: https://carthagenet.tzstats.com/${hash}`);
                this.status({});
                msg.payload = { res:true, op:hash };
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