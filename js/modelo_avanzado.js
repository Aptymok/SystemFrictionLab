// modelo_avanzado.js
export function calculateWaterStress(data) {
    const D = data.extraccion || 100;
    const R = data.recarga || 80;
    const Smax = data.capacidad_acuifero || 1000;
    const Sactual = data.nivel_actual || 600;
    const Qd = data.demanda || 50;
    const Qa = data.disponible || 40;

    const alpha = 0.4;
    const beta = 0.3;
    const gamma = 0.3;

    const term1 = D / R;
    const term2 = (Smax - Sactual) / Smax;
    const term3 = Qd / Qa;

    let W = alpha * term1 + beta * term2 + gamma * term3;
    W = Math.max(0, Math.min(100, W * 100));

    return W;
}

export function calculateInstitutionalIntegrity(x, degradation = 0) {
    const k = 5;
    const x0 = 0.5;
    
    if (x === undefined) return 50; // Default
    
    const logistic = 100 / (1 + Math.exp(-k * (x - x0)));
    const I = logistic * (1 - degradation);
    
    return Math.max(0, Math.min(100, I));
}

export function calculatePerturbation(indicators, weights, memoryTerm = 0) {
    if (!indicators || !weights) return 50; // Default
    
    let sum = 0;
    for (let i = 0; i < indicators.length; i++) {
        sum += indicators[i] * weights[i];
    }
    
    const P = sum + memoryTerm;
    return Math.max(0, Math.min(100, P));
}

export function calculateCoupling(deltaW, deltaI, deltaP) {
    const beta = 0.1;
    
    // Si algún delta es undefined, asumir 0
    deltaW = deltaW || 0;
    deltaI = deltaI || 0;
    deltaP = deltaP || 0;
    
    const C = 1 + beta * (deltaW * deltaI + deltaI * deltaP + deltaP * deltaW);
    return Math.max(0.5, Math.min(1.5, C));
}

export function calculateAGS(W, I, P, previousValues = { W: 50, I: 50, P: 50 }) {
    const weights = {
        water: 0.4,
        integrity: 0.3,
        perturbation: 0.3
    };

    // Calcular deltas
    const deltaW = previousValues.W ? (W - previousValues.W) / previousValues.W : 0;
    const deltaI = previousValues.I ? (I - previousValues.I) / previousValues.I : 0;
    const deltaP = previousValues.P ? (P - previousValues.P) / previousValues.P : 0;

    const C = calculateCoupling(deltaW, deltaI, deltaP);

    const AGS_base = (
        weights.water * W +
        weights.integrity * I +
        weights.perturbation * P
    ) / (weights.water + weights.integrity + weights.perturbation);

    const AGS_final = Math.max(0, Math.min(100, AGS_base * (1 / C)));

    return {
        score: AGS_final,
        W,
        I,
        P,
        coupling: C,
        components: { deltaW, deltaI, deltaP }
    };
}

export function getBarColor(value) {
    if (value < 35) return '#ff3366';
    if (value < 65) return '#ffaa00';
    return '#00cc66';
}

export function determineState(value, previousState = null) {
    // Con histéresis para evitar fluctuaciones
    if (value < 35) return 'red';
    if (value > 65) return 'green';
    if (value > 40 && previousState === 'red') return 'yellow';
    if (value < 60 && previousState === 'green') return 'yellow';
    return 'yellow';
}
