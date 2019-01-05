"use babel";
"use strict";


let messageLength = 250;

function lpad(value, padding = 3) {
    var zeroes = new Array(padding + 1).join("0");
    return (zeroes + value).slice(-padding);
}

class PackageStructure {
    constructor(messageId) {
        if (messageId === undefined) {
            this.message_id = 0;
        } else {
            this.message_id = messageId;
        }
    }

    createPackage(data) {
        let msg = '[' + data + ']';
        if (msg.length < messageLength+3) {
            let temp = 252 - msg.length;
            for (let i = 0; i < temp; i++) {
                msg = msg + ' ';
            }
        } else if (msg.length > messageLength) {
            throw new Error('Data too long to parse!');
        }

        return String(lpad(this.message_id)) + String(msg);
    }

    createStartPackage() {
        let start = 'START' + String(lpad(this.message_id));
        for (let i = 0; i < 255 - start.length; i++) {
            start = start + ' ';
        }
        return start;
    }

    createStopPackage() {
        let stop = 'STOP' + String(lpad(this.message_id));
        for (let i = 0; i < 255 - stop.length; i++) {
            stop = stop + ' ';
        }
        return stop;
    }

    //Accepts array of data, delets headers and footers, leaves pure content
    destructPackage(data) {
        let pom = '';
        let firstIteratio = true;
        let id = -1;
        data.forEach(item => {
            if (item.includes('START')) {
                id = parseInt(item.substring(5));
            } else if (item.includes('STOP')) {

            } else {
                item.forEach(element => {
                    let str = '';
                    if (firstIteratio) {
                        str = element.substring(element.indexOf('[') + 1, element.length - 1);
                        firstIteratio = false;
                    } else {
                        str = element.substring(element.indexOf('[') + 1, element.length - 1);
                    }
                    pom += str;
                });
            }
        });

        let result = {
            "id": id,
            "content": JSON.parse(pom)
        };

        return result;
    }
}

class Parser {
    constructor() {
        this.fullMessage = '';
    }
    clearMessage() {
        this.fullMessage = '';
    }
    splitMessage(data) {
        return data.match(/[\s\S]{1,250}/g) || [];
    }
    parse(data, id) {
        let pom = new PackageStructure(id);
        let temp = Parser.prototype.splitMessage(data);
        let CONTENT = [];
        let start =  pom.createStartPackage();
        temp.forEach(element => {
            CONTENT.push(pom.createPackage(element));
        });
        let stop = pom.createStopPackage();

        let final = {
            "start": start,
            "stop": stop,
            "content": CONTENT
        };

        let result = [];
        result.push(final.start);
        result.push(final.content);
        result.push(final.stop);

        return result;
    }
    unparse(data) {
        let pom = new PackageStructure();
        return pom.destructPackage(data);

    }
    sumArray(arr){
        let sum = '';
        arr.forEach(element =>{
            sum+=element;
        })
        return sum;
    }
}




module.exports = {
    Parser: Parser
}