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
const DPR = dpr();


export class LineChart extends AbstractMainChart {
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
        this.grid.draw(this.ctx, data);
        this._drawGraphs(this.ctx, fxList, data);
        const ttData = this.tooltip.draw(data);
        if (ttData) this._drawTooltipLine(this.ctx, fxList, data, ttData);
    }


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {TFxItemMap} fxList
     * @param {TDrawData} data
     */
    _drawGraphs(ctx, fxList, { first, last, top, bottom, left, step, leftTail, rightTail }) {
        ctx.lineWidth = this.config.chart.thickness.graph * DPR;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (this.config.chart.tails) {
            left -= (first - leftTail) * step;
            first = leftTail;
            last = rightTail;
        }

        for (let i = 0; i < this.state.graphs.length; i++) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];

            if (!(graph.visible || fxItem)) continue;

            const local = this.config.state.local,
                vb = this.state['v-bounds'],
                { min, max } = this._percentToVBounds((vb.fx && vb.event === 'scroll' ? vb.fx.to : vb), local.scaled ? graph : local),
                p3 = (max - min) / (bottom - top); // Vertical Points per Pixel

            ctx.beginPath();
            // ctx.moveTo(left, top + (max - graph.columns[first]) / p3);
            ctx.moveTo(left, bottom - (graph.columns[first] - min) / p3);

            for (let j = first + 1; j <= last; j++) {
                // ctx.lineTo(left + (j - first) * step, top + (max - graph.columns[j]) / p3);
                ctx.lineTo(left + (j - first) * step, bottom - (graph.columns[j] - min) / p3);
            }

            const color = colors(this.config, graph.color).line;
            ctx.strokeStyle = objToColor(color, !fxItem ? 1 : fxItem.fx.value);
            ctx.stroke();
        }
    }


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {TFxItemMap} fxList
     * @param {TDrawData} data
     * @param {import('../tooltip').TDrawTooltipLineData} ttData
     */
    _drawTooltipLine(ctx, fxList, { top, bottom, po, cGrid }, { index, x, opacity: fade }) {
        ctx.lineWidth = this.config.chart.thickness.grid * DPR;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = objToColor(cGrid, fade);

        ctx.moveTo(x - po, top); // this._getBottom() * DPR);
        ctx.lineTo(x - po, bottom + (this.config.chart.thickness.grid / 2 * DPR) - po);
        ctx.stroke();

        const r = this.config.tooltip.crossingRadius * DPR * fade;
        const hlw = this.config.chart.thickness.graph / 2 * DPR; // Half Line Width
        ctx.lineWidth = hlw * 2;

        for (let i = 0; i < this.state.graphs.length; i++) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];

            if (!(graph.visible || fxItem)) continue;

            const local = this.config.state.local,
                cols = graph.columns,
                value = index % 1 === 0 ? cols[index] : (cols[~~index] + (cols[~~index + 1] - cols[~~index]) * (index % 1)),
                { min, max } = this._percentToVBounds(null, local.scaled ? graph : local),
                p3 = (max - min) / (bottom - top), // Vertical Points per Pixel
                y = bottom - (value - min) / p3,
                opacity = (fxItem ? fxItem.fx.value : 1) * fade,
                color = colors(this.config, graph.color).line;
            
            ctx.strokeStyle = objToColor(color, opacity);

            const rc = Math.max(0, Math.ceil(r - hlw));
            ctx.clearRect(x - rc, y - rc, rc * 2, rc * 2);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }


/* Vertical Bounds ****************************************************************************************************/
    /**
     * @param {number} from Graph Index
     * @param {number} to Graph Index
     * @param {TVBounds} value
     * @returns {TVBounds}
     */
    _translateVBounds(from, to, value) {
        const gFrom = this.state.graphs[from],
            gTo = this.state.graphs[to],
            min = (value.min - gFrom.min) / (gFrom.max - gFrom.min),
            max = (value.max - gFrom.min) / (gFrom.max - gFrom.min);

        return {
            min: (gTo.max - gTo.min) * min + gTo.min,
            max: (gTo.max - gTo.min) * max + gTo.min
        };
    }


    /**
     * @param {string | number} id
     * @returns {number}
     */
    _getMinValue(id) {
        const data = this._getDrawData();

        const min = (index) => {
            const graph = this.state.graphs[index];
            const columns = !this.config.chart.tails ? graph.columns.slice(data.first, data.last + 1) : graph.columns.slice(data.leftTail, data.rightTail + 1);
            return Math.min(...columns);
        };

        if (typeof id === 'number') {
            return min(id);
        } else {
            return this.state.graphs.reduce((result, graph, index) => {
                return id[index] === '0' ? result : Math.min(result, min(index));
            }, Number.POSITIVE_INFINITY);
        }
    }


    /**
     * @param {string | number} id Mask or Index
     * @returns {number}
     */
    _getMaxValue(id) {
        const data = this._getDrawData();

        const max = (index) => {
            const graph = this.state.graphs[index];
            const columns = !this.config.chart.tails ? graph.columns.slice(data.first, data.last + 1) : graph.columns.slice(data.leftTail, data.rightTail + 1);
            return Math.max(...columns);
        };

        if (typeof id === 'number') {
            return max(id);
        } else {
            return this.state.graphs.reduce((result, graph, index) => {
                return id[index] === '0' ? result : Math.max(result, max(index));
            }, Number.NEGATIVE_INFINITY);
        }
    }
}
