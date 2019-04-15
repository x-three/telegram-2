/**
 * @typedef {import('../config').TConfig} TConfig
 * @typedef {import('./scroll').THBounds} THBounds
 * @typedef {import('./line/chart').TVBounds} TVBounds
 * @typedef {import('./line/chart').TDrawData} TDrawData
 * @typedef {import('../utils/fx-helper').StateKeeper} StateKeeper
 */


import { objToColor, valueToLabel, dpr } from '../../utils';
import { BottomDayLabels } from './bottom-day-labels';
import { BottomHourLabels } from './bottom-hour-labels';
import { AbstractAnyChart } from '../abstract/any-chart';
const DPR = dpr();


/**
 * @constructor
 * @param {HTMLCanvasElement} canvas
 * @param {TConfig} config
 * @param {StateKeeper} state
 */
export function Grid(canvas, config, state) {
    this.eCanvas = canvas;
    this.config = config;
    this.state = state;

    this.vLabelsCount = 6;
    const Constructor = this.state.zoomed ? BottomHourLabels : BottomDayLabels;
    this.hLabels = new Constructor(canvas, this.config, this.state);
}


/* Update *************************************************************************************************************/
/**
 * @param {THBounds} hBounds
 * @param {boolean} [instant]
 */
Grid.prototype.updateHorizontalFx = function(hBounds, instant) {
    const minPreset = this.hLabels.getMinLabelPresetId(hBounds),
        presets = this.hLabels.getVisibleLabels(hBounds);

    if (instant) {
        this.state.removeFx('h-labels', true);
        for (let p in presets) {
            if (!(p < minPreset)) { // It may be a string that is always show
                this.state.add('h-labels:' + p, { preset: +p || p });
            }
        }
    } 
    
    else {
        const oldHBounds = this.state['h-bounds'];

        if (oldHBounds.minPreset !== minPreset || Object.keys(this.hLabels.getVisibleLabels(oldHBounds)).join(' ') !== Object.keys(presets).join(' ')) {
            const fxItems = this.state.get('h-labels');
            for (let n in fxItems) {
                const item = fxItems[n];

                if (!item.fx) { // Update existing
                    if (item.preset < minPreset) {
                        for (let n in fxItems) { // Immediately hide previous hidden labels to avoid large amounts of animated text
                            if (fxItems[n].fx && fxItems[n].fx.to === 0 && fxItems[n].preset < item.preset) {
                                this.state.removeFx(n, true);
                            }
                        };
                        this.state.addFx(n, null, 1, 0, this.config.fx.duration, null, true);
                    }
                } else {
                    if (item.fx.to === 1 && item.preset < minPreset) this.state.invertFx(n, true);
                    else if (item.fx.to === 0 && item.preset >= minPreset) this.state.invertFx(n, false);
                }
            }

            for (let p in presets) { // Show new
                const idFx = 'h-labels:' + p;
                if (!fxItems[idFx] && !(p < minPreset)) {
                    this.state.addFx(idFx, { preset: +p || p }, 0, 1, this.config.fx.duration);
                }
            }
        }
    }

    this.state['h-bounds'].minPreset = minPreset;
};


/**
 * @param {TVBounds} vBounds
 * @param {string} mask
 * @param {boolean} [instant]
 */
Grid.prototype.updateVerticalFx = function(vBounds, mask, instant) {
    const neW = this.getVLabelBounds(vBounds),
        idNew = 'v-labels:' + neW.max + '-' + neW.min;

    if (instant) {
        this.state.removeFx('v-labels', true);
        this.state.add(idNew, { labels: this._getVLabels(neW), graph: mask.indexOf('1') });
    } 

    else {
        const fxItems = this.state.get('v-labels');
        for (let n in fxItems) { // Update existing
            if (n !== idNew) {
                if (!fxItems[n].fx) this.state.addFx(n, null, 1, 0, this.config.fx.duration, null, true);
                else if (fxItems[n].fx.to === 1) this.state.invertFx(n, true);
            }
        }

        const newItem = fxItems[idNew]; // Show new
        if (!newItem) this.state.addFx(idNew, { labels: this._getVLabels(neW), graph: mask.indexOf('1') }, 0, 1, this.config.fx.duration);
        else if (newItem.fx && newItem.fx.to === 0) this.state.invertFx(idNew, false);
    }
};


/* Draw ***************************************************************************************************************/
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {TDrawData} data
 */
Grid.prototype.draw = function(ctx, data) {
    this._drawHorizontalLabels(ctx, data);
    this._drawVerticalLabels(ctx, data);
};


/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {TDrawData} data
 */
Grid.prototype._drawHorizontalLabels = function(ctx, { width, first, margin, left, bottom, step, cXText }) {
    ctx.font = this.config.font.weight + ' ' + (this.config.font.size * DPR) + 'px ' + this.config.font.family;
    ctx.fillStyle = objToColor(cXText);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const fxItems = this.state.get('h-labels'),
        range = this.hLabels.getVisibleLabelsRange(this.state['h-bounds']),
        presets = this.hLabels.createPresets(range),
        y = bottom + this.config.chart.labelVOffset.bottom * DPR,
        x = left + (this.state.xAxis.length - 1 - first - range.last + (this.state.type === 'bar' ? 0.5 : 0)) * step;

    // Draw first
    if (presets['first']) {
        const value = presets['first'][0],
            label = this.hLabels.getLabel(value),
            w = this.hLabels.measure(label);

        let xLabel = x + (range.last - value) * step;
        if (xLabel - w / 2 < width && this.state['h-bounds'].last === this.state.xAxis.length - 1) {
            xLabel = Math.min(xLabel, width - margin.right * DPR * 0.75 - w / 2);
        }

        ctx.fillStyle = objToColor(cXText);
        ctx.fillText(label, xLabel, y);
    }

    // Draw last
    const oLastLabel = (range.last === this.state.xAxis.length - 1) ? this.hLabels.getLastLabel(presets) : null;

    if (oLastLabel) {
        const label = this.hLabels.getLabel(oLastLabel.value),
            w = this.hLabels.measure(label),
            xLabel = left + (this.state.xAxis.length - 1 - oLastLabel.value) * step - w / 2;

        if (xLabel > left / DPR) {
            ctx.fillStyle = objToColor(cXText);
            ctx.fillText(label, xLabel, y);
        }
    }

    // Draw other labels
    for (let n in fxItems) {
        const p = fxItems[n].preset;
        if (!(typeof p === 'number' && presets[p])) continue;

        const fx = fxItems[n].fx; 
        ctx.fillStyle = objToColor(cXText, !fx ? 1 : fx.value);

        for (let j = 0; j < presets[p].length; j++) {
            if (oLastLabel && presets[p][j] === oLastLabel.value) continue;
            ctx.fillText(this.hLabels.getLabel(presets[p][j]), x + (range.last - presets[p][j]) * step, y);
        }
    }
};


/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {TDrawData} data
 */
Grid.prototype._drawVerticalLabels = function(ctx, { top, bottom, left, right, po, hlw, cYText, cGrid }) {
    ctx.font = this.config.font.weight + ' ' + (this.config.font.size * DPR) + 'px ' + this.config.font.family;
    ctx.fillStyle = objToColor(cYText);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    
    ctx.strokeStyle = objToColor(cGrid);
    ctx.lineWidth = this.config.chart.thickness.grid * DPR; 
    ctx.lineCap = 'butt';

    const fxItems = this.state.get('v-labels');

    for (let n in fxItems) {
        const item = fxItems[n],
            opacity = !item.fx ? 1 : item.fx.value,
            graph = this.state.graphs[item.graph],
            local = this.config.state.local,
            { min, max } = this._percentToVBounds(null, local.scaled ? graph : local),
            p3 = (max - min) / (bottom - top);

        ctx.strokeStyle = objToColor(cGrid, opacity);
        ctx.fillStyle = objToColor(cYText, opacity);

        ctx.beginPath();
        for (let i = 0; i < item.labels.length; i++) {
            const y = Math.round(bottom - (item.labels[i].value - min) / p3); //Math.round(top + (max - item.labels[i].value) / p3);
            ctx.moveTo(left - hlw - po, y - po);
            ctx.lineTo(right + hlw - po, y - po);
            ctx.fillText(item.labels[i].text, left, y - this.config.chart.labelVOffset.left * DPR);
        }
        ctx.stroke();
    }
};


/* Labels *************************************************************************************************************/
/**
 * @typedef {{ value: number, text: string }} TLabelItem
 * @param {TVBounds} label
 * @returns {TLabelItem[]}
 */
Grid.prototype._getVLabels = function(label) {
    const step = (label.max - label.min) / (this.vLabelsCount - 1);
    const result = [];

    for (let i = 0; i < this.vLabelsCount; i++) {
        const value = label.min + step * i;
        result.push({ value, text: valueToLabel(value, this.config.localization) });
    }
    return result;
};


/**
 * @param {TVBounds} value
 * @returns {TVBounds}
 */
Grid.prototype.getVLabelBounds = function(value) {
    const intervals = this.vLabelsCount - 1,
        pow = Math.max(0, (~~value.max).toString().length - 3),
        k = (10 ** pow) * intervals,
        max = Math.floor(value.max / k) * k,
        min = max - Math.ceil((value.max - value.min) / k * 10 / intervals) * intervals * k / 10;
    
    return { 
        max, 
        min: this.state.type === 'line' ? Math.max(0, min) : 0
    };
};


/* Misc ***************************************************************************************************************/
Grid.prototype._percentToVBounds = AbstractAnyChart.prototype._percentToVBounds;