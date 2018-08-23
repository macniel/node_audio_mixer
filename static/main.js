import ColorSwatch from './components/colorswatch.js';
import Boot from './boot.js';
import AudioFile from './components/audiofile.js';
import EditDialog from './components/editdialog.js';
import Header from './components/header.js';


if (!customElements.get('app-colorswatch')) {
    customElements.define('app-colorswatch', ColorSwatch);
}

if (!customElements.get('app-editdialog')) {
    customElements.define('app-editdialog', EditDialog);
}

if (!customElements.get('app-audiofile')) {
    customElements.define('app-audiofile', AudioFile);
}

if (!customElements.get('app-header')) {
    customElements.define('app-header', Header);
}

new Boot();