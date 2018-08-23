import ColorSwatch from "./colorswatch.js";

export default class EditDialog extends HTMLElement {
    
    static get observedAttributes() {return ['file', 'callback']; }

    get supportedColors() {
        return [
            'red',
            'yellow',
            'green',
            'default',
            'blue',
            'purple',
            'pink'
        ];
    } 

    get file() {
        return this._file;
    }

    set file(file) {
        this._file = file;
        this.render();
    }

    get callback() {
        return this._callback;
    }

    set callback(callback) {
        this._callback = callback;
        this.render();
    }

    constructor() {
        super();
    }

    connectedCallback() {
        
    }

    open(file) {
        this.file = file;
        this.fileTitle = file.title;
        this.fileSection = file.section;
        this.fileColor = file.color;
        this.fileGuid = file.guid;
        this.removeAttribute('hidden');
        this.render();
    }

    close() {
        this.file = null;
        this.fileTitle = null;
        this.fileSection = null;
        this.fileColor = null;
        this.fileGuid = null;
        this.setAttribute('hidden', 'hidden');
    }

    render() {
        this.innerHTML = `
        <div class="entry">
            <label for="title">Titel</label>
            <input name="title" type="text" id="audioTitle" value="${this.fileTitle}">
        </div>
        <div class="entry">
            <label for="section">Sektion</label>
            <input name="section" type="text" id="audioSection" value="${this.fileSection}">
        </div>
        <div class="entry">
            <label>Farbe</label>
            <div id="dialogSwatches"></div>
        </div>
        <button id="saveBtn">Übernehmen</button>
        <button id="cancelBtn">Abbrechen</button>
        <button id="deleteBtn" class="danger">Entfernen</button>`;
        this.className = 'dialog';
        this.id = 'editdialog';
        this.populateSwatches();

        this.querySelector('#saveBtn').addEventListener('click', (event) => {
            this.fileTitle = this.querySelector('input[name="title"]').value;
            this.fileSection = this.querySelector('input[name="section"]').value;
            event.preventDefault();
            event.stopPropagation();
            if ( this.callback != null && typeof this.callback === 'function' ) {
                this.callback({action: 'update', title: this.fileTitle, section: this.fileSection, color: this.fileColor, guid: this.fileGuid});
            }
            return false;
        });
        this.querySelector('#cancelBtn').addEventListener('click', (event) => {
            this.fileTitle = this.querySelector('input[name="title"]').value;
            this.fileSection = this.querySelector('input[name="section"]').value;
            event.preventDefault();
            event.stopPropagation();
            if ( this.callback != null && typeof this.callback === 'function' ) {
                this.callback({action: 'cancel', guid: this.fileGuid });
            }
            return false;
        });
        this.querySelector('#deleteBtn').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if ( this.callback != null && typeof this.callback === 'function' ) {
                this.callback({action: 'delete', guid: this.fileGuid });
            }
            return false;
        });
    }

    populateSwatches() {
        let dialogSwatches = this.querySelector('#dialogSwatches');
        for ( const colorName of this.supportedColors ) {
            
            const isSelected = this.fileColor === colorName;
            let colorSwatch = new ColorSwatch(colorName, isSelected);
            colorSwatch.addEventListener('colorselect', (event) => {
                this.colorChange(event); 
            });
            dialogSwatches.appendChild(colorSwatch);
        }
    }

    colorChange(event) {
        document.querySelectorAll('app-colorswatch').forEach( (element) => {
            if ( element.colorName === event.detail.colorName ) {
                element.selected = true;
                this.fileColor = element.colorName;
            } else {
                element.selected = false;
            }
        });
    }
}