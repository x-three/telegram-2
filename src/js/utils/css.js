/**
 * @param {HTMLElement} el 
 * @param {string} c1ass 
 * @param {number} duration
 * @param {() => void} [cb]
 * @param {boolean} [clear]
 */
export function cssAnimate(el, c1ass, duration, cb, clear) {
    const from = `fx-${c1ass}-from`,
        active = `fx-${c1ass}-active`;
    el.classList.add(from);
    
    window.requestAnimationFrame(() => {
        el.classList.add(active);
        el.classList.add(c1ass);
        el.classList.remove(from);
        
        setTimeout(() => {
            el.classList.remove(active);
            if (clear) el.classList.remove(c1ass);
            cb && cb();
        }, duration);
    });
}