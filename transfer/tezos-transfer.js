module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    var objectConstructor = ({}).constructor;
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (obj.constructor === objectConstructor) && (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
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
            if (hasOwnProperty(msg.payload,'faucet')) {
                try {
                    var obj = JSON.parse(msg.payload.faucet);
                    node.email = obj.email;
                    node.password = obj.password;
                    node.mnemonic = obj.mnemonic.join(' ');
                    node.secret = obj.secret;
                } catch (e) { }
            }
            if (hasOwnProperty(msg.payload,'destination')) {
                node.destination = msg.payload.destination;
            }
            if (hasOwnProperty(msg.payload,'amount')) {
                node.amount = msg.payload.amount;
            }
            Tezos.setProvider({ rpc: node.rpc });
            Tezos.importKey(
                node.email,
                node.password,
                node.mnemonic,
                node.secret
            );
            this.status({fill:"grey",shape:"dot",text:"transfering ..."});
            console.log("transferring ...");
            Tezos.contract.transfer({ to: node.desitnation, amount: node.amount })
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