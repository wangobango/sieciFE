"use babel";
"use strict";


let messageLength = 220;

function lpad(value, padding = 3) {
    var zeroes = new Array(padding + 1).join("0");
    return (zeroes + value).slice(-padding);
}

class PackageStructure {
    constructor(messageId) {
        if (messageId === undefined) {
            this.message_id = 0;
            this.package_id = 0;
        } else {
            this.message_id = messageId;
            this.package_id = 0;
        }
    }

    createPackage(data) {
        let msg = data;
        if (msg.length < 220) {
            let temp = 220 - msg.length;
            for (let i = 0; i < temp; i++) {
                msg = msg + '';
            }
        } else if (msg.length > 220) {
            throw new Error('Data too long to parse!');
        }

        let pom = String(lpad(this.message_id)) + String(lpad(this.package_id)) + '[' + String(msg) + ']'
        this.package_id += 1;
        return pom;
    }

    createStartPackage() {
        let pom = 'START' + String(lpad(this.message_id)) + String(lpad(this.package_id))
        this.package_id += 1;
        return pom;
    }

    createStopPackage() {
        let pom = 'STOP' + String(lpad(this.message_id)) + String(lpad(this.package_id))
        this.package_id += 1;
        return pom;
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
                        str = element.substring(element.indexOf('[')+1, element.length - 1);
                        firstIteratio = false;
                    } else {
                        str = element.substring(element.indexOf('[')+1, element.length - 1);
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
        return data.match(/[\s\S]{1,220}/g) || [];
    }
    parse(data, id) {
        let pom = new PackageStructure(id);
        let temp = Parser.prototype.splitMessage(data);
        let CONTENT = [];
        temp.forEach(element => {
            CONTENT.push(pom.createPackage(element));
        });
        let final = {
            "start": pom.createStartPackage(),
            "stop": pom.createStopPackage(),
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
}




module.exports = {
    Parser: Parser
}