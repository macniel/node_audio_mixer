import AudioFile from './components/audiofile.js';
import Header from './components/header.js';

export default class Boot {

    get loop() {
        return this._loop;
    }

    set loop(loopType) {
        if ( loopType === 'loopNone' || loopType === 'loopOne' || loopType === 'loopSection' ) {
            this._loop = loopType;
        } else {
            this._loop = 'loopNone';
        }
    }

    get maxVolume() {
        return this._maxVolume;
    }

    set maxVolume(maxVolume) {
        const val = parseInt(maxVolume);
        if ( val >= 0.0 && val <= 1.0 ) {
            this._maxVolume = val;
        } else {
            this._maxVolume = 1;
        }
    }

    get playlist() {
        return this._playlist;
    }

    set playlist(playlist) {
        this._playlist = playlist;
    }

    get audioPlayer() {
        return document.querySelector('#player');
    }

    get currentPlaying() {
        return this._currentPlaying;
    }

    set currentPlaying(currentPlaying) {
        this._currentPlaying = currentPlaying;
    }

    get display() {
        return document.querySelector('#nowPlaying');
    }

    get playlistElement() {
        return document.getElementById('playlist');
    }
    
    constructor() {
        this.maxVolume = 1;
        this.loop = 'loopOne';
        this.audioPlayer.addEventListener('timeupdate', (event) => {
            if (this.currentPlaying != null) {
                this.currentPlaying.updateSeeker(this.audioPlayer.currentTime, this.audioPlayer.duration);
                
                this.display.textContent = this.currentPlaying.title;
            }
        });
    
        this.audioPlayer.addEventListener('ended', (event) => {
            // refactor to use the playlist and not the dom
            const nextElement = document.querySelector('app-audiofile.playing + app-audiofile');
            const firstElement = document.querySelector('app-audiofile.playing').parentElement.querySelector('app-audiofile');
            this.display.textContent = 'playback ended';
            
            this.currentPlaying.classList.remove('playing');
            this.audioPlayer.currentTime = 0;
            if (this.loop === 'loopOne') {
                this.playOrPause(this.currentPlaying);
            } else if (this.loop === 'loopSection') {
                if (nextElement !== null) {
                    this.playOrPause(nextElement);
                } else {
                    this.playOrPause(firstElement);
                }
    
            }
        });
    
        document.getElementById('appTitle').addEventListener('click', () => {
            document.querySelector(':root').classList.toggle('dark');
        });
    
        document.getElementById('fileSelector').addEventListener('change', (event) => {
            if (event.srcElement.files.length > 0) {
                this.uploadFile(event.srcElement.files[0]);
            }
        });

        document.querySelector('#uploader').addEventListener('click', (event) => {
            this.selectFile();
        });

        document.querySelector('#looper').addEventListener('click', (event) => {
            this.switchLoopMode(event.srcElement);
        });

        document.querySelector('#stopAll').addEventListener('click', (event) => {
            this.stop();
        });
    
        document.getElementById('volumeTracker').addEventListener('change', (event) => {
            this.maxVolume = event.srcElement.value;
            $('#player').animate({ volume: this.maxVolume }, 1000)
        });
    
        this.buildPlaylistUI(null);
    }

    selectFile() {
        document.querySelector('input[type="file"]').click();
    }

    uploadFile(file) {
        var data, xhr;

        document.getElementById('uploader').classList.add('waiting');

        data = new FormData();
        data.append('file', document.querySelector('#fileSelector').files[0]);

        xhr = new XMLHttpRequest();

        xhr.open('POST', '/add', true);
        xhr.onreadystatechange = (response) => {
            
            if (xhr.readyState == 4 && xhr.status == 200) {
                document.getElementById('uploader').classList.remove('waiting');

                this.buildPlaylistUI(xhr.responseText);
            }
        };
        xhr.send(data);
    }

// --- Dialog Controls ---

    get editDialog() {
        return document.querySelector('app-editdialog');
    }
    

    editFile(event, index) {
        let file = this.playlist[index];
        this.editDialog.callback = (result) => {
            console.log(result);
            switch ( result.action ) {
                case 'delete':
                    this.removeTrack(result);
                    break;
                case 'cancel':
                    break;
                case 'update':
                    this.updateTrack(result);
            }
            this.editDialog.close();
        };
        console.log(this.playlist);
        this.editDialog.open(file);
    }

    removeTrack(result) {
        let xhr = new XMLHttpRequest();

        xhr.open('DELETE', '/deleteTrack/' + result.guid, true);
        xhr.contentType = 'application/json';
        xhr.dataType = 'json';
        xhr.onreadystatechange = (response) => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                this.buildPlaylistUI(xhr.responseText);
            }
        };
        xhr.send();
    }

    updateTrack(result) {
        let xhr = new XMLHttpRequest();

        xhr.open('PUT', '/updateTrack/' + result.guid, true);
        const data = { newTitle: result.title, newSection: result.section, newColor: result.color };
        console.log(result);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = (response) => {
            console.log(response);
            if (xhr.readyState == 4 && xhr.status == 200) {
                this.buildPlaylistUI(xhr.responseText);
            }
        };
        xhr.send(JSON.stringify(data));
    }

// --- Audio Control ---

    switchLoopMode(source) {
        if (this.loop == 'loopNone') {
            this.loop = 'loopOne';
            source.innerText = 'repeat_one';
            source.classList.add('active');
        } else if (this.loop == 'loopOne') {
            this.loop = 'loopSection';
            source.innerText = 'repeat';
            source.classList.add('active');
        } else if (this.loop == 'loopSection') {
            this.loop = 'loopNone';
            source.innerText = 'repeat';
            source.classList.remove('active');
        }
    }

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        document.getElementsByTagName('app-audiofile').forEach( element => {
            element.classList.remove('playing');
            element.position = 0;
        });
        this.display.textContent = '';
    }

    playOrPause(source) {
        if (this.currentPlaying != source) {
            if (this.currentPlaying != null) {
                this.currentPlaying.classList.remove('playing');
            }
            $('#player').animate({ volume: 0 }, 1000).promise().done(() => {
                let audioSrc = document.querySelector('#player source');
                audioSrc.src = '/music/' + source.guid;
                audioSrc.type = 'audio/ogg';
                this.audioPlayer.load();
                this.audioPlayer.play();
                if (source.position != null) {
                    this.audioPlayer.currentTime = source.position;
                };
                $('#player').animate({ volume: this.maxVolume }, 1000);
                source.classList.add('playing');
                this.currentPlaying = source;
            });
            return;
        }
        this.currentPlaying = source;
        if (this.audioPlayer.paused) {
            $('#player').animate({ volume: this.maxVolume }, 1000);
            this.audioPlayer.play();
            source.classList.add('playing');
        } else {
            $('#player').animate({ volume: 0 }, 1000).promise().done(() => {
                this.audioPlayer.pause();
            });
            source.classList.remove('playing');
        }
    }

// --- UI building from Playlist ---
    createNewHeader(title) {
        let header = new Header();
        header.title = title;
        this.playlistElement.appendChild(header);
        return header.querySelector('header');
    }

    createNewAudio(parent, fileObject, idx) {
        let temp = new AudioFile();
        temp.color = fileObject.color;
        temp.title = fileObject.title;
        temp.guid = fileObject.guid;
        temp.callback = (event) => {
            this.playOrPause(event);
        };
        temp.secondaryCallback = (event) => {
            this.editFile(event, idx);
        };
        parent.after(temp);
    }

    buildPlaylistUIFromJSON(data) {
        this.playlistElement.innerHTML = '';
        data.files.sort((a, b) => {
            if (a.section > b.section) return 1
            else if (a.section == b.section) return 0
            else return -1;
        });

        this.playlist = data.files;

        let lastSection = '';
        let section = null;
        let index = 0;
        for (let file of data.files) {
            if (file.section !== lastSection) {
                section = this.createNewHeader(file.section);
            }
            lastSection = file.section;
            this.createNewAudio(section, file, index);
            index++;
        }
    }

    buildPlaylistUI(fromData) {
        stop();
        if (fromData !== null) {
            this.buildPlaylistUIFromJSON(JSON.parse(fromData));
        } else {
            $.getJSON('/playlist', (data) => {
                this.buildPlaylistUIFromJSON(data);
            });
        }

    }
}
