"use strict";
"use babel";

const {
    app,
    BrowserWindow,
    ipcMain,
} = require('electron')

const path = require('path');
const url = require('url');
const canvasPath = 'components/data/canvas.json';

const ipcRenderer = require('electron').ipcRenderer;
const parser = require('./components/Parser');
const rooms = require('./components/Rooms');
const canvas = require('./components/Canvas');
const WebSocketServer = require('websocket').server;
const http = require('http');

let net = require('net');
let port = 20000;
let ip_addr = '192.168.43.236';
let message_id_counter = 0;
let buffor = '';
let message;
let victorious = false;

const io = require('socket.io-client');
let socket;

let client = new net.Socket();
client.connect(port, ip_addr, () => {
    console.log('Connection succesfull!');
});

let Rooms = new rooms.Rooms();
let Parser = new parser.Parser();
let Canvas = new canvas.Canvas();

let roomListWindow;
let nickWindow;
let newRoomWindow;
let canvasWindow;
let user = '';
let currenCanvasRoom;
let chat_messages = [];

function sendData(data, client) {
    client.write(String(data), 'utf-8');
}

function createWindow() {
    roomListWindow = new BrowserWindow({
        width: 300,
        height: 600
    })
    roomListWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'components/roomListWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    roomListWindow.on('closed', function () {
        roomListWindow = null
    })
}

function createNickWindow() {
    nickWindow = new BrowserWindow({
        width: 400,
        height: 200,
        frame: true
    });
    // nickWindow.loadFile('components/NickWindow.html');
    nickWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'components/NickWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    nickWindow.on('closed', () => {
        nickWindow = null;
    })

    // ipcRenderer.sendTo(win,'dupa');
}

function createNewRoomWindow() {
    newRoomWindow = new BrowserWindow({
        width: 400,
        height: 200,
    });
    newRoomWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'components/AddNewRoom.html'),
        protocol: 'file:',
        slashes: true
    }));
    newRoomWindow.on('close', () => {
        newRoomWindow = null;
    });
}

function createCanvasWindow() {
    canvasWindow = new BrowserWindow({
        width: 900,
        height: 700,
    });
    canvasWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'components/CanvasWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    socket = io.connect('http://localhost:8899');
    canvasWindow.on('close', () => {
        canvasWindow = null;
        socket = null;
    });
}

//EVENT HANDLERS !!!

ipcMain.on('new-nick', (e, item) => {
    createWindow();
    user = item;
    //Add sending nick to serwer
    let pom = {
        "type": "REQUEST",
        "name": "NEW_USER",
        "content": {
            "name": user
        }
    }
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    client.write(String(data), 'utf-8');

    let pom2 = {
        "type": "REQUEST",
        "name": "GET_ROOM_LIST",
        "content": ""
    }
    data = Parser.parse(JSON.stringify(pom2), message_id_counter);
    sendData(data, client);

    roomListWindow.webContents.send('set-nick', item);
    nickWindow.close();
});

ipcMain.on('new-room-added', (e, room) => {
    Rooms.addNewRoom(room, user, 1);
    let pom = {
        "type": "REQUEST",
        "name": "NEW_ROOM",
        "content": {
            "name": room
        }
    }
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    client.write(String(data), 'utf-8');

    currenCanvasRoom = room;
    let content = {
        "roomName": currenCanvasRoom
    }

    createCanvasWindow();
    roomListWindow.close();
    newRoomWindow.close();
})

ipcMain.on('leave-gaming-room', () => {
    let pom = {
        "type": "REQUEST",
        "name": "QUIT_ROOM",
        "content": {
            "roomName": currenCanvasRoom
        }
    };
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    client.write(String(data), 'utf-8');

    createWindow();
    canvasWindow.close();
})

ipcMain.on('chat-msg-sent', (e, text) => {
    let pom = {
        "type": "INFO",
        "name": "CHAT_MSG",
        "content": {
            "text": text,
            "currentRoom": currenCanvasRoom
        }
    };
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    client.write(String(data), 'utf-8');
});

ipcMain.on('syn_canvas', (e, pixels, currentRoom) => {
    let content = {
        "pixels": pixels,
        "currentRoom": currentRoom
    };
    let pom = {
        "type": "REQUEST",
        "name": "SYN_CANVAS",
        "content": content
    };
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    message_id_counter++;
    client.write(String(data), 'utf-8');
    if(socket !== undefined) {
        socket.emit('test', 'test z main');
    }
});

ipcMain.on('new-room-window-open', (e, R) => {
    createNewRoomWindow();
    // newRoomWindow.webContents.send('new-room', R);
})

ipcMain.on('request-nick', (e) => {
    e.sender.send('request-nick-answer', user);
})

ipcMain.on('enter-game', (e, room) => {
    currenCanvasRoom = room;
    let content = {
        "roomName": currenCanvasRoom
    }

    let pom = {
        "type": "REQUEST",
        "name": "JOIN_ROOM",
        "content": {
            "roomName": room
        },
    }

    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    message_id_counter++;
    client.write(String(data), 'utf-8')
    createCanvasWindow();
    roomListWindow.close();
})

ipcMain.on('request-current-room', (e) => {
    let rum = {
        "name": currenCanvasRoom,
        "owner": user
    }
    e.sender.send('current-room-answer', rum);
})

ipcMain.on('exit-application', () => {
    roomListWindow.close();
})

ipcMain.on('ANSWER_GET_ROOM_LIST', (e, content) => {

});

ipcMain.on('request-chat-msgs', (e) => {
    e.sender.send('answer-chat-messages', chat_messages);
    chat_messages = [];
})

ipcMain.on('get-owner-user-data', (e) => {
    let pom3 = {
        "user": user,
        "owner": Rooms.getOwnerByRoomName(currenCanvasRoom),
    }
    e.sender.send('answer-owner-user-data', pom3);
})

ipcMain.on('ask-victory', (e) => {
    if (victorious) {
        e.sender.send('answer-ask-victory');
        victorious = false;
    }
})


//CLIENT RECIVE DATA EVENTS

client.on('data', (d) => {
    let data = d;
    message = '';
    if (data != null) {
        data = String(data);
        buffor += data;
        if (buffor.includes('STOP')) {
            message = buffor.substring(buffor.indexOf('START'), buffor.indexOf('STOP') + 4);
            buffor = buffor.slice(buffor.indexOf('STOP') + 4);
            message = Parser.unparse(message);
            console.log(message);
            if (message.type == "ANSWER") {
                if (message.name == "GET_ROOM_LIST") {
                    if (message.content.length) {
                        Rooms.deleteAllRooms();
                        message.content.forEach(el => {
                            Rooms.addNewRoom(el.name, el.ownerName, el.guests);
                        });
                    }
                }
            } else if (message.type == "INFO") {
                if (message.name == "SYN_CANVAS") {
                    Canvas.saveCanvas(message.content.pixels);
                } else if (message.name == "NEW_ROOM") {
                    Rooms.addNewRoom(message.content.name, message.content.ownerName, message.content.guests + 1);
                } else if (message.name == "CHAT_MSG") {
                    chat_messages.push(message.content);
                } else if (message.name == "VICTORY") {
                    // let win = canvasWindow.webContents;
                    // win.send("victory");
                    victorious = true;
                }

            }
        }
    }
})

// APP EVENTS

app.on('ready', () => {
    createNickWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        Rooms.deleteAllRooms();
        Canvas.clearJson();
        client.destroy();
        app.quit()
    }
})

app.on('activate', function () {
    if (roomListWindow === null) {
        createWindow();
    }
})