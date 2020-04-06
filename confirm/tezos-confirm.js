module.exports = function (RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    var objectConstructor = ({}).constructor;
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (obj.constructor === objectConstructor) && (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
    function TezosConfirm(config) {
        RED.nodes.createNode(this, config);
        this.rpc = config.rpc;
        this.confirmation = config.confirmation;
        var node = this;
        node.on('input', function (msg) {
            if (hasOwnProperty(msg.payload, 'op')) {
                var op = msg.payload.op;
                Tezos.setProvider({ rpc: node.rpc });
                console.log(`Waiting for ${op.hash} to be confirmed...`);
                this.status({ fill: "blue", shape: "dot", text: "waiting for confirmation ..." });
                op.confirmation(node.confirmation)
                    .then(() => {
                        console.log(`Operation injected: https://carthagenet.tzstats.com/${op.hash}`);
                        this.status({});
                        msg.payload = { res: true, op: op.hash };
                        node.send(msg);
                    })
                    .catch(error => {
                        console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                        this.status({ fill: "red", shape: "ring", text: "fail" });
                        msg.payload = { res: false };
                        node.send(msg);
                    });
            } else {
                msg.payload = { res: false };
                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("tezos-confirm", TezosConfirm);
}