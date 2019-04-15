/**
 * @typedef {import('../config').TLocalization} TLocalization
 */


/**
 * @param {number} value 
 * @param {TLocalization} localization
 * @returns {string}
 */
export function valueToLabel(value, localization) {
    if (value < 1000) return (~~value).toString();

    const length = (~~value).toString().length;
    let pow = (Math.ceil(length / 3) - 1) * 3;
    let str;

    if (length - pow > 1) { // > 10
        value = Math.round(value / 10 ** pow);
        if (value === 1000) { // After rounding the number may be greater
            value = 1;
            pow += 3;
        }
        str = value.toString();
    }

    else { // < 10
        value = Math.round(value / 10 ** (pow - 1)) / 10;
        str = (~~value).toString();
        const frac = Math.round(value % 1 * 10).toString();
        if (frac !== '0') str += localization.separator.decimal + frac;
    }

    return str + localization.suffixes[pow / 3 - 1];
}


/**
 * @param {number} value
 * @param {TLocalization} localization
 * @returns {string}
 */
export function formatValue(value, localization) {
    return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1' + localization.separator.thousand);
}
