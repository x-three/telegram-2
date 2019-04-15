/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../abstract/scroll-chart').TVBounds} TVBounds
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 */


import { objToColor, colors } from '../../utils';
import { AbstractScrollChart } from '../abstract/scroll-chart';


export class ScrollAreaChart extends AbstractScrollChart {
    /**
     * @constructor
     * @param {HTMLElement} el
     * @param {TGraph[]} graphs
     * @param {TConfig} config
     */
    constructor(el, graphs, config) {
        super(el, graphs, config);
    }


/* Redraw *************************************************************************************************************/
    /**
     * @param {TFxItemMap} fxList
     * @returns {number[][]}
     */
    _getChartData(fxList) {
        let count = 0,
            iLast = -1;

        const data = this.state.graphs.reduce((data, graph, i) => {
            const id = 'graph-fade:' + i,
                fx = fxList[id] ? fxList[id].fx : null;

            if (this.state.mask[i] === '0' && !fx) {
                if (i === 0) data[i] = graph.columns.map(() => 0);
                else data[i] = [].concat(data[i - 1]);
            } else if (fx) {
                if (i === 0) data[i] = graph.columns.map((v) => v * fx.value);
                else data[i] = graph.columns.map((v, j) => data[i - 1][j] + v * fx.value);
                count++;
                iLast = i;
            } else {
                if (i === 0) data[i] = [].concat(graph.columns);
                else data[i] = graph.columns.map((v, j) => data[i - 1][j] + v);
                count++;
                iLast = i;
            }
            return data;
        }, []);

        if (iLast !== -1) {
            data[0].forEach((v, j) => {
                const sum = (count === 1 ? this.state.graphs[iLast].columns[j] : data[iLast][j]) / 100;
                for (let i = 0; i < data.length; i++) {
                    data[i][j] /= sum;
                }
            });
        }

        return data;
    }


    /**
     * @param {TFxItemMap} fxList
     */
    _redraw(fxList) {
        this._updateState(fxList);

        const data = this._getChartData(fxList),
            first = this.state['h-bounds'].first,
            last = this.state['h-bounds'].last,
            step = this.eCanvas.width / (last - first), // Columns width
            { min, max } = this._percentToVBounds(null, this.config.state.local),
            p3 = (max - min) / this.eCanvas.height; // Vertical Points per Pixel

        this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
        
        for (let i = this.state.graphs.length - 1; i >= 0; i--) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];
            
            if (!(graph.visible || fxItem)) continue;

            this.ctx.beginPath();
            this.ctx.moveTo(first * step, max / p3);
            this.ctx.lineTo(first * step, (max - data[i][first]) / p3);

            for (let j = first + 1; j <= last; j++) {
                this.ctx.lineTo((j - first) * step, (max - data[i][j]) / p3);
            }

            this.ctx.lineTo((last - first) * step, max / p3);
            this.ctx.closePath();
            const color = colors(this.config, graph.color).line;
            this.ctx.fillStyle = objToColor(color);
            this.ctx.fill();
        }
    }


/* Vertical Bounds ****************************************************************************************************/
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