/**
 * @typedef {import('../config').TConfig} TConfig
 * @typedef {import('./check-button').TCheckEventData} TCheckEventData
 * @typedef {import('./abstract/main-chart').TZoomEventData} TZoomEventData
 * @typedef {import('./abstract/main-chart').AbstractMainChart} AbstractMainChart
 * @typedef {number[] & { 0: string }} TColumnData
 * @typedef {{ [idGraph: string]: string }} TStringMap
 * @typedef {{ name: string, color: string, columns: number[], visible: boolean }} TGraph
 * @typedef {{ colors: TStringMap, columns: TColumnData[], names: TStringMap, types: TStringMap }} TChartData
 * @typedef {'line' | 'bar' | 'area'} TChartType
 * @typedef {{ xAxis: number[], graphs: TGraph[], minColumns: number, type: TChartType, zoomed: boolean | number }} TChartGroupData
 * @typedef {TChartGroupData & { eWrap: HTMLElement, scroll: Scroll, legend: Legend, main: AbstractMainChart }} TChartGroup
 */


import { cssAnimate, appendChild, prependChild, removeEl, getDay, getFullDate, assign, ajax, find, isMobile } from '../utils';
import { LineChart } from './line/chart';
import { BarChart } from './bar/chart';
import { AreaChart } from './area/chart';
import { PieChart } from './pie/chart';
import { Scroll } from './scroll';
import { Legend } from './legend';


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {TChartData} data
 * @param {TConfig} config 
 */
export function ChartWidget(el, data, config) {
    this.el = el;
    this.el.classList.add('b-chart-widget');
    if (isMobile()) this.el.classList.add('m-mobile');
    this._initConfig(data, config);

    const onReady = () => {
        this.config.state.local.group = this.original = this._initGroup(data);
    };

    if (document.fonts) { // Because we can
        const font = this.config.font;
        document.fonts.load(`${font.weight} ${font.size}px ${font.family}`).then(onReady); 
    } else {              // IE and Edge will have to wait for cache
        onReady();
    }
}


/**
 * @param {boolean} [silent]
 */
ChartWidget.prototype.redraw = function(silent) {
    const group = this.config.state.local.group;
    group.main.update(undefined, silent);
    group.scroll.chart.update(undefined, silent);
    group.legend.update();
};


/**
 * @param {TChartData} data
 * @param {TConfig} config
 */
ChartWidget.prototype._initConfig = function(data, config) {
    this.config = assign({}, config);
    this.config.state = assign({}, config.state, { local: { 
        index:      +this.el.getAttribute('index'),
        scaled:     !!data.y_scaled, 
        stacked:    !!data.stacked,
        percentage: !!data.percentage,
        group:      null
    }});
    this.config.columns = assign({}, config.columns, {
        min: parseInt(this.el.getAttribute('min-columns')) || config.columns.min,
        max: parseInt(this.el.getAttribute('max-columns')) || config.columns.max
    });
};


/**
 * @param {TChartData} data
 * @param {number} [minColumns]
 * @param {boolean | number} [zoomed]
 * @returns {TChartGroup}
 */
ChartWidget.prototype._initGroup = function(data, minColumns, zoomed) {
    const group = this._convertData(data, !!zoomed);
    group.minColumns = minColumns;
    group.zoomed = zoomed != null ? zoomed : false;
    
    group.eWrap = appendChild(this.el, 'div', 'l-wrap');
    group.scroll = this._initScroll(appendChild(group.eWrap, 'div'), group);
    group.legend = this._initLegend(appendChild(group.eWrap, 'div'), group);
    group.main = this._initMainChart(prependChild(group.eWrap, 'div'), group);
    group.main.update(group.scroll.bounds, true);

    const eHeader = prependChild(group.eWrap, 'header', 'd-widget-header');
    group.eRange = appendChild(eHeader, 'span', 'e-date-range');
    this._updateRange(group);

    if (group.zoomed) {
        const eZoomOut = prependChild(eHeader, 'a', 'e-zoom-out');
        eZoomOut.textContent = this.config.localization.words.zoomOut;
        appendChild(eZoomOut, 'i');
        eZoomOut.addEventListener('click', this._onZoomOut.bind(this));
    } else {
        const heading = this.el.getAttribute('heading');
        if (heading) prependChild(eHeader, 'span', 'e-heading').textContent = heading;
    }

    return group;
};


/**
 * @param {TChartData} data
 * @param {boolean} zoomed
 * @returns {TChartGroupData}
 */
ChartWidget.prototype._convertData = function(data, zoomed) {
    const result = { 
        type: this.config.state.local.index === 5 && zoomed ? 'pie' : data.types.y0, 
        xAxis: null, 
        graphs: [] 
    };

    for (let key in data.types) {
        if (data.types[key] === 'x') {
            result.xAxis = find(data.columns, (col) => col[0] === key).slice(1);
        } else {
            result.graphs.push({ 
                name: data.names[key], 
                color: data.colors[key].toLowerCase(),
                columns: find(data.columns, (col) => col[0] === key).slice(1),
                visible: true
            });
        }
    }
    return result;
};


/**
 * @param {HTMLElement} el
 * @param {TChartGroupData} group
 * @returns {Scroll}
 */
ChartWidget.prototype._initScroll = function(el, group) {
    const scroll = new Scroll(el, group.graphs, this.config, group.type, group.minColumns);
    scroll.el.addEventListener('new-bounds', (ev) => {
        const group = this.config.state.local.group;
        group.main.update(ev.detail);
        this._updateRange(group);
    });
    return scroll;
};


/**
 * @param {TChartGroup} group
 */
ChartWidget.prototype._updateRange = function(group) {
    const bounds = group.scroll.bounds,
        tStart = group.xAxis[bounds.first],
        tEnd = group.xAxis[bounds.last - +(this.original !== group && group.type !== 'bar')],
        l10n = this.config.localization,
        start = getFullDate(tStart, l10n, true),
        end = getFullDate(tEnd, l10n, true);

    group.eRange.textContent = start === end ? `${getDay(tStart, l10n, true)}, ${start}` : `${start} - ${end}`;
};


/**
 * @param {HTMLElement} el
 * @param {TChartGroupData} group
 * @returns {Legend}
 */
ChartWidget.prototype._initLegend = function(el, group) {
    return new Legend(el, group.graphs, this.config, this._onButtonCheck.bind(this));
};


/**
 * @param {number} index
 * @param {TCheckEventData} data
 */
ChartWidget.prototype._onButtonCheck = function(index, data) {
    const group = this.config.state.local.group;

    if (data.type === 'check') {
        group.graphs[index].visible = data.state;
    } else if (data.type === 'uncheck-others') {
        group.graphs.forEach((g, i) => { g.visible = i === index });
    }

    group.scroll.chart.update();
    group.main.update();
};


/**
 * @param {HTMLElement} el
 * @param {TChartGroupData} group
 * @returns {AbstractMainChart}
 */
ChartWidget.prototype._initMainChart = function(el, group) {
    let Constructor;
    switch (group.type) {
        case 'line': Constructor = LineChart; break;
        case 'bar':  Constructor = BarChart;  break;
        case 'area': Constructor = AreaChart; break;
        case 'pie':  Constructor = PieChart;  break;
    }
    const main = new Constructor(el, group.xAxis, group.graphs, this.config, group.type, group.zoomed);
    main.el.addEventListener('zoom', (ev) => {
        if (this.original.main === main) this._onZoomIn(ev.detail.column);
        else this._onZoomOut(ev.detail.column);
    });
    return main;
};


/**
 * @param {number} column
 */
ChartWidget.prototype._onZoomIn = function(column) {
    let init = this._initZoomedGroup;
    if (this.config.state.local.index === 4) init = this._initZoomedGroup4;
    else if (this.config.state.local.index === 5) init = this._initZoomedGroup5;

    init.bind(this)(column, () => {
        this._updateLegendOnZoom(this.original, this.zoomed);
        this.redraw(true);

        cssAnimate(this.el, 'm-zoom-in', this.config.timeout.zoom, () => {
            removeEl(this.original.eWrap);
        }, true);
    });
};


ChartWidget.prototype._onZoomOut = function() {
    this.config.state.local.group = this.original;
    this.el.appendChild(this.original.eWrap);
    removeEl(this.original.main.tooltip.el);
    if (this.config.state.local.index !== 4) this._updateLegendOnZoom(this.zoomed, this.original);
    this.redraw(true);

    if (this.config.state.local.index === 5) {
        this.original.scroll.update(this.zoomed.scroll.getBounds(), true);
        this.original.scroll.pos = this.zoomed.scroll.pos;
        this.original.scroll.width = this.zoomed.scroll.width;
        this.original.scroll._updateSelector();
        this.original.main.update(this.zoomed.scroll.getBounds(), true);
    }

    cssAnimate(this.el, 'm-zoom-out', this.config.timeout.zoom, () => {
        removeEl(this.zoomed.eWrap);
        delete this.zoomed;
    }, true);
};


/**
 * @param {TChartGroup} from
 * @param {TChartGroup} to
 */
ChartWidget.prototype._updateLegendOnZoom = function(from, to) {
    to.legend.el.classList.add('m-silent');
    from.legend.list.forEach((button, i) => {
        to.legend.list[i].toggleState(button.state, true);
        to.graphs[i].visible = button.state;
    });
    setTimeout(() => {
        to.legend.el.classList.remove('m-silent');
    }, 0);
};


/**
 * @param {number} column
 * @param {() => void} cb
 */
ChartWidget.prototype._initZoomedGroup = function(column, cb) {
    const xAxis = this.original.xAxis,
        first = column + 3 < xAxis.length ? Math.max(0, column - 3) : xAxis.length - 7,
        last = first + 6;
        
    const onReady = (results) => {
        const data = results[0],
            minColumns = (results[1] || results[0]).columns[0].length - 1;
        
        for (let i = 1; i <= 6; i++) {
            for (let j = 0; j < data.columns.length; j++) {
                data.columns[j] = data.columns[j].concat(results[i].columns[j].slice(1));
            }
        }
        init(data, first, minColumns);
    };

    const init = (data, first, minColumns) => {
        const isBar = data.types.y0 === 'bar';
        this.config.state.local.group = this.zoomed = this._initGroup(data, minColumns - +isBar, minColumns);
        this.zoomed.scroll.update({
            first: minColumns * (column - first) + 1 - +isBar,
            last: minColumns * (column - first + 1) - +isBar
        });
        cb && cb();
    };

    const results = [];
    let completed = 0;

    for (let i = first; i <= last; i++) {
        ((index) => {
            ajax(this._columnToUrl(index), (data) => {
                results[index - first] = data;
                if (++completed === last - first + 1) onReady(results);
            });
        })(i);
    }
};


/**
 * @param {number} column
 * @param {() => void} cb
 */
ChartWidget.prototype._initZoomedGroup4 = function(column, cb) {
    const cols = [column];
    if (column - 1 >= 0) cols.push(column - 1);
    if (column - 7 >= 0) cols.push(column - 7);

    const onReady = (results) => {
        const data = results[0],
            iLast = this.original.xAxis.length - 1,
            hLabels = this.original.main.grid.hLabels;

        data.names.y0 = hLabels.getLabel(iLast - cols[0], true);

        if (results.length >= 2) {
            data.colors.y1 = '#558ded';
            data.columns[2] = results[1].columns[1];
            data.columns[2][0] = 'y1';
            data.names.y1 = hLabels.getLabel(iLast - cols[1], true);
            data.types.y1 = results[1].types.y0;
        }

        if (results.length >= 3) {
            data.colors.y2 = '#5cbcdf';
            data.columns[3] = results[2].columns[1];
            data.columns[3][0] = 'y2';
            data.names.y2 = hLabels.getLabel(iLast - cols[2], true);
            data.types.y2 = results[2].types.y0;
        }
        
        init(data, 0, data.columns[0].length - 1);
    };

    const init = (data, first, last) => {
        this.config.state.local.group = this.zoomed = this._initGroup(data, last - first, last - first);
        removeEl(this.zoomed.scroll.el);
        cb && cb();
    };

    const results = [];
    let completed = 0;

    for (let i = 0; i < cols.length; i++) {
        ((i) => {
            ajax(this._columnToUrl(cols[i]), (data) => {
                results[i] = data;
                if (++completed === cols.length) onReady(results);
            });
        })(i);
    }
};


/**
 * @param {number} column
 * @param {() => void} cb
 */
ChartWidget.prototype._initZoomedGroup5 = function(column, cb) {
    ajax('data/5/overview.json', (data) => {
        this.config.state.local.group = this.zoomed = this._initGroup(data, null, true);
        this.zoomed.scroll.update(this.original.scroll.getBounds(), true);
        this.zoomed.scroll.pos = this.original.scroll.pos;
        this.zoomed.scroll.width = this.original.scroll.width;
        this.zoomed.scroll._updateSelector();
        cb && cb();
    });
};


/**
 * @param {number} index
 */
ChartWidget.prototype._columnToUrl = function(index) {
    const date = new Date(this.original.xAxis[index]);
    let month = date.getUTCMonth();
    month = (month < 9 ? '0' : '') + (month + 1);
    let day = date.getUTCDate();
    day = (day < 10 ? '0' : '') + day;
    return `data/${this.config.state.local.index}/${date.getUTCFullYear()}-${month}/${day}.json`;
};