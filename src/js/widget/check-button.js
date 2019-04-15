/**
 * @typedef {import('../config').TConfig} TConfig
 * @typedef {{ type: 'check' | 'uncheck-others', state?: boolean }} TCheckEventData
 */


import { appendChild, isMobile } from '../utils';


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {string} name 
 * @param {string} color 
 * @param {boolean} checked 
 * @param {TConfig} config 
 */
export function CheckButton(el, name, color, checked, config) {
    this.el = el;
    this.el.classList.add('b-check-button');
    this.config = config;

    this._initChildren(name);
    this.update(color);

    this.state = checked;
    this.toggleState(this.state, true);
    this._bind();
}


/**
 * @param {string} name
 */
CheckButton.prototype._initChildren = function(name) {
    this.eIcon = appendChild(this.el, 'i', 'e-icon');
    this.eLabel = appendChild(this.el, 'span', 'e-label');
    this.eLabel.textContent = name;
};


CheckButton.prototype._bind = function() {
    if (isMobile()) {
        let id = null;
        
        this.el.addEventListener('touchstart', () => {
            id = setTimeout(() => {
                id = null;
                this._onRightClick();
            }, this.config.timeout.longTap);
        });

        this.el.addEventListener('touchend', () => {
            if (id !== null) {
                clearTimeout(id);
                this._onClick();
            }
        });
    } 
    
    else {
        this.el.addEventListener('click', this._onClick.bind(this));
        this.el.addEventListener('contextmenu', (ev) => {
            ev.preventDefault();
            this._onRightClick();
        });
    }
};


/**
 * @param {string} color
 */
CheckButton.prototype.update = function(color) {
    this.eLabel.style.color = color;
    this.el.style.backgroundColor = color;
};


/**
 * @param {boolean | undefined} [state]
 * @param {boolean} [silent]
 */
CheckButton.prototype.toggleState = function(state, silent) {
    this.state = state != null ? state : !this.state;

    if (this.state) {
        this.el.classList.add('m-checked');
        this.el.classList.remove('m-unchecked');
    } else {
        this.el.classList.remove('m-checked');
        this.el.classList.add('m-unchecked');
    }

    if (!silent) {
        this.el.dispatchEvent(new CustomEvent('check', {
            bubbles: true,
            detail: { type: 'check', state: this.state }
        }));
    }
};


CheckButton.prototype._onClick = function() {
    this.toggleState();
};


CheckButton.prototype._onRightClick = function() {
    this.toggleState(true, true);
    this.el.dispatchEvent(new CustomEvent('uncheck-others', { 
        bubbles: true,
        detail: { type: 'uncheck-others' }
    }));
};