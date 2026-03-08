export async function loadCityData() {
    try {
        // CAMBIA ESTA LÍNEA: quita el punto y agrega /SystemFrictionLab/
        const response = await fetch('/SystemFrictionLab/data/global/cities.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading city data:', error);
        return getDefaultCities();
    }
}

export async function loadMetricData(city, category) {
    try {
        // CAMBIA ESTA LÍNEA: quita el punto y agrega /SystemFrictionLab/
        const response = await fetch(`/SystemFrictionLab/data/${city}/${category}.json`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${city}/${category}:`, error);
        return getDefaultMetricData(category);
    }
}

function getDefaultCities() {
    return [
        {
            "id": "ags",
            "name": "Aguascalientes",
            "lat": 21.8823,
            "lon": -102.2826,
            "population": 1400000,
            "AGS": 63.2,
            "W": 58.4,
            "I": 67.1,
            "P": 64.3,
            "agsHistory": [58.2, 59.1, 60.5, 61.8, 63.2],
            "waterBasin": "Lerma-Santiago"
        },
        {
            "id": "cdmx",
            "name": "Ciudad de México",
            "lat": 19.4326,
            "lon": -99.1332,
            "population": 9200000,
            "AGS": 41.7,
            "W": 32.5,
            "I": 45.2,
            "P": 52.8,
            "agsHistory": [45.3, 44.1, 42.8, 42.0, 41.7],
            "waterBasin": "Valle de México"
        },
        {
            "id": "phoenix",
            "name": "Phoenix",
            "lat": 33.4484,
            "lon": -112.0740,
            "population": 1600000,
            "AGS": 38.9,
            "W": 24.3,
            "I": 58.7,
            "P": 42.5,
            "agsHistory": [44.2, 42.8, 41.0, 39.7, 38.9],
            "waterBasin": "Colorado"
        },
        {
            "id": "cape_town",
            "name": "Cape Town",
            "lat": -33.9249,
            "lon": 18.4241,
            "population": 4300000,
            "AGS": 52.4,
            "W": 38.6,
            "I": 62.3,
            "P": 58.9,
            "agsHistory": [58.3, 56.7, 54.8, 53.2, 52.4],
            "waterBasin": "Western Cape"
        },
        {
            "id": "sao_paulo",
            "name": "São Paulo",
            "lat": -23.5505,
            "lon": -46.6333,
            "population": 12300000,
            "AGS": 45.8,
            "W": 34.7,
            "I": 48.2,
            "P": 56.3,
            "agsHistory": [49.2, 48.1, 47.0, 46.3, 45.8],
            "waterBasin": "Alto Tietê"
        }
    ];
}

function getDefaultMetricData(category) {
    const baseData = [];
    for (let i = 0; i < 5; i++) {
        baseData.push({
            fecha: `${2019 + i}`,
            valor: 50 + Math.random() * 20
        });
    }
    
    return [{
        id: `${category}_default`,
        nombre: `${category} metric`,
        unidad: '%',
        valor_actual: baseData[baseData.length - 1].valor,
        serie_historica: baseData,
        rango_verde: [0, 40],
        rango_amarillo: [40, 70],
        rango_rojo: [70, 100],
        descripcion: 'Default metric data',
        fuente: 'demo'
    }];
}
