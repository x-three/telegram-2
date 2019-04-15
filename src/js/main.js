import './utils/polyfill';
import { colorToObj, ajax } from './utils';
import { config } from './config';
import { ToggleButton } from './toggle-button';
import { ChartWidget } from './widget';

const widgets = [];


document.addEventListener('DOMContentLoaded', () => {
    initNightMode();
    normalizeColors(config.colors);

    Array.prototype.forEach.call(document.querySelectorAll('.b-chart-widget'), (node) => {
        const index = node.getAttribute('index');
        if (!index || isNaN(+index)) return;
        ajax(`data/${index}/overview.json`, (data) => {
            widgets.push(new ChartWidget(node, data, config));
        });
    });
});


function initNightMode() {
    const body = document.querySelector('body');
    const node = document.querySelector('.b-toggle-night-mode');
    const button = new ToggleButton(node);

    node.addEventListener('toggle', (ev) => {
        window.localStorage.setItem('night-mode', ev.detail.index);

        if (ev.detail.state === 'night') body.classList.add('m-night-mode');
        else body.classList.remove('m-night-mode');

        config.state.global.theme = ev.detail.state;
        widgets.forEach((w) => { w.redraw() });
    });

    const iState = window.localStorage.getItem('night-mode');
    if (iState != null) button.update(+iState);
}


/**
 * @param {Object} obj
 */
function normalizeColors(obj) {
    for (let k in obj) {
        switch (typeof obj[k]) {
            case 'string': obj[k] = colorToObj(obj[k]); break;
            case 'object': normalizeColors(obj[k]); break;
        }
    }
}