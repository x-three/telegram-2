/**
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 * @typedef {import('../line/chart').TVBounds} TVBounds
 */


export class AbstractAnyChart {
    /**
     * @returns {string}
     */
    _getVisibleGraphsMask() {
        return this.state.graphs.reduce((mask, graph) => {
            return mask + +graph.visible;
        }, '');
    }


    /**
     * @param {TFxItemMap} fxList
     */
    _updateState(fxList) {
        for (let n in fxList) {
            const fx = fxList[n].fx;
            if (n === 'v-bounds') {
                fxList[n].min = fx.from.min + (fx.to.min - fx.from.min) * fx.pos;
                fxList[n].max = fx.from.max + (fx.to.max - fx.from.max) * fx.pos;
            }
        }
    }


    /**
     * @param {TVBounds} [percent]
     * @param {TVBounds} [from]
     * @returns {TVBounds}
     */
    _percentToVBounds(percent, from) {
        if (!percent) percent = this.state['v-bounds'];
        if (!from) from = this.state.graphs[this.state.mask.indexOf('1')];

        return {
            min: (from.max - from.min) * percent.min + from.min,
            max: (from.max - from.min) * percent.max + from.min,
        };
    }
}