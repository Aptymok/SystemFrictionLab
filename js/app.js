// app.js
import { loadCityData } from './data_loader.js';
import { calculateAGS, getBarColor } from './modelo_avanzado.js';

async function initHome() {
    // Cargar datos de AGS
    const cities = await loadCityData();
    const agsCity = cities.find(c => c.id === 'ags') || cities[0];
    
    // Calcular scores (simplificado para demo)
    const W = agsCity.W || 50;
    const I = agsCity.I || 50;
    const P = agsCity.P || 50;
    
    const agsResult = calculateAGS(W, I, P, { W: 50, I: 50, P: 50 });
    
    // Actualizar DOM
    document.getElementById('ags-score').textContent = Math.round(agsResult.score);
    
    // Barras
    updateBar('agua', W);
    updateBar('integridad', I);
    updateBar('perturbacion', P);
    
    // Event listeners
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            window.location.href = `dashboard.html?categoria=${category}`;
        });
    });
}

function updateBar(category, value) {
    const bar = document.getElementById(`bar-${category}`);
    const score = document.getElementById(`score-${category}`);
    
    if (bar) {
        bar.style.width = `${value}%`;
        bar.style.backgroundColor = getBarColor(value);
    }
    if (score) {
        score.textContent = Math.round(value);
    }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initHome);
