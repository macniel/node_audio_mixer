export default class AudioFile extends HTMLElement {

    get color() {
        return this._color;
    }

    set color(color) {
        this._color = color;
        this.render();
    }

    get guid() {
        return this._guid;
    }

    set guid(guid) {
        this._guid = guid;
        this.render();
    }

    get title() {
        return this._title;
    }

    set title(title) {
        this._title = title;
        this.render();
    }

    get callback() {
        return this._callback;
    }

    set callback(callback) {
        if ( typeof callback === 'function') {
            this._callback = callback;
        }
    }

    get secondaryCallback () {
        return this._secondaryCallback;
    }

    set secondaryCallback(secondaryCallback) {
        if ( typeof secondaryCallback === 'function' ) {
            this._secondaryCallback = secondaryCallback;
        }
    }

    get seeker() {
        return this.querySelector('div.seeker');
    }

    static get observedAttributes() {
        return ['color', 'guid', 'title', 'callback', 'secondaryCallback'];
    }

    constructor() {
        super();
    }

    clickHandler() {
        if ( this.callback != null && typeof this.callback === 'function' ) {
            this.callback(this);
        }
        return false;
    }

    connectedCallback() {
        this.addEventListener('click', (event) => {
            this.clickHandler();
        });   
    }

    updateSeeker(currentTime, duration) {
        const factor = (currentTime / duration) * 100;
        //$('.seeker', this.currentPlaying).animate({ width: factor + '%' }, 1);
        this.seeker.style.width = factor + '%'; 
        this.dataset['position'] = currentTime;
    }

    set position(position) {
        this._position = position;
        this.seeker.style.width = position + '%';
    }

    get position() {
        return this._position;
    }

    render() {
        this.innerHTML = `<div class="seeker"></div>
        <img src="/fileinfo/${this.guid}">
        <button class="material-icons inline">edit</button>`;
        this.className = 'item ' + (this.color != null ? this.color : 'default');
        this.dataset['guid'] = this.guid;
        this.dataset['title'] = this.title;
        this.querySelector('button').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if ( this.secondaryCallback != null && typeof this.secondaryCallback === 'function' ) {
                this.secondaryCallback(this);
            }
            return false;
        });
    }

}
