/**
 * @constructor
 * @param {HTMLElement} el 
 */
export function ToggleButton(el) {
    this.el = el;
    this._initState();

    this.el.addEventListener('click', () => {
        this.update(this.index + 1);
    });
}


ToggleButton.prototype._initState = function() {
    this.states = Array.prototype.map.call(this.el.querySelectorAll('[state]'), (node, i) => {
        return { value: node.getAttribute('state'), el: node };
    });

    const index = +this.el.getAttribute('initial-state') || 0;
    this.update(index, true);
};


/**
 * @param {number} index
 */
ToggleButton.prototype.update = function(index, silent) {
    this.index = Math.max(0, index) % this.states.length;
    this.states.forEach((s, i) => {
        s.el.style.display = i === this.index ? 'inline' : 'none';
    });
    
    if (!silent) {
        this.el.dispatchEvent(new CustomEvent('toggle', {
            bubbles: true,
            detail: { index: this.index, state: this.states[this.index].value }
        }));
    }
};