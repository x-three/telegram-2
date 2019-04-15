/**
 * @typedef {import('../config').TConfig} TConfig
 * @typedef {import('../').TChartType} TChartType
 * @typedef {{ first: number, last: number }} THBounds
 * @typedef {import('../utils').TDragData} TDragData
 * @typedef {import('./').TGraph} TGraph
 */


import { appendChild, getOffset, draggable } from '../utils';
import { ScrollLineChart } from './line/scroll-chart';
import { ScrollBarChart } from './bar/scroll-chart';
import { ScrollAreaChart } from './area/scroll-chart';


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {TGraph[]} graphs
 * @param {TConfig} config
 * @param {TChartType} type
 * @param {number} fixedMinColumns
 */
export function Scroll(el, graphs, config, type, fixedMinColumns) {
    this.el = el;
    this.el.classList.add('b-scroll');

    this.graphs = graphs;
    this.config = config;
    this.type   = type;
    this.min    = fixedMinColumns;
    this.bounds = { first: -1, last: -1 };
    this._initChart();
    
    this.eLeft = appendChild(this.el, 'span', 'e-overlay m-left');
    this.eRight = appendChild(this.el, 'span', 'e-overlay m-right');
    this.eSelector = appendChild(this.el, 'div', 'd-selector');
    this.eLeftEdge = appendChild(this.eSelector, 'span', 'e-edge m-left');
    this.eRightEdge = appendChild(this.eSelector, 'span', 'e-edge m-right');

    draggable(this.el, this._onDrag.bind(this));
    draggable(this.eSelector, this._onSelectorDrag.bind(this));
    draggable(this.eLeftEdge, this._onLeftDrag.bind(this));
    draggable(this.eRightEdge, this._onRightDrag.bind(this));

    window.addEventListener('resize', () => { 
        const group = this.config.state.local.group;
        if (group && group.scroll !== this) return;
        this._initData(null, null, null, true);
    });
    this._initData(null, null, true);
}


Scroll.prototype._initChart = function() {
    let Constructor;
    switch (this.type) {
        case 'line': Constructor = ScrollLineChart; break;
        case 'bar': Constructor = ScrollBarChart; break;
        case 'pie':
        case 'area': Constructor = ScrollAreaChart; break;
    }
    this.chart = new Constructor(appendChild(this.el, 'div'), this.graphs, this.config);
};


/**
 * @param {THBounds} hBounds
 * @param {boolean} [silent]
 */
Scroll.prototype.update = function(hBounds, silent) {
    const max = this.graphs[0].columns.length - 1;
    this._initData(max - hBounds.last, max - hBounds.first, silent);
};


/**
 * @param {number} [start]
 * @param {number} [end]
 * @param {boolean} [silent]
 * @param {boolean} [resize]
 */
Scroll.prototype._initData = function(start, end, silent, resize) {
    const cols = this.config.columns,
        wEl = this.el.clientWidth,
        k = cols.adaptive ? wEl / cols.adaptive : 1;

    if (start == null) start = cols.start;
    if (end == null) end = cols.end;

    const w1 = 1 / (this.graphs[0].columns.length - 1);
    this.minWidth = Math.min(1, (this.min != null ? this.min : ~~((cols.min - 1) * k)) * w1);
    this.maxWidth = (!cols.max || cols.max < (this.min != null ? this.min : cols.min)) ? 1 : Math.min(1, (~~((cols.max - 1) * k)) * w1);
    if (this.width != null) this.width = Math.max(this.minWidth, Math.min(this.maxWidth, this.width));
    else this.width = (!end || end < start) ? this.minWidth : Math.min(1, Math.max(this.minWidth, (end - start) * w1));
    if (!resize) this.pos = Math.max(0, 1 - this.width - start * w1);
    // else this.width = (!cols.end || cols.end < cols.start) ? this.minWidth : Math.min(1, Math.max(this.minWidth, (cols.end - cols.start) * w1));
    // this.pos = Math.max(0, 1 - this.width - cols.start * w1);
    this._updateSelector(silent);
};


/**
 * @param {boolean} [silent]
 */
Scroll.prototype._updateSelector = function(silent) {
    const left = Math.round(this.pos * 10000) / 100,
        right = Math.round((1 - this.pos - this.width) * 10000) / 100;

    this.eSelector.style.left  = this.eLeft.style.width  = left + '%';
    this.eSelector.style.right = this.eRight.style.width = right + '%';

    const newBounds = this.getBounds();
    if (newBounds.first === newBounds.last) throw 'Invalid Environment';
    const oldBounds = this.bounds;
    this.bounds = newBounds;

    if (!silent && (oldBounds.first !== newBounds.first || oldBounds.last !== newBounds.last)) {
        this.el.dispatchEvent(new CustomEvent('new-bounds', {
            bubbles: true,
            detail: newBounds
        }));
    }
};


/**
 * @returns {THBounds}
 */
Scroll.prototype.getBounds = function() {
    const length = this.graphs[0].columns.length - 1,
        first = Math.round(length * this.pos),
        last = (this.pos + this.width > 0.999 ? length : Math.round(length * (this.pos + this.width)));

    return { first, last };
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Scroll.prototype._onDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left,
        newPos = (pos.x - ox) / wEl - this.width / 2;

    this.pos = Math.max(0, Math.min(1 - this.width, newPos));
    this._updateSelector();
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Scroll.prototype._onSelectorDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left,
        newPos = (pos.x - ox - pos.ox) / wEl;

    this.pos = Math.max(0, Math.min(1 - this.width, newPos));
    this._updateSelector();
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Scroll.prototype._onLeftDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left - 1.5,
        right = this.pos + this.width,
        newPos = (pos.x - ox - pos.ox) / wEl;

    this.pos = Math.max(0, right - this.maxWidth, Math.min(right - this.minWidth, newPos));
    this.width = right - this.pos;
    this._updateSelector();
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Scroll.prototype._onRightDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left + 1.5,
        oxRight = this.eRightEdge.clientWidth - pos.ox,
        newWidth = (pos.x - ox + oxRight) / wEl - this.pos;

    this.width = Math.max(this.minWidth, Math.min(1 - this.pos, this.maxWidth, newWidth));
    this._updateSelector();
};