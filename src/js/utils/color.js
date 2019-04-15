/**
 * @typedef {import('../config').TConfig} TConfig
 */


/**
 * @param {string} color Any correct hex color (3, 4, 6 or 8 hex digits)
 * @returns {string} Normalized hex color (6 or 8 hex digits)
 */
export function normalizeColor(color) {
    return (color.length > 5 ? color : color.replace(/^#(.)(.)(.)(.)?$/, '#$1$1$2$2$3$3$4$4')).toUpperCase();
}


/**
 * @param {string} color Normalized hex color
 * @param {number} fade 0 <= fade <= 1
 * @returns {string} Hex color with alpha channel (8 hex digits)
 */
export function colorFade(color, fade) {
    let opacity = parseInt(color.length <= 7 ? 'FF' : color.substring(7), 16);
    opacity = (~~(opacity * fade)).toString(16);
    if (opacity.length === 1) opacity = '0' + opacity;
    return (color.substring(0, 7) + opacity).toUpperCase();
}


/**
 * @typedef {{ r: number, g: number, b: number, a: number }} TColorObj
 * @param {string} color rgb, rgba or hex color
 * @returns {TColorObj | null} 
 */
export function colorToObj(color) {
    if (color[0] === '#') {
        if (!/^#[0-9a-z]+$/i.test(color) || [4, 5, 7, 9].indexOf(color.length) === -1) return null;
        if (color.length <= 5) color = color.replace(/([0-9a-z])/ig, '$1$1');
        return {
            r: parseInt(color.substring(1, 3), 16),
            g: parseInt(color.substring(3, 5), 16),
            b: parseInt(color.substring(5, 7), 16),
            a: color.length <= 7 ? 1 : parseInt(color.substring(7, 9), 16) / 255,
        };
    } 
    
    else {
        const matches = /^rgba?\(([0-9]+), ?([0-9]+), ?([0-9]+)(?:, ?(1|0|0\.[0-9]+))?\)$/i.exec(color);
        return !matches ? null : {
            r: +matches[1],
            g: +matches[2],
            b: +matches[3],
            a: matches[4] !== undefined ? +matches[4] : 1
        };
    }
}


/**
 * @param {TColorObj} color 
 * @param {number} opacity 
 * @returns {string} rgba color
 */
export function objToColor(color, opacity) {
    opacity = color.a * (opacity != undefined ? opacity : 1);
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}


/**
 * @param {TConfig} config 
 * @param {string} id
 * @returns {Object}
 */
export function colors(config, id) {
    if (id != null) {
        return config.colors[config.state.global.theme].graph[id];
    } else {
        return config.colors[config.state.global.theme];
    }
}
