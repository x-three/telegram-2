/**
 * @param {TCollection} target
 * @param {...TCollection} sources
 * @returns {TCollection}
 */
export function assign(target, ...sources) {
    return _merge(1, target, sources);
}


/**
 * 
 * @param {TCollection} target
 * @param {...TCollection} sources
 * @returns {TCollection}
 */
export function merge(target, ...sources) {
    return _merge(null, target, sources);
}


/**
 * @param {number} depth
 * @param {TCollection} target
 * @param {TCollection[]} sources
 * @returns {TCollection}
 */
function _merge(depth, target, sources) {
    if (!(target instanceof Object)) throw 'Invalid Target Object';
    if (!sources.length) return target;

    return sources.reduce((t, s) => {
        return (s instanceof Object) && (!(s instanceof Array) || (t instanceof Array)) ? _merge2(t, s, 1, depth) : t;
    }, target);
}


/**
 * @typedef {Object.<string, any> | Array.<any>} TCollection
 * @param {TCollection} target
 * @param {TCollection} source
 * @returns {TCollection}
 */
function _merge2(target, source, depth, maxDepth) {
    for (let key in source) {
        const sType = (source[key] instanceof Array) ? 'array' : typeof source[key];
        const tType = (target[key] instanceof Array) ? 'array' : typeof target[key];

        if ((maxDepth == undefined || depth < maxDepth) && (sType === 'array' || sType === 'object')) {
            if (sType !== tType) target[key] = sType === 'array' ? [] : {};
            _merge2(target[key], source[key], depth + 1, maxDepth);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}
