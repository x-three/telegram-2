/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../abstract/scroll-chart').TVBounds} TVBounds
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 */


import { objToColor, colors } from '../../utils';
import { AbstractScrollChart } from '../abstract/scroll-chart';


export class ScrollBarChart extends AbstractScrollChart {
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
        return this.state.graphs.reduce((data, graph, i) => {
            const id = 'graph-fade:' + i,
                fx = fxList[id] ? fxList[id].fx : null;

            if (this.state.mask[i] === '0' && !fx) {
                if (i === 0) data[i] = graph.columns.map(() => 0);
                else data[i] = data[i - 1];
            } else if (fx) {
                if (i === 0) data[i] = graph.columns.map((v) => v * fx.value);
                else data[i] = graph.columns.map((v, j) => data[i - 1][j] + v * fx.value);
            } else {
                if (i === 0) data[i] = [].concat(graph.columns);
                else data[i] = graph.columns.map((v, j) => data[i - 1][j] + v);
            }
            return data;
        }, []);
    }


    /**
     * @param {TFxItemMap} fxList
     */
    _redraw(fxList) {
        this._updateState(fxList);

        const data = this._getChartData(fxList),
            first = this.state['h-bounds'].first,
            last = this.state['h-bounds'].last,
            wCol = this.eCanvas.width / (last - first + 1), // Columns width
            { min, max } = this._percentToVBounds(null, this.config.state.local),
            p3 = (max - min) / this.eCanvas.height; // Vertical Points per Pixel

        this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
        
        for (let i = this.state.graphs.length - 1; i >= 0; i--) {
            const fxItem = fxList['graph-fade:' + i],
                graph = this.state.graphs[i];
            
            if (!(graph.visible || fxItem)) continue;

            this.ctx.beginPath();
            this.ctx.moveTo(first * wCol, max / p3);
            let y = (max - data[i][first]) / p3;
            this.ctx.lineTo(first * wCol, y);
            this.ctx.lineTo((first + 1) * wCol, y);

            for (let j = first + 1; j <= last; j++) {
                y = (max - data[i][j]) / p3;
                this.ctx.lineTo((j - first) * wCol, y);
                this.ctx.lineTo((j + 1 - first) * wCol, y);
            }

            this.ctx.lineTo((last + 1 - first) * wCol, max / p3);
            this.ctx.closePath();
            const color = colors(this.config, graph.color).line;
            this.ctx.fillStyle = objToColor(color); // , (!fxItem ? 1 : fxItem.fx.value));
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
     * @param {string} mask
     * @returns {number}
     */
    _getMaxValue(mask) {
        return this.state.graphs[0].columns.reduce((max, graph, i) => {
            const sum = this.state.graphs.reduce((sum, graph, j) => {
                return mask[j] === '0' ? sum : sum + graph.columns[i];
            }, 0);
            return sum > max ? sum : max;
        }, Number.NEGATIVE_INFINITY);
    }
}