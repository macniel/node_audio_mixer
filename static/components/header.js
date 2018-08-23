export default class Header extends HTMLElement {

    get title() {
        return this._title;
    }

    set title(title) {
        this._title = title;
        this.render();
    }

    get collapsed() {
        return this._collapsed;
        
    }

    set collapsed(collapsed) {
        this._collapsed = collapsed;
        this.render();
    }

    static get observedAttributes() {
        return ['title', 'collapsed'];
    }

    constructor() {
        super();
        this.collapsed = false;
    }

    

    clickHandler() {
        if ( this.collapsed ) {
            this.collapsed = false;
        } else {
            this.collapsed = true;
        }
        this.render();
    }

    connectedCallback() {
        this.innerHTML = `<article class="${this.collapsed === true ? '' :'expanded'}" data-title="${this.title}">
        <header><span>${this.title}</span></header></article>`;
        this.querySelector('header').addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.clickHandler();
        });  
    }

    render() {
        if ( this.innerHTML !== '' ) {
            if ( this.collapsed ) {
                this.querySelector('article').className = '';
            } else {
                this.querySelector('article').className = 'expanded';
            }
            this.querySelector('article').dataset['title'] = this.title;
            
            this.getElementsByTagName('span')[0].textContent = this.title;
        }
    }

}
