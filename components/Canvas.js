let fs = require('fs');
let path = 'components/data/canvas.json';
let canvas = JSON.parse(fs.readFileSync(path, 'utf-8'));

function Canvas() {}

Canvas.prototype.getCanvas = function () {
    return canvas;
}

Canvas.prototype.saveCanvas = function (canvasToSava) {
    if (canvasToSava != '') {
        canvas = canvasToSava;
        fs.writeFile(path, JSON.stringify(canvas), 'utf-8', (err) => {
            if (err) throw err;
        });
    }
}

Canvas.prototype.appendToCanvas = function (canvasToSava) {
    if (canvasToSava != '') {
        canvas.push(canvasToSava);
        fs.writeFile(path, JSON.stringify(canvas), 'utf-8', (err) => {
            if (err) throw err;
        });
    }
}

Canvas.prototype.clearJson = function () {
    fs.writeFile(path, JSON.stringify([]), 'utf-8', (err) => {
        if (err) throw err;
    });
}

module.exports = {
    Canvas: Canvas
}