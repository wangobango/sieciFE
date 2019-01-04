"use babel";
"use strict";


let messageLength = 220;

function lpad(value, padding = 3) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}

class PackageStructure {
    constructor(messageId) {
        this.message_id = messageId;
        this.package_id = 0;
    }

    createPackage(data){
        let msg = data;
        if(msg.length<220){
            let temp = 220 - msg.length;
            for(let i = 0;i<temp;i++){
                msg = msg+'';
            }
        } else if (msg.length>220){
            throw new Error('Data too long to parse!');        
        }

        let pom = String(lpad(this.message_id))+String(lpad(this.package_id))+'['+String(msg)+']'
        this.package_id+=1;
        return pom;
    }

    createStartPackage(){
        let pom = 'START'+String(lpad(this.message_id))+String(lpad(this.package_id))
        this.package_id+=1;
        return pom;
    }

    createStopPackage(){
        let pom = 'STOP'+String(lpad(this.message_id))+String(lpad(this.package_id))
        this.package_id+=1;
        return pom;
    }
}

function Parser(){
    this.fullMessage = '';
}

Parser.prototype.clearMessage = function(){
    this.fullMessage = '';
}

Parser.prototype.splitMessage = function(data){
    return data.match(/[\s\S]{1,220}/g) || [];
}

Parser.prototype.parse = function(data,id){
    let pom = new PackageStructure(id);

    let START = pom.createStartPackage();
    let END = pom.createStopPackage();
    let temp = Parser.prototype.splitMessage(data);
    let CONTENT = [];
    temp.forEach(element => {
        CONTENT.push(pom.createPackage(element));        
    });

    let final = {
        "start": START,
        "stop": END,
        "content": CONTENT
    }

    return final;
}

module.exports = {
    Parser: Parser
}
