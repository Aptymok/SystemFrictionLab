// dashboard.js
import { loadMetricData } from './data_loader.js';
import { runTimeSeriesMonteCarlo } from './montecarlo.js';
import { createECG } from './charts_ecg.js';
import { renderCouplingMatrix } from './coupling_matrix.js';

async function initDashboard() {
    // Obtener categoría de URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('categoria') || 'agua';
    
    document.getElementById('category-title').textContent = category.toUpperCase();
    
    // Cargar métricas
    const metrics = await loadMetricData('ags', category);
    
    // Renderizar métricas
    const container = document.getElementById('metrics-container');
    container.innerHTML = '';
    
    metrics.forEach((metric, index) => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.dataset.metricId = metric.id;
        
        // Simulaciones para ECG
        const simulations = runTimeSeriesMonteCarlo(metric.serie_historica, 5, 1000);
        
        card.innerHTML = `
            <div class="metric-header">
                <span class="metric-name">${metric.nombre}</span>
                <span class="metric-value">${metric.valor_actual}${metric.unidad}</span>
            </div>
            <div id="chart-${index}" class="metric-chart"></div>
        `;
        
        container.appendChild(card);
        
        // Renderizar ECG
        setTimeout(() => {
            createECG(`chart-${index}`, metric.serie_historica, simulations, {
                width: 350,
                height: 120,
                interactive: false
            });
        }, 10);
        
        // Click para ir a labs
        card.addEventListener('click', () => {
            window.location.href = `labs.html?metrica=${metric.id}&categoria=${category}`;
        });
    });
    
    // Calcular deltas para matriz de acoplamiento
const waterData = await loadMetricData('ags', 'agua');
const integrityData = await loadMetricData('ags', 'integridad');
const perturbationData = await loadMetricData('ags', 'perturbacion');
    
    const getLastTwoAvg = (data) => {
        if (!data || !data[0] || !data[0].serie_historica) return 50;
        const hist = data[0].serie_historica;
        if (hist.length < 2) return hist[0]?.valor || 50;
        return (hist[hist.length-1].valor + hist[hist.length-2].valor) / 2;
    };
    
    const W = getLastTwoAvg(waterData);
    const I = getLastTwoAvg(integrityData);
    const P = getLastTwoAvg(perturbationData);
    
    const prevW = waterData[0]?.serie_historica?.[waterData[0]?.serie_historica?.length - 3]?.valor || W * 0.95;
    const prevI = integrityData[0]?.serie_historica?.[integrityData[0]?.serie_historica?.length - 3]?.valor || I * 0.95;
    const prevP = perturbationData[0]?.serie_historica?.[perturbationData[0]?.serie_historica?.length - 3]?.valor || P * 0.95;
    
    const deltaW = (W - prevW) / prevW;
    const deltaI = (I - prevI) / prevI;
    const deltaP = (P - prevP) / prevP;
    
    renderCouplingMatrix('coupling-matrix', deltaW, deltaI, deltaP);
}

document.addEventListener('DOMContentLoaded', initDashboard);
