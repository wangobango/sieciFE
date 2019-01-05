"use strict";
"use babel";

const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

const path = require('path');
const url = require('url');

const parser = require('./components/Parser');
const rooms = require('./components/Rooms');

let net = require('net');
let port = 20000;
let ip_addr = '127.0.0.1';
let message_id_counter = 0;

let client = new net.Socket();
client.connect(port, ip_addr, () => {
    console.log('Connection succesfull!');
});


let Rooms = new rooms.Rooms();
let Parser = new parser.Parser();

//TEST PARSING AND CONNECTION

// let data = Rooms.getAll();
// let DUPA = Parser.parse(JSON.stringify(data),0);

// let DUPA2 = Parser.unparse(DUPA);

//END TEST PARSING AND CONNECTION

let roomListWindow;
let nickWindow;
let newRoomWindow;
let canvasWindow;
let user = '';
let currenCanvasRoom;

function sendData(data,client){
    data.forEach(item => {
        console.log(item)
        if (item == data[1]) {
            item.forEach(el => {
                client.write(String(el), 'utf-8');
            })
        } else {
            client.write(String(item), 'utf-8');
        }
    })
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
        "type": "ANSWER",
        "name": "NEW-USER",
        "content": user
    }
    let data = Parser.parse(JSON.stringify(pom), message_id_counter);
    message_id_counter++;
    data.forEach(item => {
        console.log(item)
        if (item == data[1]) {
            item.forEach(el => {
                client.write(String(el), 'utf-8');
            })
        } else {
            client.write(String(item), 'utf-8');
        }
    })
    
    let pom = {
        "type": "REQUEST",
        "name": "GET-ROOM-LIST",
        "content" : ""
    }
    data = Parser.parse(JSON.stringify(pom2), message_id_counter);
    sendData(data,client);
    
    roomListWindow.webContents.send('set-nick', item);
    nickWindow.close();
});

ipcMain.on('leave-gaming-room', () => {
    createWindow();
    canvasWindow.close();
})

ipcMain.on('new-room', (e, R) => {
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

// APP EVENTS

app.on('ready', createNickWindow)

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        client.destroy();
        app.quit()
    }
})

app.on('activate', function () {
    if (roomListWindow === null) {
        createWindow();
    }
})