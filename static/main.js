// --- globals ---

let _G = {
    loop: 'loopNone', // 'loopOne', 'loopNone'
    maxVolume: 1,
    playlist: {},
    currentPlaying: null,
    audioPlayer: document.getElementById('player')
}

function selectFile() {
    $('input[type="file"]').click();
}

function uploadFile(file) {
    var data, xhr;

    data = new FormData();
    data.append('file', $('#fileSelector')[0].files[0]);

    xhr = new XMLHttpRequest();

    xhr.open('POST', '/add', true);
    xhr.onreadystatechange = function (response) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            buildPlaylistUI(xhr.responseText);
        }
    };
    xhr.send(data);
}

function switchLoopMode(source) {
    if (_G.loop == 'loopNone') {
        _G.loop = 'loopOne';
        source.innerText = 'repeat_one';
        source.classList.add('active');
    } else if (_G.loop == 'loopOne') {
        _G.loop = 'loopSection';
        source.innerText = 'repeat';
        source.classList.add('active');
    } else if (_G.loop == 'loopSection') {
        _G.loop = 'loopNone';
        source.innerText = 'repeat';
        source.classList.remove('active');
    }
}

function toggleSection(sectionHeader) {
    $(sectionHeader).parent().toggleClass('expanded');
}

// --- Dialog Controls ---

function editFile(event, index) {
    let file = _G.playlist[index];
    _G.dialogFile = file;
    console.log(_G, _G.playlist[index]);
    $('#audioTitle').val(file.title);
    $('#audioSection').val(file.section);

    $('#editDialog').removeAttr('hidden');
    event.stopPropagation();
    event.preventDefault();
    return false;
}

function cancelDialog() {
    $('#editDialog').attr('hidden', 'hidden');
}

function removeTrack() {
    if ($('#editDialog:visible').length > 0) {
        $.ajax({
            url: '/deleteTrack/' + _G.dialogFile.guid,
            method: 'DELETE',
            contentType: 'application/json',
            dataType: 'json',
            success: (data) => {
                buildPlaylistUI(JSON.stringify(data));
                $('#editDialog').attr('hidden', 'hidden');
            }
        });
    }
}

function updateTrack() {
    if ($('#editDialog:visible').length > 0) {
        $.ajax({
            url: '/updateTrack/' + _G.dialogFile.guid,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ newTitle: $('#audioTitle').val(), newSection: $('#audioSection').val() }),
            dataType: 'json',
            success: (data) => {
                buildPlaylistUI(JSON.stringify(data));
                $('#editDialog').attr('hidden', 'hidden');
            }
        });
    }
}

// --- Audio Control ---

function stop() {
    _G.audioPlayer.pause();
    _G.audioPlayer.currentTime = 0;
    $('section').removeClass('playing').data('position', 0);
    $('section .seeker').css('width', '0%');
    $('#nowPlaying').text('');
}

function playOrPause(source) {
    if (_G.currentPlaying !== source) {
        if (_G.currentPlaying !== null) {
            _G.currentPlaying.classList.remove('playing');
        }
        $('#player').animate({ volume: 0 }, 1000).promise().done(() => {
            document.querySelector('#player source').src = '/music/' + $(source).data('guid');
            _G.audioPlayer.load();
            _G.audioPlayer.play();
            if ($(source).data('position') != null) {
                _G.audioPlayer.currentTime = $(source).data('position');
            };
            $('#player').animate({ volume: _G.maxVolume }, 1000);
            source.classList.add('playing');
            _G.currentPlaying = source;
        });
        return;
    }
    _G.currentPlaying = source;
    if (_G.audioPlayer.paused) {
        $('#player').animate({ volume: _G.maxVolume }, 1000);
        _G.audioPlayer.play();
        source.classList.add('playing');
    } else {
        $('#player').animate({ volume: 0 }, 1000).promise().done(() => {
            _G.audioPlayer.pause();
        });
        source.classList.remove('playing');
    }
}

// --- UI building from Playlist ---

function createNewHeader(title) {
    let articleElement = $('#playlist').append(`<article class='expanded' data-title="${title}
        "><header data-title="${title} " onclick="toggleSection(this) "><span/></header>
        <div class="droptarget "></div>
        </article>`);

    return $(`header[data-title="${title} "]`, '#playlist');
}

function createNewAudio(parent, fileObject, idx) {
    parent.after(`<section class="item " onclick="playOrPause(this) " data-guid="${fileObject.guid}
        " data-title="${fileObject.title} ">
        <div class="seeker "></div>
        <img src="/fileinfo/${fileObject.guid}">
        <button class="material-icons inline " onclick="editFile(event, ${idx}) ">edit</button>
    </section>`);
}

function buildPlaylistUIFromJSON(data) {
    $('#playlist').empty();
    data.files.sort((a, b) => {
        if (a.section > b.section) return 1
        else if (a.section == b.section) return 0
        else return -1;
    });

    _G.playlist = data.files;

    let lastSection = '';
    let section = null;
    let index = 0;
    for (let file of data.files) {
        if (file.section !== lastSection) {
            section = createNewHeader(file.section);
        }
        lastSection = file.section;
        createNewAudio(section, file, index);
        index++;
    }
}

function buildPlaylistUI(fromData) {
    stop();
    if (fromData !== null) {
        buildPlaylistUIFromJSON(JSON.parse(fromData));
    } else {
        $.getJSON('/playlist', (data) => {
            buildPlaylistUIFromJSON(data);
        });
    }

}

// --- Bootstrap Javascript ---

function main() {
    console.log('init');
    _G.audioPlayer.addEventListener('timeupdate', (event) => {
        if (_G.currentPlaying != null) {
            const factor = (_G.audioPlayer.currentTime / _G.audioPlayer.duration) * 100;

            $('.seeker', _G.currentPlaying).animate({ width: factor + '%' }, 1);
            $(_G.currentPlaying).data('position', _G.audioPlayer.currentTime);
            $('#nowPlaying').text($(_G.currentPlaying).data('title'));
        }
    });

    _G.audioPlayer.addEventListener('ended', (event) => {
        const nextElement = $('section.playing + section')[0];
        const firstElement = $('section', $('section.playing').parent())[0];
        $('#nowplaying').text('playback ended');
        console.log(nextElement, firstElement);
        _G.currentPlaying.classList.remove('playing');
        _G.audioPlayer.currentTime = 0;
        if (_G.loop == 'loopOne') {
            playOrPause(currentPlaying);
        } else if (_G.loop == 'loopSection') {
            if (nextElement != null) {
                playOrPause(nextElement);
            } else {
                playOrPause(firstElement);
            }

        }
    });

    document.getElementById('appTitle').addEventListener('click', () => {
        $(':root').toggleClass('dark');
    });

    document.getElementById('fileSelector').addEventListener('change', (event) => {
        if (event.srcElement.files.length > 0) {
            uploadFile(event.srcElement.files[0]);
        }
    });

    document.getElementById('volumeTracker').addEventListener('change', (event) => {
        _G.maxVolume = event.srcElement.value;
        $('#player').animate({ volume: _G.maxVolume }, 1000)
    });

    buildPlaylistUI(null);
}

main();
