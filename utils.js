// Copyright (c) 2019 YA-androidapp(https://github.com/YA-androidapp) All rights reserved.

let faceCascadeFile = 'haarcascade_frontalface_default.xml';
// let faceCascadeFile = 'lbpcascade_animeface.xml';

// ////////////////////

function Utils(errorOutputId) {
    let self = this;
    this.errorOutput = document.getElementById(errorOutputId);

    this.createFileFromUrl = function (path, url, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function (ev) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                } else {
                    self.printError('Failed to load ' + url + ' status: ' + request.status);
                }
            }
        };
        request.send();
    };

    this.loadImageToCanvas = function (url, cavansId) {
        let canvas = document.getElementById(cavansId);
        let ctx = canvas.getContext('2d');
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = url;
    };

    this.executeCode = function (textAreaId) {
        try {
            this.clearError();
            let code = document.getElementById(textAreaId).value;
            eval(code);
        } catch (err) {
            this.printError(err);
        }
    };

    this.clearError = function () {
        this.errorOutput.innerHTML = '';
    };

    this.printError = function (err) {
        if (typeof err === 'undefined') {
            err = '';
        } else if (typeof err === 'number') {
            if (!isNaN(err)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
                }
            }
        } else if (typeof err === 'string') {
            let ptr = Number(err.split(' ')[0]);
            if (!isNaN(ptr)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
                }
            }
        } else if (err instanceof Error) {
            err = err.stack.replace(/\n/g, '<br>');
        }
        this.errorOutput.innerHTML = err;
    };

    this.loadCode = function (scriptId, textAreaId) {
        let scriptNode = document.getElementById(scriptId);
        let textArea = document.getElementById(textAreaId);
        if (scriptNode.type !== 'text/code-snippet') {
            throw Error('Unknown code snippet type');
        }
        textArea.value = scriptNode.text.replace(/^\n/, '');
    };

    this.addFileInputHandler = function (fileInputId, canvasId) {
        let inputElement = document.getElementById(fileInputId);
        inputElement.addEventListener('change', (e) => {
            let files = e.target.files;
            if (files.length > 0) {
                let imgUrl = URL.createObjectURL(files[0]);
                self.loadImageToCanvas(imgUrl, canvasId);
            }
        }, false);
    };
};

let utils = new Utils('errorMessage');
utils.addFileInputHandler('fileInput', 'canvasInput');

let detect = document.getElementById('detect');
detect.addEventListener('click', () => {
    let src = cv.imread('canvasInput');
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    let faces = new cv.RectVector();
    let faceCascade = new cv.CascadeClassifier();
    faceCascade.load(faceCascadeFile);
    let msize = new cv.Size(100, 100);
    faceCascade.detectMultiScale(gray, faces, 1.1, 1, 0, msize, msize);
    for (let i = 0; i < faces.size(); ++i) {
        let roiGray = gray.roi(faces.get(i));
        let roiSrc = src.roi(faces.get(i));
        let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
        let point2 = new cv.Point(faces.get(i).x + faces.get(i).width,
            faces.get(i).y + faces.get(i).height);
        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
        roiGray.delete();
        roiSrc.delete();

        // Canvasを追加してトリミングした画像を表示
        canvasInputContext = document.getElementById('canvasInput').getContext('2d');
        image_size = 100;
        mem_canvas = document.createElement('canvas');
        mem_canvas.width = image_size;
        mem_canvas.height = image_size;
        mem_canvas.id = 'canvas' + String(i)
        var image = canvasInputContext.getImageData(faces.get(i).x, faces.get(i).y, faces.get(i).width, faces.get(i).height);
        mem_canvas.getContext('2d').putImageData(image, 0, 0, 0, 0, image_size, image_size);
        var data = mem_canvas.toDataURL('image/png');
        document.getElementById('result').innerHTML += '<img id="' + mem_canvas.id + '" src="' + data + '">';
    }
    cv.imshow('canvasOutput', src);
    src.delete();
    gray.delete();
    faceCascade.delete();
    faces.delete();
});

function loadOpenCv() {
    utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
        detect.removeAttribute('disabled');
    });
}