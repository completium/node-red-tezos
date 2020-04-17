module.exports = function(RED) {
    'use stric';
    const { TezosWalletUtil }  = require('conseiljs');
    var objectConstructor = ({}).constructor;
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (obj.constructor === objectConstructor) && (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
    function TezosGenerate(config) {
        RED.nodes.createNode(this,config);
        try {
            var obj = JSON.parse(config.mnemonic);
            this.mnemonic = obj.mnemonic.join(' ');
        } catch (e) { }
        //this.vars = config.vars;
        var node = this;
        node.on('input', function(msg) {
            // overwrite node parameter with payload data
            if (hasOwnProperty(msg.payload,'mnemonic')) {
                try {
                    var obj = JSON.parse(msg.payload.mnemonic);
                    node.mnemonic = obj.mnemonic.join(' ');
                } catch (e) { }
            } else if (hasOwnProperty(node,'mnemonic')) {
                // do nothing
            } else {
                node.mnemonic = TezosWalletUtil.generateMnemonic();
            }
            console.log(`mnemonic: ${node.mnemonic}`);
            this.status({fill:"grey",shape:"dot",text:"generating ..."});
            TezosWalletUtil.unlockIdentityWithMnemonic(node.mnemonic, '')
            .then (keystore => {
                console.log(`account id: ${keystore.publicKeyHash}`);
                console.log(`public key: ${keystore.publicKey}`);
                console.log(`secret key: ${keystore.privateKey}`);
                this.status({});
                msg.payload = {
                    res: true,
                    mnemonic: node.mnemonic.split(' '),
                    publicKeyHash: keystore.publicKeyHash,
                    publicKey: keystore.publicKey,
                    privateKey: keystore.privateKey
                };
                node.send(msg);
            })
            .catch(error => {
                console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                this.status({ fill: "red", shape: "ring", text: "fail" });
                msg.payload = { res: false };
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("tezos-generate",TezosGenerate);
}