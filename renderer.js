let net = require('net');
let port = 20000;
let ip_addr = '127.0.0.1';

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

module.exports = {
    client : net.connect(port,ip_addr)
}