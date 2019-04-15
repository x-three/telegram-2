/**
 * @param {HTMLElement} eParent 
 * @param {string} tag 
 * @param {string} [className] 
 * @returns {HTMLElement} Child element
 */
export function appendChild(eParent, tag, className) {
    const el = document.createElement(tag);
    if (className != null) el.className = className;
    return eParent.appendChild(el);
}


/**
 * @param {HTMLElement} eParent 
 * @param {string} tag 
 * @param {string} [className] 
 * @returns {HTMLElement} Child element
 */
export function prependChild(eParent, tag, className) {
    if (eParent.firstChild == null) return appendChild(eParent, tag, className);
    const el = document.createElement(tag);
    if (className != null) el.className = className;
    return eParent.insertBefore(el, eParent.firstChild);
}


/**
 * @param {HTMLElement} el 
 * @param {string} tag 
 * @param {string} [className] 
 * @returns {HTMLElement} New child element
 */
export function replaceEl(el, tag, className) {
    const neW = document.createElement(tag);
    neW.className = ((className || '') + el.className).trim();
    el.parentElement.replaceChild(neW, el)
    return neW;
}


/**
 * @param {HTMLElement} el
 */
export function removeEl(el) {
    if (el.parentElement) {
        el.parentElement.removeChild(el);
    }
}


/**
 * @param {HTMLElement} el 
 * @returns {{ left: number, top: number }} Coordinates relative to the document
 */
export function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
        left: window.pageXOffset + rect.left,
        top: window.pageYOffset + rect.top
    };
}