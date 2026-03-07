// coupling_network.js
export function calculateCityCoupling(cityA, cityB) {
    // 1. Correlación temporal entre scores AGS
    const correlationAGS = calculateCorrelation(
        cityA.agsHistory || [60, 60, 60, 60, 60],
        cityB.agsHistory || [60, 60, 60, 60, 60]
    );
    
    // 2. Acoplamiento hídrico (si comparten cuenca)
    const waterCoupling = (cityA.waterBasin && cityB.waterBasin && 
                          cityA.waterBasin === cityB.waterBasin) ? 0.3 : 0;
    
    // 3. Flujo comercial (aproximado por población y distancia)
    const distance = haversineDistance(
        cityA.lat, cityA.lon, 
        cityB.lat, cityB.lon
    );
    const tradeFlow = 0.1 * (cityA.population * cityB.population) / (distance * 1e6);
    
    // 4. Proximidad geográfica
    const geoProximity = Math.max(0, 0.2 * (1 - distance / 5000));
    
    // 5. Sincronía institucional
    const institutionalSync = 1 - Math.abs((cityA.I || 50) - (cityB.I || 50)) / 100;
    
    // Ponderación final
    const coupling = 
        0.3 * correlationAGS +
        waterCoupling +
        0.2 * Math.min(0.5, tradeFlow) +
        0.1 * geoProximity +
        0.1 * institutionalSync;
    
    return {
        value: Math.min(1.5, coupling),
        components: {
            correlation: correlationAGS,
            water: waterCoupling,
            trade: tradeFlow,
            geo: geoProximity,
            institutional: institutionalSync
        }
    };
}

function calculateCorrelation(seriesA, seriesB) {
    if (seriesA.length !== seriesB.length || seriesA.length < 2) return 0;
    
    const n = seriesA.length;
    const meanA = seriesA.reduce((a, b) => a + b, 0) / n;
    const meanB = seriesB.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;
    
    for (let i = 0; i < n; i++) {
        const diffA = seriesA[i] - meanA;
        const diffB = seriesB[i] - meanB;
        numerator += diffA * diffB;
        denomA += diffA * diffA;
        denomB += diffB * diffB;
    }
    
    if (denomA === 0 || denomB === 0) return 0;
    
    const correlation = numerator / Math.sqrt(denomA * denomB);
    return Math.max(0, correlation); // Solo correlación positiva para acoplamiento
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export function getCouplingColor(value) {
    if (value > 1.3) return '#ff3366';
    if (value > 0.8) return '#ffaa00';
    return '#4466aa';
}
