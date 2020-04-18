module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    var objectConstructor = ({}).constructor;
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (obj.constructor === objectConstructor) && (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
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
            if (hasOwnProperty(msg.payload,'faucet')) {
                try {
                    var obj = JSON.parse(msg.payload.faucet);
                    node.email = obj.email;
                    node.password = obj.password;
                    node.mnemonic = obj.mnemonic.join(' ');
                    node.secret = obj.secret;
                } catch (e) { }
            }
            if (hasOwnProperty(msg.payload,'code')) {
                node.code = msg.payload.code;
            }
            if (hasOwnProperty(msg.payload,'storage')) {
                node.storage = msg.payload.storage;
            } else if (hasOwnProperty(msg.payload,'init')) {
                withInit = true;
                node.init = msg.payload.init;
            }
            Tezos.setProvider({ rpc: node.rpc });
            Tezos.importKey(
                node.email,
                node.password,
                node.mnemonic,
                node.secret
            );
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