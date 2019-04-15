/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../').TChartType} TChartType
 * @typedef {import('../').TColumnData} TColumnData
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 * @typedef {import('../../utils').TColorObj} TColorObj
 * @typedef {{ min: number, max: number }} TVBounds
 */


import { objToColor, colors, dpr } from '../../utils';
import { AbstractMainChart } from '../abstract/main-chart';
import { ScrollBarChart } from './scroll-chart';
const DPR = dpr();


export class BarChart extends AbstractMainChart {
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
        super(el, xAxis, graphs, config, type, zoomed);
    }


/* Draw ***************************************************************************************************************/
    /**
     * @param {TFxItemMap} fxList
     */
    _redraw(fxList) {
        this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
        this._updateState(fxList);
        const data = this._getDrawData();
        this._drawGraphs(this.ctx, fxList, data);
        const ttData = this.tooltip.draw(data);
        if (ttData) this._drawTooltipLine(this.ctx, fxList, data, ttData);
        this.grid.draw(this.ctx, data);
    }


    /**
     * @param {TFxItemMap} fxList
     * @returns {number[][]}
     */
    _getChartData(fxList) {
        return ScrollBarChart.prototype._getChartData.call(this, fxList);
    }


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {TFxItemMap} fxList
     * @param {TDrawData} data
     */
    _drawGraphs(ctx, fxList, { first, last, top, bottom, left, step, leftTail, rightTail }) {
        if (this.config.chart.tails) {
            left -= (first - leftTail) * step;
            first = leftTail;
            last = rightTail;
        }

        const data = this._getChartData(fxList),
            vb = this.state['v-bounds'],
            { min, max } = this._percentToVBounds((vb.fx && vb.event === 'scroll' ? vb.fx.to : vb), this.config.state.local),
            p3 = (max - min) / (bottom - top); // Vertical Points per Pixel

        for (let i = this.state.graphs.length - 1; i >= 0 ; i--) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];

            if (!(graph.visible || fxItem)) continue;

            ctx.beginPath();
            ctx.moveTo(left, bottom);
            let y = bottom - data[i][first] / p3;
            ctx.lineTo(left, y);
            ctx.lineTo(left + step, y);

            for (let j = first + 1; j <= last; j++) {
                y = bottom - data[i][j] / p3;
                ctx.lineTo(left + (j - first) * step, y);
                ctx.lineTo(left + (j + 1 - first) * step, y);
            }

            ctx.lineTo(left + (last + 1 - first) * step, bottom);
            ctx.closePath();
            const color = colors(this.config, graph.color).line;
            ctx.fillStyle = objToColor(color); //, (!fxItem ? 1 : fxItem.fx.value));
            ctx.fill();
        }
    }


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {TFxItemMap} fxList
     * @param {TDrawData} data
     * @param {import('../tooltip').TDrawTooltipLineData} ttData
     */
    _drawTooltipLine(ctx, fxList, { left, first, last, leftTail, rightTail, top, bottom, step }, { index, x, opacity: fade }) {
        if (this.config.chart.tails) {
            left -= (first - leftTail) * step;
            first = leftTail;
            last = rightTail;
        }

        const left2 = left + (index - first) * step,
            left3 = left2 + step,
            left4 = left + (last + 1 - first) * step;

        ctx.fillStyle = objToColor(colors(this.config)[this.state.type].mask, fade);
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left2, top);
        ctx.lineTo(left2, bottom);
        ctx.lineTo(left, bottom);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(left3, top);
        ctx.lineTo(left4, top);
        ctx.lineTo(left4, bottom);
        ctx.lineTo(left3, bottom);
        ctx.closePath();
        ctx.fill();
    }


/* Vertical Bounds ****************************************************************************************************/
    /**
    * @param {string} mask
    * @returns {TVBounds | null} 
    */
    _getVPercentBounds(mask) {
        const bounds = super._getVPercentBounds(mask);
        if (bounds) bounds.min = Math.max(0, bounds.min);
        return bounds;
    }


    /**
     * @returns {number}
     */
    _getMinValue() {
        return 0;
    }


    /**
     * @param {string} mask
     * @returns {number}
     */
    _getMaxValue(mask) {
        const data = this._getDrawData(),
            start = !this.config.chart.tails ? data.first : data.leftTail,
            end = !this.config.chart.tails ? data.last : data.rightTail;
        let max = Number.NEGATIVE_INFINITY;

        for (let i = start; i <= end; i++) {
            const sum = this.state.graphs.reduce((sum, graph, j) => {
                return mask[j] === '0' ? sum : sum + graph.columns[i];
            }, 0);
            if (sum > max) max = sum;
        }

        return max;
    }
}
