const rooms = [{
        id: 0,
        name: "Dupa room",
        users:0
    },
    {
        id: 1,
        name: "Kolejny dupa room",
        users: 0,
    }
]

function Rooms(){
    this.rooms = [
    {
        id: 0,
        name: "Dupa room",
        users:0
    },
    {
        id: 1,
        name: "Kolejny dupa room",
        users: 0,
    }]
}

Rooms.prototype.getAll = function(){
    return this.rooms;
}

/**
 * @param {number} roomId
 */
Rooms.prototype.incrementUsers = function(roomId){
    this.rooms.forEach( item => {
        if(item.id == roomId){
            item.users+=1;
        }
    })
};

Rooms.prototype.addNewRoom = function(id, name){
    let room = {
        id : id,
        name : name,
        users : 1
    }
    this.rooms.push(room);
}

module.exports = {
    rooms : rooms,
    Rooms: Rooms
}