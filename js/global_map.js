// global_map.js
import { calculateCityCoupling, getCouplingColor } from './coupling_network.js';

export function renderGlobalFrictionMap(containerId, cities) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 600;
    
    // Calcular todas las aristas
    const links = [];
    for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
            const coupling = calculateCityCoupling(cities[i], cities[j]);
            if (coupling.value > 0.1) {
                links.push({
                    source: cities[i].id,
                    target: cities[j].id,
                    value: coupling.value,
                    color: getCouplingColor(coupling.value)
                });
            }
        }
    }
    
    // Configurar simulación
    const simulation = d3.forceSimulation(cities)
        .force('link', d3.forceLink(links).id(d => d.id).distance(d => 300 - 150 * d.value))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => 10 + Math.sqrt(d.population) / 500));
    
    // SVG
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Aristas
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', d => d.color)
        .attr('stroke-width', d => 1 + d.value * 2)
        .attr('stroke-opacity', d => 0.3 + d.value * 0.3);
    
    // Nodos
    const node = svg.append('g')
        .selectAll('circle')
        .data(cities)
        .enter()
        .append('circle')
        .attr('r', d => 5 + Math.sqrt(d.population) / 1000)
        .attr('fill', d => {
            if (d.AGS < 35) return '#ff3366';
            if (d.AGS < 65) return '#ffaa00';
            return '#00cc66';
        })
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));
    
    // Etiquetas
    const label = svg.append('g')
        .selectAll('text')
        .data(cities)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', '10px')
        .attr('fill', '#ffffff')
        .attr('dx', 12)
        .attr('dy', 4);
    
    // Eventos
    node.on('mouseover', function(event, d) {
        d3.select(this).attr('r', d => 8 + Math.sqrt(d.population) / 800);
        
        tooltip.style('opacity', 1)
            .html(`
                <strong>${d.name}</strong><br>
                AGS: ${d.AGS.toFixed(1)}<br>
                W: ${d.W.toFixed(1)} | I: ${d.I.toFixed(1)} | P: ${d.P.toFixed(1)}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 40) + 'px');
    })
    .on('mouseout', function() {
        d3.select(this).attr('r', d => 5 + Math.sqrt(d.population) / 1000);
        tooltip.style('opacity', 0);
    });
    
    // Actualizar posiciones
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        label
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });
    
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
