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

let net = require('net');
let port = 20000;
let ip_addr = '127.0.0.1';
let message_id_counter = 0;
let buffor = '';

let client = new net.Socket();
client.connect(port, ip_addr, () => {
    console.log('Connection succesfull!');
});


let Rooms = new rooms.Rooms();
let Parser = new parser.Parser();

let roomListWindow;
let nickWindow;
let newRoomWindow;
let canvasWindow;
let user = '';
let currenCanvasRoom;

function sendData(data, client){
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
    setInterval(() => {
        let data = client.read();
        if(data != null) {
            data = String(data);
            buffor += data;
            if(buffor.includes('STOP')) {
                let message = buffor.substring(buffor.indexOf('START'), buffor.indexOf('STOP')+4);
                buffor.slice(buffor.indexOf('STOP')+4);
                message = Parser.unparse(message);
                if (message.type = "ANSWER") {
                    if (message.name = "GET-ROOM-LIST") {
                        message.content.forEach(el => console.log(el));
                    }
                }
            }
        }
    }, 2000);
    nickWindow.on('closed', () => {
        nickWindow = null;
    })
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
    canvasWindow.on('close', () => {
        canvasWindow = null;
    });
}

//EVENT HANDLERS !!!

ipcMain.on('new-nick', (e, item) => {
    createWindow();
    user = item;
    //Add sending nick to serwer
    let pom = {
        "type": "REQUEST",
        "name": "NEW-USER",
        "content": {
            "name": user
        }
    }
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    console.log(data);
    client.write(String(data), 'utf-8');
    
    let pom2 = {
        "type": "REQUEST",
        "name": "GET-ROOM-LIST",
        "content" : ""
    }
    data = Parser.parse(JSON.stringify(pom2), message_id_counter);
    sendData(data,client);
    
    roomListWindow.webContents.send('set-nick', item);
    nickWindow.close();
});

ipcMain.on('new-room-added', (e, room) => {
    let pom = {
        "type": "REQUEST",
        "name": "NEW-ROOM",
        "content": {
            "name": room
        }
    }
    console.log(JSON.stringify(pom));
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    client.write(String(data), 'utf-8');
    newRoomWindow.close();
})

ipcMain.on('leave-gaming-room', () => {
    createWindow();
    canvasWindow.close();
})

ipcMain.on('chat-msg-sent', (e, text) => {
    let pom = {
        "type": "INFO",
        "name": "CHAT-MSG",
        "content": {
            "text": text    
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
    client.write(String(data), 'utf-8');
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
    createCanvasWindow();
    roomListWindow.close();
})

ipcMain.on('request-current-room', (e) => {
    e.sender.send('current-room-answer', currenCanvasRoom);
})

ipcMain.on('exit-application', () => {
    roomListWindow.close();
})

ipcMain.on('ANSWER_GET_ROOM_LIST', (e, content) => {

});
// APP EVENTS

app.on('ready', () => {
    createNickWindow();

});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        Rooms.deleteAllRooms();
        client.destroy();
        app.quit()
    }
})

app.on('activate', function () {
    if (roomListWindow === null) {
        createWindow();
    }
})