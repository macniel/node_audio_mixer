const opn = require('opn');
const fs = require('fs');
const path = require('path');
const ffmpegCore = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const express = require('express');
const multer = require('multer');
const app = express();
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
app.use(bodyParser.json());

ffmpeg.setFfmpegPath(ffmpegCore.path);

function getRealPath() {
    if (__dirname.indexOf('snapshot') != -1) { // packaged into pkg app
        return process.cwd();
    } else { // cli called
        return __dirname;
    }
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function getPlaylist() {
    let data = {};
    if (fs.existsSync(path.join(getRealPath(), "playlist.json"))) {
        data = JSON.parse(fs.readFileSync(path.join(getRealPath(), "playlist.json")));
    } else { // playlist does not yet exists
        data.version = 1.5;
        data.files = [];
        fs.writeFileSync(path.join(getRealPath(), "playlist.json"), JSON.stringify(data));
    }
    return data;
}

function insertPlaylist(data) {
    const structure = getPlaylist();
    structure.files.push(data);
    fs.writeFileSync(path.join(getRealPath(), "playlist.json"), JSON.stringify(structure));
    return structure;
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(path.join(__dirname, 'temp'))) {
            fs.mkdirSync(path.join(__dirname, 'temp'));
        };
        cb(null, path.join(__dirname, 'temp'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

app.post('/updatePlaylist', (req, res) => {
    console.log(req.body);
    fs.writeFileSync(path.join(getRealPath(), "playlist.json"), JSON.stringify({ modified: new Date(), files: req.body }));
    res.send(getPlaylist());
})

var upload = multer({ storage: storage });
app.post('/add', upload.single('file'), (req, res) => {
    const file = req.file;
    const targetFilename = guid();
    const proc = ffmpeg()
        .addInput(file.path)
        .withAudioCodec('libvorbis')
        .withNoVideo()
        .withAudioBitrate('64k')
        .format('ogg');

    proc.on('end', () => {
        playlist = insertPlaylist({
            guid: targetFilename,
            section: 'Zuletzt Hinzugefügt',
            title: file.originalname,
            color: 'default'
        });
        res.send(playlist).end();
    });
    if (!fs.existsSync(path.join(getRealPath(), 'media'))) {
        fs.mkdirSync(path.join(getRealPath(), 'media'));
    };
    proc.saveToFile(path.join(getRealPath(), 'media', targetFilename + '.ogg'));
});

app.get('/fileinfo', (req, res) => {
    res.send('').end();
});
app.get('/fileinfo/:fileRef', (req, res) => {
    const proc = ffmpeg();
    if (fs.existsSync(path.join(getRealPath(), 'media', req.params['fileRef'] + '.ogg'))) {
        proc.addInput(path.join(getRealPath(), 'media', req.params['fileRef'] + '.ogg'))
            .complexFilter('aformat=channel_layouts=mono,showwavespic=s=668x64:colors=#FFFFFF88')
            .frames('1')
            .save(path.join(getRealPath(), 'media', req.params['fileRef'] + '-waveform.png'))
            .on('end', () => {
                if (fs.existsSync(path.join(getRealPath(), 'media', req.params['fileRef'] + '-waveform.png'))) {
                    res.sendFile(path.join(getRealPath(), 'media', req.params['fileRef'] + '-waveform.png'));
                } else {
                    res.sendFile(path.join(__dirname, 'static', 'unkown_stat.png'));
                }

            });
    } else {
        res.send('').end();
    }
});

app.get('/playlist', (req, res) => {
    const playlist = JSON.stringify(getPlaylist());
    res.send(playlist);
});

app.delete('/deleteTrack/:guid', (req, res) => {
    const structure = getPlaylist();
    let index = -1;
    for (index in structure.files) {
        if (structure.files[index].guid === req.params['guid'])
            break;
    }
    structure.files.splice(index, 1);
    fs.writeFileSync(path.join(getRealPath(), "playlist.json"), JSON.stringify(structure));
    res.send(JSON.stringify(getPlaylist())).end();
});

app.put('/updateTrack/:guid', (req, res) => {
    const structure = getPlaylist();
    for (file of structure.files) {
        if (file.guid == req.params['guid']) {
            file.title = req.body.newTitle;
            file.section = req.body.newSection;
            file.color = req.body.newColor;
            console.log(file);
        }
     }
    fs.writeFileSync(path.join(getRealPath(), "playlist.json"), JSON.stringify(structure));
    res.send(JSON.stringify(getPlaylist())).end();
});

app.get('/music/:fileRef', (req, res) => {
    const filename = path.join(getRealPath(), 'media', req.params['fileRef'] + '.ogg');
    if ( fs.existsSync(filename) ) {
        /*console.log(req.headers.range);
        
        const range = req.headers.range;
        if (!range) {
            // 416 Wrong range
            return res.sendStatus(416);
        }
        const positions = range.replace(/bytes=/, "").split("-");
        const start = parseInt(positions[0], 10);
        const stats = fs.statSync(path.join(getRealPath(), 'media', req.params['fileRef'] + '.ogg'));
        const total = stats.size;
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        const chunksize = (end - start) + 1;
        res.writeHead(200, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "audio/ogg"
        });
        const stream = fs.createReadStream(path.join(getRealPath(), 'media', req.params['fileRef'] + '.ogg'), { start: start, end: end });
        stream.on("open", function (event) {
            console.log('Stream opened', event, 'Range', req.header.range);
            stream.pipe(res);
        });
        stream.on("error", function (err) {
            console.log(err);
            res.end(err);
        });*/
        res.sendFile(filename);
    } else {
        console.log('file not found', filename);
        return res.status(404).end();
    }
});

// static serving




app.use('/', express.static('static'));


// start server

app.listen(1337, () => {

    console.log('mixer is ready');

});