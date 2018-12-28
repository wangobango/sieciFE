"use strict";

const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

const path = require('path');
const url = require('url');

let roomListWindow;
let nickWindow;
let newRoomWindow;
let canvasWindow;
let user = '';
let currenCanvasRoom;

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
        frame: false
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

function createNewRoomWindow(){
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

function createCanvasWindow(){
    canvasWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
    roomListWindow.webContents.send('set-nick', item);
    nickWindow.close();
});

ipcMain.on('leave-gaming-room', ()=>{
    createWindow();
    canvasWindow.close();
})

ipcMain.on('new-room', (e, R) => {
    createNewRoomWindow();
    // newRoomWindow.webContents.send('new-room', R);
})

ipcMain.on('request-nick', (e) =>{
    e.sender.send('request-nick-answer',user);
})

ipcMain.on('enter-game', (e,room) => {
    currenCanvasRoom = room;
    createCanvasWindow();
    roomListWindow.close();
})

ipcMain.on('request-current-room', (e)=>{
    e.sender.send('current-room-answer',currenCanvasRoom);
})


// APP EVENTS

app.on('ready', createNickWindow)

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (roomListWindow === null) {
        createWindow()
    }
})