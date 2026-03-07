// labs.js
import { loadMetricData } from './data_loader.js';
import { runMonteCarlo, runTimeSeriesMonteCarlo } from './montecarlo.js';
import { createECG } from './charts_ecg.js';

async function initLabs() {
    const urlParams = new URLSearchParams(window.location.search);
    const metricId = urlParams.get('metrica') || 'estres_hidrico';
    const category = urlParams.get('categoria') || 'agua';
    
    // Cargar datos de la métrica
    const metrics = await loadMetricData('ags', category);
    const metric = metrics.find(m => m.id === metricId) || metrics[0];
    
    if (!metric) return;
    
    document.getElementById('metric-info').innerHTML = `
        <h2>${metric.nombre}</h2>
        <p>${metric.descripcion || 'Análisis de simulación Monte Carlo'}</p>
    `;
    
    // Configurar valores iniciales
    const meanInput = document.getElementById('mean-input');
    const stdInput = document.getElementById('std-input');
    const iterInput = document.getElementById('iter-input');
    const runButton = document.getElementById('run-simulation');
    
    meanInput.value = metric.valor_actual;
    stdInput.value = 5;
    iterInput.value = 1000;
    
    // Ejecutar simulación inicial
    runSimulation(metric, metric.valor_actual, 5, 1000);
    
    // Event listener
    runButton.addEventListener('click', () => {
        const mean = parseFloat(meanInput.value);
        const std = parseFloat(stdInput.value);
        const iter = parseInt(iterInput.value);
        runSimulation(metric, mean, std, iter);
    });
}

function runSimulation(metric, mean, std, iterations) {
    // Generar datos simulados para la gráfica
    const simulatedData = [];
    for (let i = 0; i < 20; i++) {
        simulatedData.push({
            fecha: `Sim-${i+1}`,
            valor: mean + (Math.random() - 0.5) * std * 2
        });
    }
    
    // Ejecutar Monte Carlo
    const results = runMonteCarlo(mean, std, iterations);
    
    // Crear simulaciones para la serie histórica
    const historicalSims = runTimeSeriesMonteCarlo(metric.serie_historica || [], std, iterations);
    
    // Renderizar ECG grande
    createECG('simulation-chart', simulatedData, historicalSims, {
        width: 800,
        height: 300,
        interactive: true
    });
    
    // Actualizar tabla
    document.getElementById('p5-value').textContent = results.p5.toFixed(2);
    document.getElementById('p50-value').textContent = results.p50.toFixed(2);
    document.getElementById('p95-value').textContent = results.p95.toFixed(2);
}

document.addEventListener('DOMContentLoaded', initLabs);
