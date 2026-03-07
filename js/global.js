// global.js
import { loadCityData } from './data_loader.js';
import { renderGlobalFrictionMap } from './global_map.js';

async function initGlobal() {
    const cities = await loadCityData();
    renderGlobalFrictionMap('global-map', cities);
}

document.addEventListener('DOMContentLoaded', initGlobal);
