/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../../utils/fx-helper').StateKeeper} StateKeeper
 * @typedef {import('../scroll').THBounds} THBounds
 * @typedef {THBounds} TLabelsRange
 * @typedef {{ [id: string]: number[] }} TPresets
 */


import { dpr } from '../../utils';
const DPR = dpr();


export class BottomDayLabels {
    /**
     * @constructor
     * @param {HTMLCanvasElement} canvas
     * @param {TConfig} config
     * @param {StateKeeper} state
     */
    constructor(canvas, config, state) {
        this.eCanvas = canvas;
        this.config = config;
        this.state = state;
        this.maxLabelWidth = this.getMaxLabelWidth();
    }


    /**
     * @param {THBounds} hBounds
     * @returns {TLabelsRange}
     */
    getVisibleLabelsRange(hBounds) {
        const iPreset = this.getMinLabelPresetId(hBounds),
            offset = this._getFirstLabelOffset(),
            max = this.state.xAxis.length - 1;

        let first = (Math.ceil(Math.max(0, this.state.xAxis.length - 1 - hBounds.last - offset) / iPreset) * iPreset - iPreset) + offset,
            last = (Math.floor(Math.max(0, this.state.xAxis.length - 1 - hBounds.first - offset) / iPreset) * iPreset + iPreset) + offset; 

        if (first < 0) first -= Math.floor(first / iPreset) * iPreset;
        if (last > max) last -= Math.ceil((last - max) / (iPreset / 2)) * (iPreset / 2);
        return { first, last };
    }


    /**
     * @param {THBounds} hBounds
     * @returns {TPresets}
     */
    getVisibleLabels(hBounds) {
        const range = this.getVisibleLabelsRange(hBounds);
        return this.createPresets(range);
    }


    /**
     * @param {TLabelsRange} hBounds
     * @returns {TPresets}
     */
    createPresets(range) {
        const presets = {},
            offset = this._getFirstLabelOffset(),
            first = range.first - offset,
            last = range.last - offset;

        for (let i = 1; ; i *= 2) {
            presets[i] = [];
            const start = Math.ceil((Math.max(1, first) - i) / i / 2) * i * 2 + i;
            
            for (let j = start; j <= last; j += i * 2) {
                presets[i].push(j + offset);
            }

            if (i * 2 > last) {
                if (first === 0) {
                    presets['first'] = [0 + offset];
                }
                break;
            }
        }
        return presets;
    }


    /**
     * @param {THBounds} hBounds
     * @returns {number}
     */
    getMinLabelPresetId(hBounds) {
        const margin = this.config.chart.margin,
            step = (this.eCanvas.width - margin.left * DPR - margin.right * DPR) / (hBounds.last - hBounds.first);

        for (var index = 1; index <= 1024; index *= 2) {
            if (step * index > this.maxLabelWidth * 1.75) {
                return index;
            }
        }
        return index;
    }


    /**
     * @param {number} index
     * @param {boolean} [full]
     * @returns {string}
     */
    getLabel(index, full) {
        const date0 = new Date(this.state.xAxis[this.state.xAxis.length - 1 - index]),
            months = full ? this.config.localization.fullMonths : this.config.localization.shortMonths;
        return date0.getUTCDate() + ' ' + months[date0.getUTCMonth()];
    }


    /**
     * @param {TPresets} presets
     * @return {{ preset: number, index: number, value: number }}
     */
    getLastLabel(presets) {
        let max = -1, iPreset, iValue;
        
        for (let p in presets) {
            const index = presets[p].length - 1;
            if (presets[p][index] > max) {
                max = presets[p][index];
                iPreset = p;
                iValue = index;
            }
        }
        return { preset: iPreset, index: iValue, value: presets[iPreset][iValue] };
    }


    /**
     * @returns {number}
     */
    _getFirstLabelOffset() {
        const margin = this.config.chart.margin,
            step = (this.eCanvas.width - margin.left * DPR - margin.right * DPR) / this.config.columns.min;
        return Math.max(1, Math.round(this.maxLabelWidth / 2 / step));
    }


    /** 
     * @returns {number}
     */
    getMaxLabelWidth() {
        const month = this.config.localization.shortMonths.reduce((max, month) => {
            return month.length > max.length ? month : max;
        }, '');
        return this.measure(month + ' 00')
    }


    /**
     * @param {string} text
     * @returns {number}
     */
    measure(text) {
        const ctx = this.eCanvas.getContext('2d');
        ctx.save();
        ctx.font = this.config.font.weight + ' ' + (this.config.font.size * DPR) + 'px ' + this.config.font.family;
        const width = ctx.measureText(text).width;
        ctx.restore();
        return width;
    }
}