// charts_ecg.js
export function createECG(containerId, data, simulations, options = {}) {
    const defaults = {
        width: 800,
        height: 240,
        margin: { top: 20, right: 30, bottom: 30, left: 50 },
        showTrend: false
    };
    
    const config = { ...defaults, ...options };
    
    // Limpiar contenedor
    d3.select(`#${containerId}`).html('');
    
    const width = config.width - config.margin.left - config.margin.right;
    const height = config.height - config.margin.top - config.margin.bottom;
    
    // Escalas
    const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    // SVG
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    // Bandas de estado (verticales por período)
    data.forEach((d, i) => {
        if (i < data.length - 1) {
            const x1 = x(i);
            const x2 = x(i + 1);
            
            let color = '#00cc66';
            if (d.valor > 65) color = '#ff3366';
            else if (d.valor > 35) color = '#ffaa00';
            
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
    
    // Área de incertidumbre (si hay simulaciones)
    if (simulations && simulations.p5 && simulations.p95) {
        const area = d3.area()
            .x((d, i) => x(i))
            .y0(d => y(simulations.p5[i]))
            .y1(d => y(simulations.p95[i]));
        
        svg.append('path')
            .datum(data)
            .attr('class', 'uncertainty-area')
            .attr('d', area)
            .style('fill', '#4466aa')
            .style('opacity', 0.15)
            .style('stroke', 'none');
    }
    
    // Línea de valor observado
    const line = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d.valor));
    
    svg.append('path')
        .datum(data)
        .attr('class', 'observed-line')
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', '#ffffff')
        .style('stroke-width', 2);
    
    // Ejes
    svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(i => data[i]?.fecha || ''));
    
    svg.append('g')
        .attr('class', 'axis axis-y')
        .call(d3.axisLeft(y).ticks(5));
    
    // Tooltip
    if (config.interactive) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        svg.selectAll('.dot')
            .data(data)
            .enter().append('circle')
            .attr('cx', (d, i) => x(i))
            .attr('cy', d => y(d.valor))
            .attr('r', 4)
            .style('fill', '#c9a84c')
            .style('opacity', 0)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 1);
                tooltip.style('opacity', 1)
                    .html(`${d.fecha}<br>Valor: ${d.valor}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 40) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0);
                tooltip.style('opacity', 0);
            });
    }
}
