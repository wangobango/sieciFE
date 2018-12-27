let fs = require('fs');
let path = 'components/data/rooms.json'
let rooms = JSON.parse(fs.readFileSync(path, 'utf-8'));

function Rooms() {}

Rooms.prototype.getAll = function () {
    return rooms;
}

/**
 * @param {number} roomId
 */
Rooms.prototype.incrementUsers = function (roomId) {
    rooms.forEach(item => {
        if (item.id == roomId) {
            item.users += 1;
        }
    });
    fs.writeFile(path, JSON.stringify(rooms), 'utf-8', (err) => {
        if (err) throw err;
    });
};

Rooms.prototype.addNewRoom = function (name) {
    let room = {
        id: Rooms.prototype.getNewId(),
        name: name,
        users: 1
    }
    if (name != '') {
        rooms.push(room);
        fs.writeFile(path, JSON.stringify(rooms), 'utf-8', (err) => {
            if (err) throw err;
        });
    }
}

Rooms.prototype.addNewRoomWithId = function (id, name) {
    let room = {
        id: id,
        name: name,
        users: 1
    }
    if (name != '') {
        rooms.push(room);
        fs.writeFile(path, JSON.stringify(rooms), 'utf-8', (err) => {
            if (err) throw err;
        });
    }
}


Rooms.prototype.getNewId = function () {
    let max = 0;
    rooms.forEach(item => {
        if (item.id > max) {
            max = item.id;
        }
    })
    return max + 1;
}

Rooms.prototype.deleteRoom = function (name) {
    let id = -1;
    rooms.forEach(item => {
        if (name == item.name) {
            id = item.id;
        }
    });
    rooms.splice(id, 1);
    fs.writeFile(path, JSON.stringify(rooms), 'utf-8', (err) => {
        if (err) throw err;
    });
}

Rooms.prototype.getRoomByName = function (name) {
    let room;
    rooms.forEach(item => {
        if (item.name.replace(/\s/g, '') == name.replace(/\s/g, '')) {
            room = item;
        }
    })
    return room;
}

module.exports = {
    Rooms: Rooms
}