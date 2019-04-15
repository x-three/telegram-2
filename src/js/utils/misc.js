/**
 * @param {number} timeout 
 * @return {(cb: () => void) => void}
 */
export function debounce(timeout) {
    let id = null;
    return function(cb) {
        clearTimeout(id);
        id = setTimeout(cb, timeout);
    };
}


/**
 * @param {TCollection} collection 
 * @param {(el: any, index: number, collection: TCollection) => boolean} cb 
 * @returns {any}
 */
export function find(collection, cb) {
    for (let i in collection) {
        if (collection.hasOwnProperty(i) && cb(collection[i], (isNaN(+i) ? i : +i), collection)) {
            return collection[i];
        }
    }
}


/**
 * @param {string} url 
 * @param {(data: any) => void} cb
 */
export function ajax(url, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) throw 'Invalid URL';
        cb(JSON.parse(xhr.responseText));
    };
}


/* Mobile *************************************************************************************************************/
/**
 * @returns {number}
 */
export function dpr() {
    return Math.min(2, window.devicePixelRatio); // Already sharp enough
}


/**
 * @returns {boolean}
 */
export function isMobile() {
    return /Android|iPad|iPhone|Windows Phone/.test(window.navigator.userAgent);
}


/**
 * @param {string} text 
 */
export function log(text) {
    const el = document.getElementById('console-log');
    const time = (new Date()).toISOString().substring(11, 19);
    el.textContent = `${time}: ${text}\n${el.textContent}`;
}