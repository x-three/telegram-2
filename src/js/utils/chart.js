import { getOffset } from './dom';
import { isMobile } from './misc';


/* Columns ************************************************************************************************************/
/**
 * @param {any} obj Chart like object
 * @param {number} x
 * @returns {number}
 */
export function getColumn(obj, x) {
    const margin = obj.config.chart.margin;

    const isBar = obj.state.type === 'bar',
        hBounds = obj.state['h-bounds'],
        step = (obj.eCanvas.clientWidth - margin.left - margin.right) / (hBounds.last - hBounds.first + +isBar);

    const index = hBounds.first + Math.floor(((isBar ? 0 : step / 2) + x - margin.left) / step);
    return Math.max(hBounds.first, Math.min(hBounds.last, index));
}


/**
 * @param {any} obj Chart like object
 * @param {number} pageX
 * @param {number} pageY
 * @returns {number | null}
 */
export function getColumnFromPosition(obj, pageX, pageY) {
    const offset = getOffset(obj.eCanvas),
        x = pageX - offset.left,
        y = pageY - offset.top,
        margin = obj.config.chart.margin,
        inside = y >= margin.top && y < (obj.eCanvas.clientHeight - margin.bottom);
    
    return !inside ? null : getColumn(obj, x);
}


/* Draggable **********************************************************************************************************/
/**
 * @typedef {{ x: string, y: string, sx: string, sy: string, ox: string, oy: string }} TDragData
 * @param {HTMLElement} el 
 * @param {(ev: string, data: TDragData) => void} cb 
 */
export function draggable(el, cb) {
    let startX, startY, offsetX, offsetY;

    const getData = (ev) => {
        return { x: ev.pageX, y: ev.pageY, sx: startX, sy: startY, ox: offsetX, oy: offsetY };
    };

    const updateData = (touch) => {
        const rect = el.getBoundingClientRect();
        startX = touch.pageX;
        startY = touch.pageY;
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
    };

    const onTouchEnd = (ev) => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onTouchEnd);
        cb('end', getData(ev.changedTouches[0]));
    };

    const onTouchStart = (ev) => {
        if (ev.target !== ev.currentTarget) return;
        ev.preventDefault();

        if (ev.touches.length !== 1) {
            onTouchEnd(ev);
            return;
        }

        updateData(ev.touches[0]);
        cb('start', getData(ev.touches[0]));
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onTouchEnd);
    };

    const onMouseUp = (ev) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onMouseUp);
        cb('end', getData(ev));
    };

    const onMove = (ev) => {
        cb('move', getData(ev.touches ? ev.touches[0] : ev));
    };

    const onMouseDown = (ev) => {
        if (ev.which !== 1 || ev.target !== ev.currentTarget) return;
        ev.preventDefault();
        
        updateData(ev);
        cb('start', getData(ev));
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    if (isMobile()) {
        el.addEventListener('touchstart', onTouchStart);
    } else {
        el.addEventListener('mousedown', onMouseDown);
    }
}


/* Zoomable ***********************************************************************************************************/
/**
 * @param {any} obj Chart like object
 * @param {(column: number) => void} cb
 */
export function Zoomable(obj, cb) {
    let tLast = 0,
        lastCol = null;

    const onClick = (pos) => {
        const kInaccuracy = !obj.state.zoomed ? 1 : obj.state.zoomed / 24,
            tNow = Date.now(),
            col = getColumnFromPosition(obj, pos.pageX, pos.pageY);

        if (tNow < tLast) return;

        if (tNow - tLast < obj.config.timeout.dblClick && col != null && Math.abs(col - lastCol) <= kInaccuracy) {
            cb(col);
            tLast = tNow + obj.config.timeout.zoomLock;
            lastCol = null;
        } else {
            tLast = tNow;
            lastCol = col;
        }
    };

    if (isMobile()) {
        obj.eCanvas.addEventListener('touchstart', (ev) => { onClick(ev.touches[0]) });
    } else {
        obj.eCanvas.addEventListener('click', onClick);
    }
}
