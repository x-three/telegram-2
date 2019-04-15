/**
 * @typedef {import('../../config').TConfig} TConfig
 * @typedef {import('../').TGraph} TGraph
 * @typedef {import('../').TChartType} TChartType
 * @typedef {import('../').TColumnData} TColumnData
 * @typedef {import('../../utils/fx-helper').TFxItemMap} TFxItemMap
 * @typedef {import('../../utils').TColorObj} TColorObj
 */


import { appendChild, removeEl, getOffset, Zoomable, objToColor, formatValue, colors, dpr, isMobile } from '../../utils';
import { StateKeeper } from '../../utils/fx-helper';
const DPR = dpr();


export class PieChart {
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
        this.el = el;
        this.el.className = 'b-main-chart m-' + type;
        if (zoomed) this.el.className += ' m-zoomed';
        /** @type {HTMLCanvasElement} */
        this.eCanvas = appendChild(this.el, 'canvas');
        this.ctx = this.eCanvas.getContext('2d');

        this.eTooltip = document.createElement('div');
        this.eTooltip.className = 'b-tooltip';

        this.config = config;
        this._initHMargin();

        this.state = new StateKeeper(this._redraw.bind(this));
        this.state.add('graphs', graphs);
        this.state.add('type', type);
        this.state.add('zoomed', zoomed);
        this.state.add('mask', graphs.map(() => '1').join('')); // Visible Graphs
        this.state.add('h-bounds', {});
        this.state.add('iHover', -1);

        this._bindHover();

        window.addEventListener('resize', () => {
            const group = this.config.state.local.group;
            if (group && group.main !== this) return;
            this.onResize();
        });
        this.onResize();

        Zoomable(this, (column) => {
            this.el.dispatchEvent(new CustomEvent('zoom', {
                bubbles: true,
                detail: { column }
            }));
        });
    }


    _initHMargin() {
        const style = getComputedStyle(this.el);

        if (this.config.chart.margin.left == null) {
            this.config.chart.margin.left = -parseFloat(style.marginLeft);
        }
        if (this.config.chart.margin.right == null) {
            this.config.chart.margin.right = -parseFloat(style.marginRight);
        }
    }


    _bindHover() {
        const onHover = (ev) => {
            const offset = getOffset(this.eCanvas);
            this._updateHoverFx(this._isInsideCircle((ev.pageX - offset.left) * DPR, (ev.pageY - offset.top) * DPR));
        };

        const onTouchOutside = () => {
            this._updateHoverFx(-1);
        };

        if (isMobile()) {
            this.eCanvas.addEventListener('touchstart', (ev) => { 
                ev.preventDefault();
                document.removeEventListener('touchstart', onTouchOutside);
                onHover(ev.touches[0]);
            });

            this.eCanvas.addEventListener('touchmove', (ev) => { 
                onHover(ev.touches[0]);
            });

            this.eCanvas.addEventListener('touchend', () => { 
                document.addEventListener('touchstart', onTouchOutside);
             });
        } 
        
        else {
            this.eCanvas.addEventListener('mousemove', onHover);
        }
    }


    onResize() {
        this.eCanvas.width = this.eCanvas.clientWidth * DPR;
        this.eCanvas.height = this.eCanvas.clientHeight * DPR;
        this.state.addFx('redraw');
    }


/* Update *************************************************************************************************************/
    /**
     * @param {TVBounds} [hBounds]
     * @param {boolean} [instant]
     */
    update(hBounds, instant) {
        if (hBounds) {
            this.state['h-bounds'].first = hBounds.first;
            this.state['h-bounds'].last = hBounds.last;
        }

        if (instant) this.state.clearFx();
        const mask = this._getVisibleGraphsMask();

        if (this.state.mask !== mask) {
            !instant && this._updateGraphVisibilityFx(mask);
            this.state.mask = mask;
        }

        this.state.addFx('redraw');
    }


    /**
     * @param {string} mask
     */
    _updateGraphVisibilityFx(mask) {
        for (let i = 0; i < mask.length; i++) {
            if (mask[i] !== this.state.mask[i]) {
                const id = 'graph-fade:' + i;

                if (!this.state[id]) {
                    if (mask[i] === '1') {
                        this.state.addFx(id, { index: i }, 0, 1, this.config.fx.duration, this.config.fx.easing, true);
                    } else {
                        this.state.addFx(id, { index: i }, 1, 0, this.config.fx.duration, this.config.fx.easing, true);
                    }
                } else {
                    this.state.invertFx(id);
                }
            }
        }
    }


    /**
     * @param {number} index 
     */
    _updateHoverFx(index) {
        if (this.state.iHover === index) return;
        this.state.iHoverPrev = this.state.iHover;
        this.state.iHover = index;

        if (index !== -1) { // New
            const id = 'hover:' + index,
                item = this.state[id];

            if (!item) { // Add
                const prev = this.state['hover:' + this.state.iHoverPrev],
                    from = !prev ? 0 : (!prev.fx ? 1 : prev.fx.value),
                    duration = this.config.fx.duration * (1 - from);
                this.state.addFx(id, { index }, from, 1, duration, this.config.fx.easing, false);
            } 
            
            else if (item.fx && item.fx.to === 0) { // Update
                this.state.invertFx(id, false);
            }
        }

        for (let i = 0; i < this.state.graphs.length; i++) { // Previous
            if (i === index) continue;
            
            const id = 'hover:' + i,
                item = this.state[id];  

            if (item) {
                if (!item.fx) {
                    this.state.addFx(id, null, 1, 0, this.config.fx.duration, this.config.fx.easing, true);
                } else if (item.fx.to === 1) {
                    this.state.invertFx(id, true);
                }
            }
        }
    }


/* Draw ***************************************************************************************************************/
    /**
     * @param {TFxItemMap} fxList
     */
    _redraw(fxList) {
        this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
        const data = this._getDrawData();
        this._drawGraphs(this.ctx, fxList, data);
        this._drawTooltip();
    }


    /**
     * @typedef {{ margin: number, left: number, top: number, x0: number, y0: number, r: number, offset: number, rad: number }} TDrawData
     * @returns {TDrawData}
     */
    _getDrawData() {
        const margin = this.config.chart.margin,
            left = margin.left * DPR,
            top = margin.top + DPR,
            x0 = left + (this.eCanvas.width - left - margin.right * DPR) / 2,
            y0 = top + (this.eCanvas.height - top - margin.bottom * DPR) / 2 + 15 * DPR,
            r = 195 * DPR,
            offset = 70,
            rad = 360 / 2 / Math.PI;

        return { margin, left, top, x0, y0, r, offset, rad };
    }


    /**
     * @typedef {{ values: number[], percentage: number[], sum: number[], text: string[] }} TChartData
     * @param {TFxItemMap} fxList
     * @returns {TChartData}
     */
    _getChartData(fxList) {
        let visible = 0,
            onlySum = 0;

        const values = this.state.graphs.map((graph, i) => {
            const id = 'graph-fade:' + i,
                fx = fxList[id] ? fxList[id].fx : null;

            if (this.state.mask[i] === '0' && !fx) {
                return 0;
            } 
            
            else {
                const bounds = this.state['h-bounds'];
                let sum = 0;
                for (let i = bounds.first; i <= bounds.last; i++) {
                    sum += graph.columns[i];
                }
                sum /= (bounds.last - bounds.first + 1);

                visible++;
                onlySum = sum;

                return Math.round(fx ? sum * fx.value : sum);
            }
        });

        const tempSum = visible === 1 ? onlySum : values.reduce((s, v) => s + v, 0),
            percentage = values.map((v) => v / tempSum),
            sum = [percentage[0]];

        for (let i = 1; i < percentage.length - 1; i++) {
            sum[i] = sum[i - 1] + percentage[i];
        }
        sum[sum.length] = 1;

        const text = sum.map((v, i) => Math.round(v * 100 - (i === 0 ? 0 : Math.round(sum[i - 1] * 100))));
        return { values, percentage, sum, text: text.map((v) => v + '%') };
    }


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {TFxItemMap} fxList
     * @param {TDrawData} data
     */
    _drawGraphs(ctx, fxList, { x0, y0, r, offset, rad }) {
        this.data = this._getChartData(fxList);
        ctx.lineWidth = 1;

        for (let i = 0; i < this.state.graphs.length; i++) {
            if (this.data.values[i] === 0) continue;
            const fxHover = this.state['hover:' + i];

            const start = offset + (i === 0 ? 0 : this.data.sum[i - 1]) * 360,
                end = offset + this.data.sum[i] * 360,
                middle = start + (end - start) / 2,
                k = !fxHover ? 0 : (!fxHover.fx ? 1 : fxHover.fx.value),
                pos = this._vectorToPos(x0, y0, middle, this.config.pie.hover * DPR * k);

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.arc(pos.x, pos.y, r, start / rad, end / rad);
            ctx.lineTo(pos.x, pos.y);
            const color = colors(this.config, this.state.graphs[i].color).line;
            ctx.strokeStyle = ctx.fillStyle = objToColor(color);
            ctx.fill();
            ctx.stroke();

            this._drawText(ctx, pos.x, pos.y, middle, r, i);
        }
    }


    _drawText(ctx, x0, y0, angle, r, index) {
        const pie = this.config.pie.text;
        if (this.data.percentage[index] * 100 < pie.minVisible) return;

        const text = this.data.text[index],
            size = this._getTextSize(index);
        
        ctx.font = `${pie.weight} ${(size * DPR)}px ${this.config.font.family}`;
        const width = ctx.measureText(text).width,
            k = Math.max(0, Math.min(1, (this.data.percentage[index] * 100 - pie.offset.min) / (pie.offset.max - pie.offset.min))) * (pie.offset.multiplier - 1) + 1,
            pos = this._vectorToPos(x0, y0, angle, r - pie.offset.value * k * DPR - width / 2);

        ctx.fillStyle = objToColor(this.config.colors.pieText);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pos.x, pos.y);
    }


    _drawTooltip() {
        const item = this.state['hover:' + this.state.iHover] || this.state['hover:' + this.state.iHoverPrev] || null;
        if (this.eTooltip.parentElement && !item) removeEl(this.eTooltip);
        if (!item) return;

        const graph = this.state.graphs[item.index],
            rect = this._getSectorRect(item.index);
        this.eTooltip.style.opacity = !item.fx ? 1 : Math.round(item.fx.value * 100) / 100;
        this.eTooltip.style.left = (rect.left + (rect.right - rect.left) / 2) / DPR + 'px';
        this.eTooltip.style.top = rect.top / DPR + 'px';

        const html = 
            `<table><tbody><tr>
                <td class="e-name">${graph.name}</td>
                <td class="e-value" style="color: ${graph.color};">${formatValue(this.data.values[item.index], this.config.localization)}</td>
            </tr></tbody></table>`;
        if (this.eTooltip.innerHTML !== html) this.eTooltip.innerHTML = html;

        
        if (!this.eTooltip.parentElement) {
            this.el.appendChild(this.eTooltip);
        }
    }


/* Misc ***************************************************************************************************************/
    /**
     * @returns {string}
     */
    _getVisibleGraphsMask() {
        return this.state.graphs.reduce((mask, graph) => {
            return mask + +graph.visible;
        }, '');
    }


    /**
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    _isInsideCircle(x, y) {
        const { x0, y0, r, offset } = this._getDrawData(),
            { angle, value } = this._posToVector(x0, y0, x, y);

        if (value > r) return -1;
        
        for (let i = 0; i < this.data.sum.length; i++) {
            const start = offset + (i === 0 ? 0 : this.data.sum[i - 1] * 360),
                end = offset + this.data.sum[i] * 360;

            if (angle >= start && angle <= end || angle + 360 >= start && angle + 360 <= end) {
                return i;
            }
        }
        return -1;
    }


    /**
     * @param {number} x0 
     * @param {number} y0
     * @param {number} x
     * @param {number} y
     * @returns {{ angle: number, value: number }}
     */
    _posToVector(x0, y0, x, y) {
        const dx = x - x0,
            dy = y0 - y,
            dxy = (dx ** 2 + dy ** 2) ** 0.5

        let a = Math.acos(dx / dxy) * 180 / Math.PI;
        if (dy > 0) a = 360 - a;
        return { angle: a, value: dxy };
    }


    /**
     * @param {number} x0
     * @param {number} y0
     * @param {number} angle
     * @param {number} value
     * @returns {{ x: number, y: number }}
     */
    _vectorToPos(x0, y0, angle, value) {
        const rad = 180 / Math.PI,
            dx = Math.cos(angle / rad) * value,
            dy = Math.sin(angle / rad) * value;

        return { 
            x: x0 + dx, 
            y: y0 + dy
        };
    }


    /**
     * @param {number} index 
     * @returns {number}
     */
    _getTextSize(index) {
        const pie = this.config.pie.text,
            value = this.data.percentage[index] * 100,
            k = Math.max(0, Math.min(1, (value - pie.value.min) / (pie.value.max - pie.value.min)));
        return pie.size.min + (pie.size.max - pie.size.min) * k;
    }


    /**
     * @param {number} index 
     * @returns {any}
     */
    _getSectorRect(index) {
        const { x0, y0, r, offset } = this._getDrawData(),
            start = offset + (index === 0 ? 0 : this.data.sum[index - 1]) * 360,
            end = offset + this.data.sum[index] * 360;

        let p0;
        if (index === this.state.iHover || index === this.state.iHoverPrev) {
            const middle = start + (end - start) / 2;
            p0 = this._vectorToPos(x0, y0, middle, this.config.pie.hover * DPR);
        } else {
            p0 = { x: x0, y: y0 };
        }

        const p1 = this._vectorToPos(p0.x, p0.y, start, r),
            p2 = this._vectorToPos(p0.x, p0.y, end, r);

        let top = Math.min(p0.y, p1.y, p2.y),
            bottom = Math.max(p0.y, p1.y, p2.y),
            left = Math.min(p0.x, p1.x, p2.x),
            right = Math.max(p0.x, p1.x, p2.x);

        if (start < 90 && end > 90) bottom = p0.y + r;
        if (start < 180 && end > 180) left = p0.x - r;
        if (start < 270 && end > 270) top = p0.y - r;
        if (start < 360 && end > 360) right = p0.x + r;

        return { top, bottom, left, right };
    }
}