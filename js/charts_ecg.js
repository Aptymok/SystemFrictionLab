// charts_ecg.js
// Visualización de series temporales con bandas de incertidumbre (Estilo ECG)

export function createECG(containerId, data, simulations, options = {}) {
    const defaults = {
        width: 800,
        height: 240,
        margin: { top: 20, right: 30, bottom: 30, left: 50 },
        interactive: true
    };
    
    const config = { ...defaults, ...options };
    
    // 1. Limpiar contenedor previo
    const container = d3.select(`#${containerId}`);
    container.html('');
    
    if (!data || data.length === 0) {
        container.append('p').text('No hay datos disponibles').style('color', '#666');
        return;
    }

    const width = config.width - config.margin.left - config.margin.right;
    const height = config.height - config.margin.top - config.margin.bottom;
    
    // 2. Definir Escalas
    const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    // 3. Crear SVG y Grupo Principal
    const svg = container.append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    // 4. Renderizar Bandas de Estado (Fondo)
    data.forEach((d, i) => {
        if (i < data.length - 1) {
            const x1 = x(i);
            const x2 = x(i + 1);
            
            let color = '#00cc66'; // Verde (Estable)
            if (d.valor > 65) color = '#ff3366'; // Rojo (Crítico)
            else if (d.valor > 35) color = '#ffaa00'; // Amarillo (Alerta)
            
            svg.append('rect')
                .attr('x', x1)
                .attr('y', 0)
                .attr('width', x2 - x1)
                .attr('height', height)
                .style('fill', color)
                .style('opacity', 0.05)
                .style('pointer-events', 'none');
        }
    });

    // 5. Renderizar Área de Incertidumbre (Monte Carlo) - CORREGIDO
    if (simulations && simulations.p5 && simulations.p95) {
        const area = d3.area()
            .x((d, i) => x(i))
            .y0((d, i) => y(simulations.p5 && simulations.p5[i] !== undefined ? simulations.p5[i] : d.valor))
            .y1((d, i) => y(simulations.p95 && simulations.p95[i] !== undefined ? simulations.p95[i] : d.valor))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(data)
            .attr('class', 'uncertainty-area')
            .attr('d', area)
            .style('fill', '#4466aa')
            .style('opacity', 0.15)
            .style('stroke', 'none');
    }

    // 6. Línea de Valor Observado (Principal)
    const line = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d.valor))
        .curve(d3.curveMonotoneX);

    svg.append('path')
        .datum(data)
        .attr('class', 'observed-line')
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', '#ffffff')
        .style('stroke-width', 2)
        .style('filter', 'drop-shadow(0px 0px 2px rgba(255,255,255,0.5))');

    // 7. Ejes
    svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(data.length).tickFormat(i => data[i]?.fecha || ''))
        .selectAll("text")
        .style("fill", "#888")
        .style("font-family", "JetBrains Mono");

    svg.append('g')
        .attr('class', 'axis axis-y')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("fill", "#888")
        .style("font-family", "JetBrains Mono");

    // 8. Tooltip Interactivo
    if (config.interactive) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        svg.selectAll('.dot')
            .data(data)
            .enter().append('circle')
            .attr('cx', (d, i) => x(i))
            .attr('cy', d => y(d.valor))
            .attr('r', 5)
            .style('fill', '#c9a84c')
            .style('opacity', 0.8)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).transition().duration(100).attr('r', 8);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.fecha}</strong><br>Valor: ${d.valor.toFixed(2)}%`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 40) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).transition().duration(100).attr('r', 5);
                tooltip.style('opacity', 0);
            });
    }
}
