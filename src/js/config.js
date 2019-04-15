/** 
 * @typedef {{ global: {theme: 'day' | 'night'}, local: {} }} TState
 * @typedef {{ duration: number, easing: string }} TFx
 * @typedef {{ zoom: number, tooltip: number, longTap: number, dblClick: number, zoomLock: number }} TTimeout
 * @typedef {{ shortDays: string[], fullDays: string[], shortMonths: string[], fullMonths: string[], separator: {decimal: string, thousand: string}, suffixes: string[], words: {[word: string]: string} }} TLocalization
 * @typedef {{ family: string, size: number, hLetter: number, weight: number }} TFont
 * @typedef {{ start: number, end?: number, min: number, max?: number, adaptive?: number }} TColumns
 * @typedef {{ graph: number, grid: number }} TChartThickness
 * @typedef {{ top: number, bottom: number, left?: number, right?: number }} TChartMargin
 * @typedef {{ left: number, bottom: number }} TChartLabelVOffset
 * @typedef {{ thickness: TChartThickness, margin: TChartMargin, labelVOffset: TChartLabelVOffset, tails: boolean }} TChart
 * @typedef {{ hover: number, text: { size: { min: number, max: number }, value: { min: number, max: number }, offset: { value: number, min: number, max: number, multiplier: number }, minVisible: number, weight: number }}} TPie
 * @typedef {{ thickness: number, margin: number }} TScroll
 * @typedef {{ crossingRadius: number, offset: number }} TTooltip
 * @typedef {{ state: TState, fx: TFx, timeout: TTimeout, localization: TLocalization, font: TFont, columns: TColumns, chart: TChart, pie: TPie, scroll: TScroll, tooltip: TTooltip, colors: any }} TConfig
 */


/** @type {TConfig} */
export const config = {
    state: {
        global: {
            theme: 'day'
        }
    },

    fx: {
        duration: 350,
        easing: 'easeOutQuad'
    },

    timeout: {
        zoom:     350,
        tooltip:  200,
        longTap:  200,
        dblClick: 400,
        zoomLock: 500
    },

    localization: {
        shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        fullDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
        fullMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        separator: { decimal: '.', thousand: ' ' },
        suffixes: ['K', 'M', 'G', 'T'],
        words: { all: 'All', zoomOut: 'Zoom Out' }
    },

    font: {
        family: 'Roboto, sans-serif',
        size: 16.5,
        hLetter: 1 / 1.4,
        weight: 400
    },

    columns: {
        start: 0,       // First visible column (0 - the most recent date)
        // end: 111,    // Last visible column
        min: 30,        // Min visible columns  
        // max: 50,     // Max visible columns
        adaptive: 606   // Scales min and max properties relative to this value. If this property is missing, then min and max will be fixed for any screen width.
    },

    chart: {
        thickness: {    // Line width
            graph: 3,
            grid: 1.5
        },
        margin: {
            top: 35,
            bottom: 47
        },
        labelVOffset: { // Vertical offset of labels relative to horizontal lines
            left: 8.5,
            bottom: 13.5
        },
        tails: true     // Draw side tails
    },

    pie: {
        hover: 14,
        text: {
            size: {
                min: 27,
                max: 39,
            },
            value: {
                min: 15,
                max: 25,
            },
            offset: {
                min: 25,
                max: 50,
                multiplier: 1.5,
                value: 35
            },
            minVisible: 5,
            weight: 700
        }
    },

    scroll: {
        thickness: 1.5, // Line width
        margin: 2
    },

    tooltip: {
        crossingRadius: 6,
        offset: 37
    },

    colors: {
        pieText: '#fff',

        day: {
            line: {
                grid: '#182d3b20',
                xText: '#8e8e93',
                yText: '#8e8e93'
            },

            bar: {
                grid: '#182d3b20',
                xText: '#2525297f',
                yText: '#2525297f',
                mask: '#ffffff7f'
            },

            area: {
                grid: '#182d3b20',
                xText: '#2525297f',
                yText: '#2525297f'
            },

            graph: {
                '#fe3c30': { // Red
                    line: '#fe3c30',
                    button: '#e65850',
                    tooltip: '#f34c44'
                },
                '#4bd964': { // Green
                    line: '#4bd964',
                    button: '#5fb641',
                    tooltip: '#3cc23f'
                },
                '#108be3': { // Blue
                    line: '#108be3',
                    button: '#3497ed',
                    tooltip: '#108be3'
                },
                '#e8af14': { // Yellow
                    line: '#e8af14',
                    button: '#f5bd25',
                    tooltip: '#e4ae1b'
                },
                '#64aded': { // Blue #2
                    line: '#64aded',
                    button: '#3896e8',
                    tooltip: '#3896e8'
                },
                '#558ded': { // Dark Blue
                    line: '#558ded',
                    button: '#558ded',
                    tooltip: '#558ded'
                },
                '#5cbcdf': { // Light Blue
                    line: '#5cbcdf',
                    button: '#5cbcdf',
                    tooltip: '#5cbcdf'
                },
                '#3497ed': { // Blue
                    line: '#3497ed',
                    button: '#3497ed',
                    tooltip: '#108be3'
                },
                '#2373db': { // Dark Blue
                    line: '#2373db',
                    button: '#3381e8',
                    tooltip: '#2373db'
                },
                '#9ed448': { // Light Green
                    line: '#9ed448',
                    button: '#9ed448',
                    tooltip: '#89c32e'
                },
                '#5fb641': { // Green
                    line: '#5fb641',
                    button: '#5fb641',
                    tooltip: '#4bab29'
                },
                '#f5bd25': { // Yellow
                    line: '#f5bd25',
                    button: '#f5bd25',
                    tooltip: '#eaaf10'
                },
                '#f79e39': { // Orange
                    line: '#f79e39',
                    button: '#f79e39',
                    tooltip: '#f58608'
                },
                '#e65850': { // Red
                    line: '#e65850',
                    button: '#e65850',
                    tooltip: '#f34c44'
                },
                '#55bfe6': { // Light Blue
                    line: '#55bfe6',
                    button: '#35aadc',
                    tooltip: '#269ed4'
                }
            }
        },

        night: {
            line: {
                grid: '#ffffff20',
                xText: '#a3b1c299',
                yText: '#a3b1c299'
            },

            bar: {
                grid: '#182d3b20',
                xText: '#a3b1c299',
                yText: '#ecf2f87f',
                mask: '#242f3e7f'
            },

            area: {
                grid: '#182d3b20',
                xText: '#a3b1c299',
                yText: '#ecf2f87f'
            },

            graph: {
                '#fe3c30': { // Red
                    line: '#e6574f',
                    button: '#cf5d57',
                    tooltip: '#f7655e'
                },
                '#4bd964': { // Green
                    line: '#4bd964',
                    button: '#5ab34d',
                    tooltip: '#4bd964'
                },
                '#108be3': { // Blue
                    line: '#108be3',
                    button: '#4681bb',
                    tooltip: '#108be3'
                },
                '#e8af14': { // Yellow
                    line: '#deb93f',
                    button: '#c9af4f',
                    tooltip: '#deb93f'
                },
                '#64aded': { // Blue #2
                    line: '#4082ce',
                    button: '#4082ce',
                    tooltip: '#4082ce'
                },
                '#558ded': { // Dark Blue
                    line: '#4461ab',
                    button: '#4461ab',
                    tooltip: '#4461ab'
                },
                '#5cbcdf': { // Light Blue
                    line: '#4697b3',
                    button: '#4697b3',
                    tooltip: '#4697b3'
                },
                '#3497ed': { // Blue
                    line: '#4681bb',
                    button: '#4681bb',
                    tooltip: '#5199df'
                },
                '#2373db': { // Dark Blue
                    line: '#345b9c',
                    button: '#466fb3',
                    tooltip: '#3e65cf'
                },
                '#9ed448': { // Light Green
                    line: '#88ba52',
                    button: '#88ba52',
                    tooltip: '#99cf60'
                },
                '#5fb641': { // Green
                    line: '#3da05a',
                    button: '#3da05a',
                    tooltip: '#3cb560'
                },
                '#f5bd25': { // Yellow
                    line: '#d9b856',
                    button: '#f5bd25',
                    tooltip: '#dbb630'
                },
                '#f79e39': { // Orange
                    line: '#d49548',
                    button: '#d49548',
                    tooltip: '#ee9d39'
                },
                '#e65850': { // Red
                    line: '#cf5d57',
                    button: '#cf5d57',
                    tooltip: '#f7655e'
                },
                '#55bfe6': { // Light Blue
                    line: '#479fc4',
                    button: '#479fc4',
                    tooltip: '#43adde'
                }
            }
        }
    }
};