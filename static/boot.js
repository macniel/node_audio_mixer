import AudioFile from './components/audiofile.js';

export default class Boot {

    get loop() {

        return this._loop;
    }

    set loop(loopType) {
        if ( loopType === 'loopNone' || loopType === 'loopOnce' || loopType === 'loopAll' ) {
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
    
    constructor() {
        this.maxVolume = 1;
        this.loop = 'loopOnce';
        this.audioPlayer.addEventListener('timeupdate', (event) => {
            if (this.currentPlaying != null) {
                const factor = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
    
                $('.seeker', this.currentPlaying).animate({ width: factor + '%' }, 1);
                $(this.currentPlaying).data('position', this.audioPlayer.currentTime);
                $('#nowPlaying').text($(this.currentPlaying).data('title'));
            }
        });
    
        this.audioPlayer.addEventListener('ended', (event) => {
            const nextElement = $('section.playing + section')[0];
            const firstElement = $('section', $('section.playing').parent())[0];
            $('#nowplaying').text('playback ended');
            console.log(nextElement, firstElement);
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
            $(':root').toggleClass('dark');
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

        data = new FormData();
        data.append('file', document.querySelector('#fileSelector').files[0]);

        xhr = new XMLHttpRequest();

        xhr.open('POST', '/add', true);
        xhr.onreadystatechange = function (response) {
            if (xhr.readyState == 4 && xhr.status == 200) {
                this.buildPlaylistUI(xhr.responseText);
            }
        };
        xhr.send(data);
    }

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

    toggleSection(sectionHeader) {
        $(sectionHeader).parent().toggleClass('expanded');
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
                    this.removeTrack(result.guid);
                    break;
                case 'cancel':
                    break;
                case 'update':
                    this.updateTrack(result);
            }
            this.editDialog.close();
        };
        this.editDialog.open(file);
    }

    removeTrack(guid) {
        $.ajax({
            url: '/deleteTrack/' + guid,
            method: 'DELETE',
            contentType: 'application/json',
            dataType: 'json',
            success: (data) => {
                this.buildPlaylistUI(JSON.stringify(data));
            }
        });
    }

    updateTrack(result) {
        $.ajax({
            url: '/updateTrack/' + result.guid,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ newTitle: result.title, newSection: result.section, newColor: result.color }),
            dataType: 'json',
            success: (data) => {
                this.buildPlaylistUI(JSON.stringify(data));
            }
        });
    }

// --- Audio Control ---

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        $('section').removeClass('playing').data('position', 0);
        $('section .seeker').css('width', '0%');
        $('#nowPlaying').text('');
    }

    playOrPause(source) {
        if (this.currentPlaying != source) {
            if (this.currentPlaying != null) {
                this.currentPlaying.classList.remove('playing');
            }
            $('#player').animate({ volume: 0 }, 1000).promise().done(() => {
                let audioSrc = document.querySelector('#player source');
                audioSrc.src = '/music/' + $(source).data('guid');
                audioSrc.type = 'audio/ogg';
                this.audioPlayer.load();
                this.audioPlayer.play();
                if ($(source).data('position') != null) {
                    this.audioPlayer.currentTime = $(source).data('position');
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
        let articleElement = $('#playlist').append(`<article class='expanded' data-title="${title}
            "><header data-title="${title} " onclick="toggleSection(this) "><span/></header>
            <div class="droptarget "></div>
            </article>`);

        return $(`header[data-title="${title} "]`, '#playlist');
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
        $('#playlist').empty();
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
