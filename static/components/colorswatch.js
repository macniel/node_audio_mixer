/* jshint esversion: 6 */
export default class ColorSwatch extends HTMLElement {
    
    static get observedAttributes() {return ['colorName', 'selected']; }

    get colorName() {
        return this._colorName;
    }

    set colorName(colorName) {
        this._colorName = colorName;
        this.render();
    }

    get selected() {
        return this._selected;
    }
    
    set selected(selected) {
        this._selected = selected;
        this.render();
    }

    constructor(colorName, isSelected) {
        super();
        this._colorName = colorName;
        this._selected = isSelected;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `<div class="swatch ${this.colorName} value="${this.colorName.trim()}" ${this.selected? 'selected': ''}> <div class="inner-triangle"></div>
            <div class="outer-triangle"></div></div>`;
        this.querySelector('div').addEventListener('click', (event) => {
            this.selectColor();
        });
    }

    selectColor() {
        let e = new CustomEvent('colorselect', {detail: { colorName: this.colorName}, bubbles: true} );
        this.dispatchEvent(e);
    }

}