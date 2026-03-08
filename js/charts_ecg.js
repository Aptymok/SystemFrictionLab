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
            
            let color = '#00cc66'; // Verde
            if (d.valor > 65) color = '#ff3366'; // Rojo
            else if (d.valor > 35) color = '#ffaa00'; // Amarillo
            
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

    // 5. Renderizar Área de Incertidumbre - CORRECCIÓN DE ERROR DE REFERENCIA
    if (simulations && simulations.p5 && simulations.p95) {
        const areaGenerator = d3.area()
            .x((d, i) => x(i))
            .y0((d, i) => {
                // Validación explícita de i y del valor en el array de simulaciones
                const val = (simulations.p5 && simulations.p5[i] !== undefined) 
                            ? simulations.p5[i] 
                            : d.valor;
                return y(val);
            })
            .y1((d, i) => {
                const val = (simulations.p95 && simulations.p95[i] !== undefined) 
                            ? simulations.p95[i] 
                            : d.valor;
                return y(val);
            })
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(data)
            .attr('fill', '#4466aa')
            .attr('fill-opacity', 0.15)
            .attr('stroke', 'none')
            .attr('class', 'uncertainty-area')
            .attr('d', areaGenerator);
    }

    // 6. Línea de Valor Observado
    const lineGenerator = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d.valor))
        .curve(d3.curveMonotoneX);

    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('class', 'observed-line')
        .attr('d', lineGenerator)
        .style('filter', 'drop-shadow(0px 0px 2px rgba(255,255,255,0.5))');

    // 7. Ejes
    const xAxis = d3.axisBottom(x)
        .ticks(data.length)
        .tickFormat(i => data[i]?.fecha || '');

    svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("fill", "#888")
        .style("font-family", "JetBrains Mono");

    const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d => d + "%");

    svg.append('g')
        .attr('class', 'axis axis-y')
        .call(yAxis)
        .selectAll("text")
        .style("fill", "#888")
        .style("font-family", "JetBrains Mono");

    // 8. Tooltip
    if (config.interactive) {
        const tooltip = d3.select('body').selectAll('.tooltip-ecg').data([0]);
        const tooltipEnter = tooltip.enter().append('div').attr('class', 'tooltip tooltip-ecg').style('opacity', 0);
        const tooltipDiv = tooltip.merge(tooltipEnter);
        
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
                tooltipDiv.style('opacity', 1)
                    .html(`<strong>${d.fecha}</strong><br>Valor: ${d.valor.toFixed(2)}%`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 40) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).transition().duration(100).attr('r', 5);
                tooltipDiv.style('opacity', 0);
            });
    }
}
