let net = require('net');

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

function Connector(){}

Connector.prototype.connect = function(){
    net.connect(20000,'127.0.0.1');
}

module.exports = {
    Connector: Connector
}