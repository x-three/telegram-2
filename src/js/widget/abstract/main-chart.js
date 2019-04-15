/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../').TChartType} TChartType
 * @typedef {import('../').TColumnData} TColumnData
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 * @typedef {import('../../utils').TColorObj} TColorObj
 * @typedef {{ min: number, max: number }} TVBounds
 * @typedef {{ index: number }} TZoomEventData
 */


import { appendChild, Zoomable, colors, dpr } from '../../utils';
import { StateKeeper } from '../../utils/fx-helper';
import { Grid } from '../grid';
import { Tooltip } from '../tooltip';
import { AbstractAnyChart } from './any-chart';
const DPR = dpr();


export class AbstractMainChart extends AbstractAnyChart {
    /**
     * @constructor
     * @param {HTMLElement} el 
     * @param {TColumnData} xAxis
     * @param {TGraph[]} graphs
     * @param {TConfig} config
     * @param {TChartType} type
     * @param {boolean | number} zoomed
     */
    constructor(el, xAxis, graphs, config, type, zoomed) {
        super();

        this.el = el;
        this.el.className = 'b-main-chart m-' + type;
        if (zoomed) this.el.className += ' m-zoomed';
        /** @type {HTMLCanvasElement} */
        this.eCanvas = appendChild(this.el, 'canvas');
        this.ctx = this.eCanvas.getContext('2d');
        
        this.config = config;
        this._initHMargin();

        this.state = new StateKeeper(this._redraw.bind(this));
        this.state.add('xAxis', xAxis);
        this.state.add('graphs', graphs);
        this.state.add('type', type);
        this.state.add('zoomed', zoomed);
        this.state.add('mask', graphs.map(() => '1').join('')); // Visible Graphs
        this.state.add('h-bounds', {});
        this.state.add('v-bounds', {});

        const onZoom = (column) => {
            this.el.dispatchEvent(new CustomEvent('zoom', {
                bubbles: true,
                detail: { column }
            }));
        };

        this.grid = new Grid(this.eCanvas, this.config, this.state);
        this.tooltip = new Tooltip(this.eCanvas, this.config, this.state, onZoom);
        
        window.addEventListener('resize', () => {
            const group = this.config.state.local.group;
            if (group && group.main !== this) return;
            this.onResize();
        });
        this.onResize();

        Zoomable(this, onZoom);
    }


    _initHMargin() {
        const style = getComputedStyle(this.el);
        
        if (this.config.chart.margin.left == null) {
            this.config.chart.margin.left = -parseFloat(style.marginLeft);
        }
        if (this.config.chart.margin.right == null) {
            this.config.chart.margin.right = -parseFloat(style.marginRight);
        }
    }


    onResize() {
        this.eCanvas.width = this.eCanvas.clientWidth * DPR;
        this.eCanvas.height = this.eCanvas.clientHeight * DPR;
        const hBounds = this.state['h-bounds'];
        if (hBounds.first) this.grid.updateHorizontalFx(hBounds);
        this.state.addFx('redraw');
    }


/* Update *************************************************************************************************************/
    /**
     * @param {TVBounds} [hBounds]
     * @param {boolean} [instant]
     */
    update(hBounds, instant) {
        if (hBounds) {
            this.grid.updateHorizontalFx(hBounds, instant);
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
            this.grid.updateVerticalFx(neW.values, mask, instant);
            if (instant) {                         // Instant
                cur.min = neW.min;
                cur.max = neW.max;
            } else if (this.state.mask === mask) { // Horizontal scroll
                if (cur.min == null || cur.max == null) {
                    this.state.addFx('v-bounds', { event: 'scroll' }, { min: cur.fx.to.min, max: cur.fx.to.max }, neW, this.config.fx.duration, this.config.fx.easing);
                } else {
                    const duration = this.config.fx.duration * 0.75,
                        oldStart = cur.oldStart != null ? cur.oldStart : (cur.fx ? cur.fx.start : null),
                        pos = oldStart == null ? 0 : Math.min(1, (Date.now() - oldStart) / duration),
                        old = { min: cur.min + (neW.min - cur.min) * pos, max: cur.max + (neW.max - cur.max) * pos };
                    this.state.addFx('v-bounds', { event: 'scroll' }, old, neW, duration * (1 - pos), this.config.fx.easing);
                }
            } else {                               // Check Button
                this.state.addFx('v-bounds', { event: 'check' }, { min: cur.min || 0, max: cur.max || 1 }, neW, this.config.fx.duration, this.config.fx.easing);
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


/* Draw ***************************************************************************************************************/
    /**
     * @typedef {{ width: number, height: number, first: number, last: number, margin: import('../../config').TChartMargin, top: number, bottom: number, left: number, right: number, max: number, p3: number, step: number, hlw: number, po: number, leftTail: number, rightTail: number, cXText: TColorObj, cYText: TColorObj, cGrid: TColorObj }} TDrawData
     * @returns {TDrawData}
     */
    _getDrawData() {
        const type = this.state.type,
            width = this.eCanvas.width,
            height = this.eCanvas.height,
            first = this.state['h-bounds'].first,                                            // First visible column
            last = this.state['h-bounds'].last,                                              // Last visible column
            margin = this.config.chart.margin,
            top = margin.top * DPR,
            bottom = height - margin.bottom * DPR,
            left = margin.left * DPR,
            right = width - margin.right * DPR,
            step = (width - left - margin.right * DPR) / (last - first + +(type === 'bar')), // Distance between two columns
            hlw = this.config.chart.thickness.grid / 2,                                      // Half Line Width (without DPR)
            po = (Math.ceil(hlw) - hlw) * DPR,                                               // Point Offset. To draw lines without anti-aliasing (if possible)
            leftTail = Math.max(0, first - Math.ceil(left / step)),
            rightTail = Math.min(this.state.xAxis.length - 1, last + Math.ceil(margin.right * DPR / step)),
            cXText = colors(this.config)[type].xText,
            cYText = colors(this.config)[type].yText,
            cGrid = colors(this.config)[type].grid;

        return { width, height, first, last, margin, top, bottom, left, right, step, hlw: hlw * DPR, po, leftTail, rightTail, cXText, cYText, cGrid };
    }


/* Vertical Bounds ****************************************************************************************************/
    /**
     * @param {string} mask
     * @returns {TVBounds | null} 
     */
    _getVPercentBounds(mask) {
        if (mask.indexOf('1') === -1) return null;
        
        const local = this.config.state.local,
            bounds = this._getVLabelBounds(mask);

        if (!local.scaled) {
            return {
                min: (bounds.min - local.min) / (local.max - local.min),
                max: (bounds.max - local.min) / (local.max - local.min),
                values: bounds.values
            };
        }
        else {
            const graph = this.state.graphs[mask.indexOf('1')];
            return {
                min: (bounds.min - graph.min) / (graph.max - graph.min),
                max: (bounds.max - graph.min) / (graph.max - graph.min),
                values: bounds.values
            };
        }
    }


    /**
     * @param {string | TVBounds} from Mask or Vertical Bounds
     * @returns {TVBounds | null} 
     */
    _getVLabelBounds(from) {
        if (typeof from === 'string') {
            if (from.indexOf('1') === -1) return null;
            else return this._getVLabelBounds(this._getVBounds(from));
        }
        
        const margin = this.config.chart.margin,
            p31 = (from.max - from.min) / (this.eCanvas.height - margin.top * DPR - margin.bottom * DPR),
            labels = this.grid.getVLabelBounds(from),
            hFont = this.config.font.size * this.config.font.hLetter * DPR,
            offset = this.config.chart.labelVOffset.left * DPR,
            p32 = (labels.max - from.min) / (this.eCanvas.height - margin.top * DPR - margin.bottom * DPR - hFont - offset);

        return {
            min: labels.min, 
            max: p31 > p32 ? from.max : (labels.max + (hFont + offset) * p32),
            values: from
        };
    }


    /**
     * @param {string | number} id Mask or Index
     * @returns {TVBounds | null} 
     */
    _getVBounds(id) {
        if (typeof id === 'string' && id.indexOf('1') === -1) return null;

        if (typeof id === 'number' || !this.config.state.local.scaled) {
            return { 
                min: this._getMinValue(id),
                max: this._getMaxValue(id)
            };
        } 
        
        else {
            return this.state.graphs.reduce((result, graph, i) => {
                if (id[i] === '0') return result;
                let temp = this._getVBounds(i);
                if (!temp) return result;
                if (!result) return { bounds: temp, index: i };
                
                temp = this._translateVBounds(i, result.index, temp);
                result.bounds.min = Math.min(result.bounds.min, temp.min);
                result.bounds.max = Math.max(result.bounds.max, temp.max);
                return result;

            }, null).bounds;
        }
    }
}
