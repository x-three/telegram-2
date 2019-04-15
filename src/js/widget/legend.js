/**
 * @typedef {import('./check-button').TCheckEventData} TCheckEventData
 */


import { appendChild, replaceEl, objToColor, colors } from '../utils';
import { CheckButton } from './check-button';

/**
 * @constructor
 * @param {HTMLElement} el
 * @param {TGraph[]} graphs
 * @param {TConfig} config
 */
export function Legend(el, graphs, config, cb) {
    this.el = replaceEl(el, 'ul', 'b-legend');
    this.graphs = graphs;
    this.config = config;
    this.cb = cb;
    
    this.list = graphs.map((g, i) => {
        const li = appendChild(this.el, 'li');
        const color = objToColor(colors(config, g.color).button);
        li.addEventListener('check', this._onCheck.bind(this, i));
        li.addEventListener('uncheck-others', this._onUncheckOthers.bind(this, i));
        return new CheckButton(li, g.name, color, g.visible, config);
    });

    this.el.setAttribute('size', this.list.length);
}


Legend.prototype.update = function() {
    this.list.forEach((button, i) => {
        const color = colors(this.config, this.graphs[i].color).button;
        button.update(objToColor(color));
    });
};


/**
 * @param {number} index
 * @param {{ detail: TCheckEventData }} ev
 */
Legend.prototype._onCheck = function(index, ev) {
    this.cb(index, ev.detail);
};


/**
 * @param {number} index
 * @param {{ detail: TCheckEventData }} ev
 */
Legend.prototype._onUncheckOthers = function(index, ev) {
    this.list.forEach((button, i) => {
        if (i !== index) button.toggleState(false, true);
    });
    this.cb(index, ev.detail);
};