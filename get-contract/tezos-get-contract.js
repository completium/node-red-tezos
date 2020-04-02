module.exports = function(RED) {
    'use stric';
    const { Tezos } = require('@taquito/taquito');
    var objectConstructor = ({}).constructor;
    function hasOwnProperty(obj, prop) {
        var proto = obj.__proto__ || obj.constructor.prototype;
        return (obj.constructor === objectConstructor) && (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
    }
    function TezosGetContract(config) {
        RED.nodes.createNode(this,config);
        this.rpc = config.rpc;
        this.addr = config.addr;
        var node = this;
        var methods = [];
        node.on('input', function(msg) {
            // overwrite node parameter with payload data
            if (hasOwnProperty(msg.payload,'addr')) {
                node.addr = msg.payload.addr;
            }
            Tezos.setProvider({ rpc: node.rpc });
            this.status({fill:"grey",shape:"dot",text:"retrieving contract ..."});
            Tezos.contract.at(node.addr)
            .then(contract => {
                methods = contract.parameterSchema.ExtractSignatures();
                return contract.storage();
            })
            .then(storage => {
                msg.payload = { methods:methods, storage:storage };
                this.status({});
                node.send(msg);
            })
            .catch(error => {
                this.status({fill:"red",shape:"dot",text:"fail!"});
                console.log(`Error: ${error}`);
            });
        });
    }
    RED.nodes.registerType("tezos-get-contract",TezosGetContract);
}