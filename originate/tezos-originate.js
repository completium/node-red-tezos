module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
    function TezosOriginate(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        var obj = JSON.parse(config.faucet);
        this.email = obj.email;
        this.password = obj.password;
        this.mnemonic = obj.mnemonic.join(' ');
        this.secret = obj.secret;
        this.entry = config.entry;
        this.code = JSON.parse(config.code);
        this.storage = JSON.parse(config.storage);
        //this.vars = config.vars;
        var node = this;
        node.on('input', function(msg) {
            // overwrite node parameter with payload data
            if (hasOwnProperty(msg.payload,'code')) {
                node.code = JSON.parse(msg.payload.entry);
            }
            if (hasOwnProperty(msg.payload,'storage')) {
                node.storage = JSON.parse(msg.payload.storage);
            }
            Tezos.setProvider({ rpc: node.rpc });
            Tezos.importKey(
                node.email,
                node.password,
                node.mnemonic,
                node.secret
            );
            this.status({fill:"grey",shape:"dot",text:"originating ..."});
            Tezos.contract.originate({
                code: node.code,
                storage: node.storage
            }).then(originationOp => {
                this.status({fill:"green",shape:"dot",text:"retrieving address ..."});
                return originationOp.contract();
            }).then(contract => {
                console.log(contract.contractAddress);
                this.status({});
                msg.payload = { res:true, addr:contract.contractAddress};
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