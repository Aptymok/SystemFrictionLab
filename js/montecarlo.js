// montecarlo.js
export function runMonteCarlo(mean, std, iterations = 1000) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
        // Box-Muller transform para normal
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const value = mean + std * z;
        results.push(Math.max(0, Math.min(100, value)));
    }
    
    results.sort((a, b) => a - b);
    
    return {
        p5: results[Math.floor(iterations * 0.05)],
        p50: results[Math.floor(iterations * 0.5)],
        p95: results[Math.floor(iterations * 0.95)],
        all: results
    };
}

export function runTimeSeriesMonteCarlo(historicalData, std, iterations = 1000) {
    // Para series temporales, simula trayectorias completas
    const lastValue = historicalData[historicalData.length - 1].valor;
    const n = historicalData.length;
    
    const p5 = [];
    const p95 = [];
    
    for (let i = 0; i < n; i++) {
        const simulations = [];
        for (let j = 0; j < iterations; j++) {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            simulations.push(Math.max(0, Math.min(100, lastValue + std * z)));
        }
        simulations.sort((a, b) => a - b);
        p5.push(simulations[Math.floor(iterations * 0.05)]);
        p95.push(simulations[Math.floor(iterations * 0.95)]);
    }
    
    return { p5, p95 };
}
