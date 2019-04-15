/**
 * @typedef {import('../config').TConfig} TConfig
 * @typedef {import('./line').TDrawData} TDrawData
 * @typedef {import('../utils/fx-helper').StateKeeper} StateKeeper
 * @typedef {import('../utils/fx-helper').TFxItemMap} TFxItemMap
 */


import { getColumnFromPosition, objToColor, colors, formatValue, getDay, getFullDate, getTime, dpr, isMobile } from '../utils';
const DPR = dpr();


/**
 * @constructor
 * @param {HTMLCanvasElement} canvas 
 * @param {TConfig} config
 * @param {StateKeeper} state
 * @param {() => void} cb
 */
export function Tooltip(canvas, config, state, cb) {
    this.eCanvas = canvas;
    this.ctx = this.eCanvas.getContext('2d');
    this.eParent = this.eCanvas.parentElement;

    this.config = config;
    this.state = state;
    this.cb = cb;

    this.el = document.createElement('div');
    this.el.className = 'b-tooltip';
    
    if (!this.state.zoomed) {
        if (isMobile()) {
            this.el.addEventListener('touchstart', () => {
                cb && cb(this.iColumn);
            });
        } else {
            this.el.addEventListener('click', () => {
                cb && cb(this.iColumn);
            });
        }
    }

    /** @type {null | number} */
    this.iHover = null;
    this._bind();
}


/**
 * @typedef {{ index: number, x: number, opacity: number }} TDrawTooltipLineData
 * @param {TDrawData} data
 * @returns {TDrawTooltipLineData | null}
 */
Tooltip.prototype.draw = function(data) {
    const oFade = this.state['tooltip:fade'];

    if (!oFade || Object.keys(this.state.get('graph-fade')).length === 0 && this.state.mask.indexOf(1) === -1) {
        return null;
    }

    const oPos = this.state['tooltip:position'];
    if (!isMobile() && oPos.fx) oPos.index = oPos.fx.value; // !!!: Tooltip slide animation (only for desktop)
    
    const opacity = !oFade.fx ? 1 : oFade.fx.value,
        xCur = ~~(data.left + (oPos.index - data.first) * data.step),
        col = oPos.fx ? oPos.fx.to : ~~oPos.index,
        xTo = ~~(data.left + (col - data.first) * data.step);

    this._updateBody(col, ~~(xCur / DPR), ~~(xTo / DPR), opacity, data);
    this.iColumn = oPos.index;
    return { index: oPos.index, x: xCur, opacity };
};


/* Update *************************************************************************************************************/
/**
 * @param {number} index
 * @param {number} xCur
 * @param {number} xTo
 * @param {number} opacity
 * @param {TDrawData} data 
 */
Tooltip.prototype._updateBody = function(col, xCur, xTo, opacity, { step: wBar }) {
    const data = [],
        local = this.config.state.local;

    this.state.graphs.forEach((graph, i) => {
        if (this.state.mask[i] === '1' || this.state['graph-fade:' + i]) {
            data.push({
                index: i,
                name: graph.name,
                color: objToColor(colors(this.config, graph.color).tooltip),
                text: formatValue(graph.columns[col], this.config.localization),
                value: graph.columns[col]
            });
        }
    });

    if (local.stacked && !local.percentage) {
        const sum = data.reduce((sum, el) => sum + el.value, 0);
        data.push({
            name: this.config.localization.words.all,
            color: 'inherit',
            text: formatValue(sum, this.config.localization),
            value: sum
        });
    }

    if (local.percentage) {
        data.forEach((item, i) => {
            item.percentage = Math.round(this.state.data[item.index][col] - (i === 0 ? 0 : Math.round(this.state.data[item.index - 1][col])));
        });
    }

    const time = this.state.xAxis[col],
        heading = this.state.zoomed ? getTime(time) : (getDay(time, this.config.localization) + ', ' + getFullDate(time, this.config.localization));

    this._updateHtml(xCur, xTo, opacity, heading, data, wBar);
};


/**
 * @typedef {Array.<{name: string, color: string, text: string, hint: string}>} TTooltipData
 * @param {number} xCur
 * @param {number} xTo
 * @param {number} opacity
 * @param {string} date
 * @param {TTooltipData} data
 * @param {number} wBar 
 */
Tooltip.prototype._updateHtml = function(xCur, xTo, opacity, heading, data, wBar) {
    if (this.el.parentElement && opacity === 0) {
        this.eParent.removeChild(this.el);
        return;
    }

    let html = `<header>${heading}</header>`;
    html += '<table><tbody>';
    data.forEach((item) => {
        html += `<tr>`;
        if (item.percentage != null) html += `<td class="e-percentage">${item.percentage}%</td>`
        html += `<td class="e-name">${item.name}</td><td class="e-value" style="color: ${item.color};">${item.text}</td></tr>`;
    });
    html += '</tbody></table>';
    
    this.el.style.opacity = opacity;
    this.el.style.left = xCur + (this.state.type !== 'bar' || xTo > this.eCanvas.clientWidth / 2 ? 0 : wBar / (isMobile() ? 2 : 1)) + 'px';
    if (this.el.innerHTML !== html) this.el.innerHTML = html;
    
    if (!this.el.parentElement && opacity > 0) {
        this.eParent.appendChild(this.el);
    }

    if (xTo > this.eCanvas.clientWidth / 2) {
        if (!this.el.classList.contains('m-left')) {
            this.el.classList.remove('m-right');
            this.el.classList.add('m-left');
        }
    } else {
        if (!this.el.classList.contains('m-right')) {
            this.el.classList.remove('m-left');
            this.el.classList.add('m-right');
        }
    }
};  


/* Event Handler ******************************************************************************************************/
Tooltip.prototype._bind = function() {
    const onTouchOutside = (ev) => {
        if (ev.target !== this.eCanvas) {
            if (this.iHover !== null) {
                this._updateTooltipFx(null, this.iHover);
                this.iHover = null;
            }
        }
    };
    
    const onTouchEnd = (ev) => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.addEventListener('touchstart', onTouchOutside);
    };

    const onTouchMove = (ev) => {
        this._onHover(ev.touches[0].pageX, ev.touches[0].pageY);
    };

    const onTouchStart = (ev) => {
        ev.preventDefault();

        if (ev.touches.length !== 1) {
            onTouchEnd(ev);
        } else {
            document.removeEventListener('touchstart', onTouchOutside);
            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
            this._onHover(ev.touches[0].pageX, ev.touches[0].pageY);
        }
    };

    const onMouseMove = (ev) => {
        for (let el = ev.target; el !== null; el = el.parentElement) {
            if (el === this.eCanvas) {
                this._onHover(ev.pageX, ev.pageY);
                return;
            } else if (el === this.eParent) {
                return;
            }
        }
         
        document.removeEventListener('mousemove', onMouseMove);
        this.eParent.addEventListener('mouseenter', onMouseEnter);

        if (this.iHover !== null) {
            this._updateTooltipFx(null, this.iHover);
            this.iHover = null;
        }
    };

    const onMouseEnter = () => {
        this.eParent.removeEventListener('mouseenter', onMouseEnter);
        document.addEventListener('mousemove', onMouseMove);
    };

    if (isMobile()) {
        this.eCanvas.addEventListener('touchstart', onTouchStart);
    } else {
        this.eParent.addEventListener('mouseenter', onMouseEnter);
    }    
};


/**
 * @param {number} pageX
 * @param {number} pageY
 */
Tooltip.prototype._onHover = function(pageX, pageY) {
    const iHover = getColumnFromPosition(this, pageX, pageY);

    if (iHover !== this.iHover) {
        this._updateTooltipFx(iHover, this.iHover);
        this.iHover = iHover;
    }
};


/**
 * @param {number | null} iNew
 * @param {number | null} iOld
 */
Tooltip.prototype._updateTooltipFx = function(iNew, iOld) {
    const idFade = 'tooltip:fade',
        idPos = 'tooltip:position',
        fade = this.state[idFade];

    if (iNew !== null) {
        if (!fade) {
            this.state.addFx(idFade, null, 0, 1, this.config.fx.duration, null, false);
            this.state.add(idPos, { index: iNew });
        } else {
            if (fade.fx && fade.fx.to === 0) {
                this.state.invertFx(idFade, false);
            }
            const from = iOld === null ? this.state[idPos].index : (this.state[idPos].index * 2 / 3 + iOld * 1 / 3);
            this.state.addFx(idPos, { index: iNew }, from, iNew, this.config.fx.duration, this.config.fx.easing);
        }
    }

    else if (fade) {
        if (!fade.fx) {
            this.state.addFx(idFade, null, 1, 0, this.config.fx.duration, null, true);
        } else if (fade.fx.to === 1) {
            this.state.invertFx(idFade, true);
        }
    }
};


/* Misc ***************************************************************************************************************/
/**
 * @returns {number | null}
 */
Tooltip.prototype._getBottom = function() {
    if (!this.el.parentElement) return null;
    const rc = this.eCanvas.getBoundingClientRect();
    const rt = this.el.getBoundingClientRect();  
    const mb = parseInt(getComputedStyle(this.el).marginBottom);
    return rt.top - rc.top + rt.height + mb;
};