// coupling_matrix.js
export function renderCouplingMatrix(containerId, deltaW, deltaI, deltaP) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<h3 class="section-title">SYSTEM COUPLING</h3>';
    
    const matrix = [
        [0, deltaW * deltaI, deltaW * deltaP],
        [deltaI * deltaW, 0, deltaI * deltaP],
        [deltaP * deltaW, deltaP * deltaI, 0]
    ];
    
    const labels = ['W', 'I', 'P'];
    
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', 300)
        .attr('height', 300)
        .append('g')
        .attr('transform', 'translate(50,50)');
    
    const cellSize = 80;
    
    // Celdas
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (i === j) continue;
            
            const value = matrix[i][j];
            const color = value > 0.1 ? '#ff3366' : value < -0.1 ? '#4466aa' : '#2a2a2a';
            
            svg.append('rect')
                .attr('x', j * cellSize)
                .attr('y', i * cellSize)
                .attr('width', cellSize)
                .attr('height', cellSize)
                .attr('fill', color)
                .attr('opacity', 0.3 + Math.min(0.7, Math.abs(value)))
                .attr('stroke', '#2a2a2a')
                .attr('stroke-width', 1);
            
            svg.append('text')
                .attr('x', j * cellSize + cellSize/2)
                .attr('y', i * cellSize + cellSize/2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#d8d4c8')
                .style('font-family', 'JetBrains Mono')
                .style('font-size', '12px')
                .text(value.toFixed(2));
        }
    }
    
    // Etiquetas
    for (let i = 0; i < 3; i++) {
        svg.append('text')
            .attr('x', -10)
            .attr('y', i * cellSize + cellSize/2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#c9a84c')
            .style('font-family', 'JetBrains Mono')
            .text(labels[i]);
        
        svg.append('text')
            .attr('x', i * cellSize + cellSize/2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#c9a84c')
            .style('font-family', 'JetBrains Mono')
            .text(labels[i]);
    }
}
