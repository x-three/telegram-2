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
import { ScrollAreaChart } from './scroll-chart';
const DPR = dpr();


export class AreaChart extends AbstractMainChart {
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
        this.grid.draw(this.ctx, data);
        const ttData = this.tooltip.draw(data);
        if (ttData) this._drawTooltipLine(this.ctx, fxList, data, ttData);
    }


    /**
     * @param {TFxItemMap} fxList
     * @returns {number[][]}
     */
    _getChartData(fxList) {
        return ScrollAreaChart.prototype._getChartData.call(this, fxList);
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

        this.state.add('data', data);

        for (let i = this.state.graphs.length - 1; i >= 0 ; i--) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];

            if (!(graph.visible || fxItem)) continue;

            ctx.beginPath();
            ctx.moveTo(left, bottom);
            ctx.lineTo(left, bottom - data[i][first] / p3);

            for (let j = first + 1; j <= last; j++) {
                ctx.lineTo(left + (j - first) * step, bottom - data[i][j] / p3);
            }

            ctx.lineTo(left + (last - first) * step, bottom);
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
    _drawTooltipLine(ctx, fxList, { top, bottom, po, cGrid }, { index, x, opacity: fade }) {
        const { min, max } = this._percentToVBounds(null, this.config.state.local),
            p3 = (max - min) / (bottom - top); // Vertical Points per Pixel

        ctx.lineWidth = this.config.chart.thickness.grid * DPR;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = objToColor(cGrid, fade);

        ctx.moveTo(x - po, bottom - 100 / p3); // this._getBottom() * DPR);
        ctx.lineTo(x - po, bottom + (this.config.chart.thickness.grid / 2 * DPR) - po);
        ctx.stroke();
    }


/* Vertical Bounds ****************************************************************************************************/
    /**
    * @param {string} mask
    * @returns {TVBounds | null} 
    */
    _getVPercentBounds(mask) {
        const bounds = super._getVPercentBounds(mask);
        if (bounds) bounds.min = 0;
        return bounds;
    }


    /**
     * @returns {number}
     */
    _getMinValue() {
        return 0;
    }


    /**
     * @returns {number}
     */
    _getMaxValue() {
        return 100;
    }
}
