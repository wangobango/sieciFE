let fs = require('fs');
let path = 'components/data/rooms.json'
let rooms = JSON.parse(fs.readFileSync(path,'utf-8'));

function Rooms(){}

Rooms.prototype.getAll = function(){
    return JSON.parse(fs.readFileSync(path,'utf-8'));
}

/**
 * @param {number} roomId
 */
Rooms.prototype.incrementUsers = function(roomId){
    rooms.forEach( item => {
        if(item.id == roomId){
            item.users+=1;
        }
    });
    fs.writeFile(path,JSON.stringify(rooms),'utf-8', (err)=>{
        if(err) throw err;
    });
};

Rooms.prototype.addNewRoom = function(id, name){
    let room = {
        id : id,
        name : name,
        users : 1
    }
    rooms.push(room);
    fs.writeFile(path,JSON.stringify(rooms),'utf-8', (err)=>{
        if(err) throw err;
    });
}

Rooms.prototype.getNewId = function(){
    let max = 0;
    rooms.forEach(item => {
        if(item.id>max){
            max = item.id;
        }
    })
    return max+1;
}

module.exports = {
    Rooms: Rooms
}