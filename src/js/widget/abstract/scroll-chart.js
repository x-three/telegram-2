/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../scroll').THBounds} THBounds
 * @typedef {{ min: number, max: number }} TVBounds
 */


import { appendChild, assign, dpr } from '../../utils';
import { StateKeeper } from '../../utils/fx-helper';
import { AbstractAnyChart } from './any-chart';
const DPR = dpr();


export class AbstractScrollChart extends AbstractAnyChart {
    /**
     * @constructor
     * @param {HTMLElement} el
     * @param {TGraph[]} graphs
     * @param {TConfig} config
     */
    constructor(el, graphs, config) {
        super();

        this.el = el;
        this.el.className = 'b-scroll-chart';
        /** @type {HTMLCanvasElement} */
        this.eCanvas = appendChild(this.el, 'canvas');
        this.ctx = this.eCanvas.getContext('2d');

        this.config = config;

        this.state = new StateKeeper(this._redraw.bind(this));
        this.state.add('graphs', graphs);
        this.state.add('mask', graphs.map(() => '1').join('')); // Visible Graphs
        this.state.add('h-bounds', { first: 0, last: graphs[0].columns.length - 1 });
        this.state.add('v-bounds', {});

        this._initialize();
        this.update(null, true);

        window.addEventListener('resize', () => {
            const group = this.config.state.local.group;
            if (group && group.scroll.chart !== this) return;
            this.onResize();
        });
        this.onResize();
    }


    _initialize() {
        assign(this.config.state.local, this._getVBounds(this.state.mask));
    }


    onResize() {
        this.eCanvas.width = this.eCanvas.clientWidth * DPR;
        this.eCanvas.height = this.eCanvas.clientHeight * DPR;
        this.state.addFx('redraw');
    }


/* Update *************************************************************************************************************/
    /**
     * @param {THBounds} [newBounds]
     * @param {boolean} [instant]
     */
    update(hBounds, instant) {
        if (hBounds) {
            this.state['h-bounds'].first = hBounds.first;
            this.state['h-bounds'].last = hBounds.last;
        }

        if (instant) this.state.clearFx();
        const mask = this._getVisibleGraphsMask();
        this._updateVBounds(mask, instant);

        if (this.state.mask !== mask) {
            !instant && this._updateGraphVisibilityFx(mask);
            this.state.mask = mask;
        }

        this.state.addFx('redraw');
    }


    /**
     * @param {string} mask
     * @param {boolean} [instant]
     */
    _updateVBounds(mask, instant) {
        const cur = this.state['v-bounds'],
            neW = this._getVPercentBounds(mask);

        if (neW && (neW.min !== cur.min || neW.max !== cur.max)) {
            if (instant || this.state.mask.indexOf('1') === -1 || this.state.mask === mask) {
                cur.min = neW.min;
                cur.max = neW.max;
            } else {
                this.state.addFx('v-bounds', null, { min: cur.min, max: cur.max }, neW, this.config.fx.duration, this.config.fx.easing);
            }
        } else {
            this.state.removeFx('v-bounds');
        }
    }


    /**
     * @param {string} mask
     */
    _updateGraphVisibilityFx(mask) {
        for (let i = 0; i < mask.length; i++) {
            if (mask[i] !== this.state.mask[i]) {
                const id = 'graph-fade:' + i;

                if (!this.state[id]) {
                    if (mask[i] === '1') {
                        this.state.addFx(id, { index: i }, 0, 1, this.config.fx.duration, this.config.fx.easing, true);
                    } else {
                        this.state.addFx(id, { index: i }, 1, 0, this.config.fx.duration, this.config.fx.easing, true);
                    }
                } else {
                    this.state.invertFx(id);
                }
            }
        }
    }


/* Vertical Bounds ****************************************************************************************************/
    /**
     * @param {string} mask
     * @returns {TVBounds | null} 
     */
    _getVPercentBounds(mask) {
        if (mask.indexOf('1') === -1) return null;
        
        const local = this.config.state.local;
        if (local.scaled) return { min: 0, max: 1 };
        const vBounds = this._getVBounds(mask);

        return {
            min: (vBounds.min - local.min) / (local.max - local.min),
            max: (vBounds.max - local.min) / (local.max - local.min)
        };
    }


    /**
     * @param {string | number} id Mask or Index
     * @returns {TVBounds | null} 
     */
    _getVBounds(id) {
        if (typeof id === 'string' && id.indexOf('1') === -1) return null;

        return {
            min: this._getMinValue(id),
            max: this._getMaxValue(id)
        };
    }
}