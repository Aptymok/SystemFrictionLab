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
    const container = d3.select(`#${containerId}`);
    container.html('');
    
    if (!data || data.length === 0) {
        container.append('p').text('No hay datos disponibles').style('color', '#666');
        return;
    }

    const width = config.width - config.margin.left - config.margin.right;
    const height = config.height - config.margin.top - config.margin.bottom;
    
    const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    const svg = container.append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    // Fondo: Bandas de estado
    data.forEach((d, i) => {
        if (i < data.length - 1) {
            let color = '#00cc66'; 
            if (d.valor > 65) color = '#ff3366'; 
            else if (d.valor > 35) color = '#ffaa00'; 
            
            svg.append('rect')
                .attr('x', x(i))
                .attr('y', 0)
                .attr('width', x(i + 1) - x(i))
                .attr('height', height)
                .style('fill', color)
                .style('opacity', 0.05);
        }
    });

    // ÁREA DE INCERTIDUMBRE - REFACTORIZADA PARA EVITAR ReferenceError
    if (simulations && simulations.p5 && simulations.p95) {
        const areaGenerator = d3.area()
            .curve(d3.curveMonotoneX)
            .x((d, i) => x(i))
            .y0((d, i) => {
                // Validación de existencia de datos en el array de simulación
                const val = (simulations.p5 && typeof simulations.p5[i] !== 'undefined') 
                            ? simulations.p5[i] 
                            : d.valor;
                return y(val);
            })
            .y1((d, i) => {
                const val = (simulations.p95 && typeof simulations.p95[i] !== 'undefined') 
                            ? simulations.p95[i] 
                            : d.valor;
                return y(val);
            });

        svg.append('path')
            .attr('d', areaGenerator(data)) // Pasamos data directamente aquí
            .attr('fill', '#4466aa')
            .attr('fill-opacity', 0.15)
            .attr('stroke', 'none')
            .attr('pointer-events', 'none');
    }

    // LÍNEA PRINCIPAL
    const lineGenerator = d3.line()
        .curve(d3.curveMonotoneX)
        .x((d, i) => x(i))
        .y(d => y(d.valor));

    svg.append('path')
        .attr('d', lineGenerator(data)) // Pasamos data directamente aquí
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0px 0px 2px rgba(255,255,255,0.5))');

    // EJES
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(data.length).tickFormat(i => data[i]?.fecha || ''))
        .selectAll("text").style("fill", "#888");

    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
        .selectAll("text").style("fill", "#888");

    // TOOLTIPS
    if (config.interactive) {
        const tooltip = d3.select('body').selectAll('.tooltip-ecg').data([0])
            .join('div').attr('class', 'tooltip tooltip-ecg').style('opacity', 0);
        
        svg.selectAll('.dot')
            .data(data).enter().append('circle')
            .attr('cx', (d, i) => x(i))
            .attr('cy', d => y(d.valor))
            .attr('r', 5)
            .style('fill', '#c9a84c')
            .style('opacity', 0.5)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('r', 8).style('opacity', 1);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.fecha}</strong><br>Valor: ${d.valor.toFixed(2)}%`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 40) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('r', 5).style('opacity', 0.5);
                tooltip.style('opacity', 0);
            });
    }
}
