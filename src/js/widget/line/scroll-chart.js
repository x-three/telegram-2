/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../abstract/scroll-chart').TVBounds} TVBounds
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 */


import { objToColor, colors, assign, dpr } from '../../utils';
import { AbstractScrollChart } from '../abstract/scroll-chart';
const DPR = dpr();


export class ScrollLineChart extends AbstractScrollChart {
    /**
     * @constructor
     * @param {HTMLElement} el
     * @param {TGraph[]} graphs
     * @param {TConfig} config
     */
    constructor(el, graphs, config) {
        super(el, graphs, config);
    }


    _initialize() {
        const g = this.state.graphs;
        for (let i = 0; i < g.length; i++) {
            assign(g[i], this._getVBounds(i));
            g[i].scale = i === 0 ? 1 : (g[i].max - g[i].min) / (g[0].max - g[0].min);
        }
        super._initialize();
    }


/* Redraw *************************************************************************************************************/
    /**
     * @param {TFxItemMap} fxList
     */
    _redraw(fxList) {
        this._updateState(fxList);
        
        const first = this.state['h-bounds'].first,
            last = this.state['h-bounds'].last,
            top = this.config.scroll.margin * DPR,
            step = this.eCanvas.width / (last - first); // Distance between two columns

        this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
        this.ctx.lineWidth = this.config.scroll.thickness * DPR;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'square';

        for (let i = 0; i < this.state.graphs.length; i++) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];
            
            if (!(graph.visible || fxItem)) continue;

            const local = this.config.state.local,
                { min, max } = this._percentToVBounds(null, local.scaled ? graph : local),
                p3 = (max - min) / (this.eCanvas.height - 2 * top); // Vertical Points per Pixel

            this.ctx.beginPath();
            this.ctx.moveTo(0, top + (max - graph.columns[first]) / p3);

            for (let j = first + 1; j <= last; j++) {
                this.ctx.lineTo((j - first) * step, top + (max - graph.columns[j]) / p3);
            }

            const color = colors(this.config, graph.color).line;
            const opacity = !fxItem ? 1 : (fxItem.fx.value * 2 - 1); // Math.max(0, fxItem.fx.value * 2 - 1)
            this.ctx.strokeStyle = objToColor(color, opacity);
            this.ctx.stroke();
        }
    }


/* Vertical Bounds ****************************************************************************************************/
    /**
     * @param {string | number} id Mask or Index
     * @returns {number}
     */
    _getMinValue(id) {
        if (typeof id === 'number') {
            const columns = this.state.graphs[id].columns.slice(this.state['h-bounds'].first, this.state['h-bounds'].last + 1);
            return Math.min(...columns);
        } else {
            return this.state.graphs.reduce((result, graph, i) => {
                return id[i] === '0' ? result : Math.min(result, graph.min);
            }, Number.POSITIVE_INFINITY);
        }
    }


    /**
     * @param {string | number} id Mask or Index
     * @returns {number}
     */
    _getMaxValue(id) {
        if (typeof id === 'number') {
            const columns = this.state.graphs[id].columns.slice(this.state['h-bounds'].first, this.state['h-bounds'].last + 1);
            return Math.max(...columns);
        } else {
            return this.state.graphs.reduce((result, graph, i) => {
                return id[i] === '0' ? result : Math.max(result, graph.max);
            }, Number.NEGATIVE_INFINITY);
        }
    }
}