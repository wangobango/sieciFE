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

let fs = require('fs');
let config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));
let net = require('net');
let port = config.port;
let ip_addr = config.ip;
let message_id_counter = 0;
let buffor = '';
let message;
let victorious = false;
let password;
let tooCrowded = false;
const io = require('socket.io-client');
let socket;

let connected = true;

let client = new net.Socket();
client.connect(port, ip_addr, () => {
    console.log('Connection succesfull!');
    // client.setKeepalive(true, 5000);
    setInterval(() => {
        if (connected) {
            let pom = {
                "type": "REQUEST",
                "name": "CHECK_CONNECTION",
                "content": ""
            };
            let data = Parser.parse(JSON.stringify(pom), message_id_counter);
            client.write(String(data), 'utf-8');
            connected = false;
        } else {
            console.log("Disconnected!!!");
        }
    }, 5000);
});

// setInterval(() => {
//     connected = false;
// }, 5300);

// let Rooms = new rooms.Rooms();
let Parser = new parser.Parser();
let Canvas = new canvas.Canvas();

let roomListWindow;
let nickWindow;
let newRoomWindow;
let canvasWindow;
let user = '';
let currenCanvasRoom;
let chat_messages = [];
let winnerName;
let passReady = false;
let nick_list = [];
let room_names = [];

function RoomList() {
    this.rooms = [];
}

RoomList.prototype.addNewRoom = function (name, ownerId, users, password) {
    let room = {
        name: name,
        ownerName: ownerId,
        users: users,
        currentPassword: password
    }
    if (name != '') {
        this.rooms.push(room);
    }
};

RoomList.prototype.getPassByName = function (name) {
    let owner;
    this.rooms.forEach(item => {
        if (item.name == name) {
            owner = item.currentPassword;
        }
    })

    return owner;
}

RoomList.prototype.getAll = function () {
    return this.rooms;
}

RoomList.prototype.deleteRoom = function (name) {
    this.rooms = this.rooms.filter(a => {
        return a.name != name;
    })
}

RoomList.prototype.deleteAllRooms = function () {
    this.rooms = [];
}

RoomList.prototype.getOwnerByRoomName = function (name) {
    let owner;
    this.rooms.forEach(item => {
        if (item.name.replace(/\s/g, '') == name.replace(/\s/g, '')) {
            owner = item.ownerName;
        }
    })
    return owner;
}

RoomList.prototype.updateGuests = function (name, guests) {
    let i = 0;
    if (this.rooms.length > 0) {
        this.rooms.forEach(item => {
            if (item.name == name) {
                this.rooms[i].users = guests;
            }
            i++;
        })
    }
}

RoomList.prototype.updatePassword = function (name, password) {
    let i = 0;
    if (this.rooms.length > 0) {
        this.rooms.forEach(item => {
            if (item.name == name) {
                this.rooms[i].currentPassword = password;
            }
            i++;
        })
    }
}

RoomList.prototype.updateOwner = function (roomName, ownerName) {
    for (let i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].name == roomName) {
            this.rooms[i].ownerName = ownerName;
        }
    }
}

function sendData(data, client) {
    client.write(String(data), 'utf-8');
}

let Rooms = new RoomList();

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
    // Rooms.addNewRoom(room, user, 1);
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

    setTimeout(() => {
        createCanvasWindow();
        roomListWindow.close();
        newRoomWindow.close();
    }, 1000);


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
    if (socket !== undefined) {
        socket.emit('test', 'test z main');
    }
});

ipcMain.on('new-room-window-open', (e) => {
    createNewRoomWindow();
    // newRoomWindow.webContents.send('new-room', R);
})

ipcMain.on('request-nick', (e) => {
    e.sender.send('request-nick-answer', user);
})

ipcMain.on('enter-game', (e, room) => {
    currenCanvasRoom = room;

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

    setTimeout(() => {
        if (!tooCrowded) {
            createCanvasWindow();
            roomListWindow.close();
        } else {
            tooCrowded = false;
            alert("ROOM TOO CROWDED!");
        }
    }, 500)
})

ipcMain.on('request-current-room', (e) => {
    let rum = {
        "name": currenCanvasRoom,
        "owner": user,
        "password": Rooms.getPassByName(currenCanvasRoom)
    }
    e.sender.send('current-room-answer', rum);
})

ipcMain.on('exit-application', () => {
    roomListWindow.close();
})

ipcMain.on('ANSWER_GET_ROOM_LIST', (e, content) => {

});

ipcMain.on('get-rooms', (e) => {
    e.sender.send('answer-get-rooms', Rooms.getAll());
})

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
        victorious = false;
        //zmienic ownera
        Rooms.updateOwner(currenCanvasRoom, winnerName);
        e.sender.send('answer-ask-victory', winnerName);
    }
})

ipcMain.on('request-nick-list', (e) => {
    e.sender.send('answer-request-nick-list', nick_list);
})

ipcMain.on('request-room-names', (e) => {
    e.sender.send('answer-request-room-names', room_names);
})

ipcMain.on('ask-connected', (e) => {
    e.sender.send('answer-ask-connected', connected);
})

ipcMain.on('quit-app', () => {
    client.destroy();
    app.quit();
})

//CLIENT RECIVE DATA EVENTS

client.on('data', (d) => {
    let data = d;
    message = '';
    if (data != null) {
        data = String(data);
        buffor += data;
        while (buffor.includes('STOP')) {
            message = buffor.substring(buffor.indexOf('START'), buffor.indexOf('STOP') + 4);
            buffor = buffor.slice(buffor.indexOf('STOP') + 4);
            try {
                message = Parser.unparse(message);
            } catch (e) {
                console.log("Bad json input!");
                message = {};
            }
            console.log(message);
            if (message.type == "ANSWER") {
                if (message.name == "GET_ROOM_LIST") {
                    if (message.content.length) {
                        Rooms.deleteAllRooms();
                        message.content.forEach(el => {
                            room_names.push(el.name);
                            nick_list.push(el.ownerName);
                            Rooms.addNewRoom(el.name, el.ownerName, el.guests, el.currentPassword);
                        });
                    } else {
                        Rooms.deleteAllRooms();
                    }
                } else if (message.name == "GET_NICK_LIST") {
                    nick_list = message.content.nickList;
                } else if (message.name == "CHECK_CONNECTION") {
                    connected = true;
                }
            } else if (message.type == "INFO") {
                if (message.name == "SYN_CANVAS") {
                    Canvas.saveCanvas(message.content.pixels);
                } else if (message.name == "NEW_ROOM") {
                    room_names.push(message.content.name);
                    // nick_list.push(message.content.ownerName);
                    Rooms.addNewRoom(message.content.name, message.content.ownerName, message.content.guests, message.content.currentPassword);
                } else if (message.name == "CHAT_MSG") {
                    chat_messages.push(message.content);
                } else if (message.name == "VICTORY") {
                    // let win = canvasWindow.webContents;
                    // win.send("victory");
                    victorious = true;
                    winnerName = message.winnerId;
                } else if (message.name == "ROOM_DELETED") {
                    room_names = room_names.filter(a => {
                        return a.name != message.content.roomName;
                    })
                    Rooms.deleteRoom(message.content.roomName);
                } else if (message.name == "NEW_GAME") {
                    password = message.content.currentPassword;
                    Rooms.addNewRoom(currenCanvasRoom, user, 1, password);
                } else if (message.name == "ERROR") {
                    tooCrowded = true;
                } else if (message.name = "GUESTS_UPDATE") {
                    Rooms.updateGuests(message.content.name, message.content.guests);
                } else if (message.name = "NEW_OWNER"){
                    Rooms.updateOwner(message.content.name,message.content.ownerName);
                    Rooms.updatePassword(message.content.name,message.content.currentPassword);
                    Canvas.clearJson();
                }
            }
        }
    }
})

// APP EVENTS

app.on('ready', () => {
    let pom2 = {
        "type": "REQUEST",
        "name": "GET_ROOM_LIST",
        "content": ""
    }
    let data = Parser.parse(JSON.stringify(pom2), message_id_counter);
    sendData(data, client);

    pom2 = {
        "type": "REQUEST",
        "name": "GET_NICK_LIST",
        "content": ""
    }
    data = Parser.parse(JSON.stringify(pom2), message_id_counter);
    sendData(data, client);

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