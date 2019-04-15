/**
 * @typedef {import('../config').TLocalization} TLocalization
 */


/**
 * @param {number} time
 * @param {TLocalization} localization
 * @param {boolean} [full]
 * @returns {string}
 */
export function getDay(time, localization, full) {
    const date = new Date(time);
    return (full ? localization.fullDays : localization.shortDays)[date.getUTCDay()];
}


/**
 * @param {number} time
 * @param {TLocalization} localization
 * @param {boolean} [full]
 * @returns {string}
 */
export function getFullDate(time, localization, full) {
    const date = new Date(time);
    const months = full ? localization.fullMonths : localization.shortMonths;
    return date.getUTCDate() + ' ' + months[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
}


/**
 * @param {number} time
 * @returns {string}
 */
export function getTime(time) {
    const date = new Date(time)
    let hours = date.getUTCHours();
    if (hours < 10) hours = '0' + hours;
    let minutes = date.getUTCMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    return `${hours}:${minutes}`;
}