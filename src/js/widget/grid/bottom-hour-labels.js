/**
 * @typedef {import('./bottom-day-labels').TPresets} TPresets
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../../utils/fx-helper').StateKeeper} StateKeeper
 * @typedef {import('../scroll').THBounds} THBounds
 * @typedef {THBounds} TLabelsRange
 */


import { getTime, dpr } from '../../utils';
import { BottomDayLabels } from './bottom-day-labels';
const DPR = dpr();


export class BottomHourLabels extends BottomDayLabels {
    /**
     * @constructor
     * @param {HTMLCanvasElement} canvas
     * @param {TConfig} config
     * @param {StateKeeper} state
     */
    constructor(canvas, config, state) {
        super(canvas, config, state)
        this._initDefaultPresets();
    }


    _initDefaultPresets() {
        let defau1t = [
            [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23],
            [2, 4, 8, 10, 14, 16, 20, 22],
            [6, 18],
            [12],
            [0]
        ];

        defau1t = defau1t.map(set => set.map(value => 23 - value).reverse());

        this.defau1t = defau1t.map((set) => {
            const set7 = [];
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < set.length; j++) {
                    set7.push(24 * i + set[j]);
                }
            }
            return set7;
        });
    }


    /**
     * @param {TLabelsRange} hBounds
     * @returns {TPresets}
     */
    createPresets(range) {
        const presets = {},
            k = this.state.zoomed / 24;

        this.defau1t.forEach((set, index) => {
            const preset = [];
            for (let i = 0; i < set.length; i++) {
                const value = k <= 1 ? set[i] : set[i] * k - 1 + k;
                if (value >= range.first && value <= range.last) {
                    preset.push(value);
                }
            }
            presets[2 ** index] = preset;
        });

        return presets;
    }


    /**
     * @param {THBounds} hBounds
     * @returns {number}
     */
    getMinLabelPresetId(hBounds) {
        const margin = this.config.chart.margin,
            step = (this.eCanvas.width - margin.left * DPR - margin.right * DPR) / (hBounds.last - hBounds.first),
            k = this.state.zoomed / 24;

        for (var index = 1; index <= 1024; index *= 2) {
            if (step * index > this.maxLabelWidth * 1.75 / k) {
                return index;
            }
        }
        return index;
    }


    /**
     * @param {number} index
     * @returns {string}
     */
    getLabel(index) {
        const time = this.state.xAxis[this.state.xAxis.length - 1 - index];
        return getTime(time);
    }


    /** 
     * @returns {number}
     */
    getMaxLabelWidth() {
        return this.measure('00:00')
    }
}