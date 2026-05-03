import { hasRecentWearableMetric, readWearableState } from './wearable.js';

// details.js

const urlParams = new URLSearchParams(window.location.search);
const metricId = urlParams.get('metric') || 'hr'; // default to hr if missing

// Use the exact hex colors from the user's palette
const metricConfig = {
    'hr': { title: 'Frecuencia Cardíaca', unit: 'lpm', color: '#fca311ff' }, // orange
    'steps': { title: 'Pasos', unit: 'pasos', color: '#fca311ff' }, // orange
    'sleep': { title: 'Sueño', unit: 'horas', color: '#2952a3ff' }, // lighter blue
    'spo2': { title: 'Oxígeno en Sangre', unit: '%', color: '#2952a3ff' }
};

const config = metricConfig[metricId];

document.getElementById('metric-title').innerText = config.title;
document.getElementById('current-unit').innerText = config.unit;

function getCssVar(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function formatHistoryLabel(date, range) {
    if (range === '1d') {
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

function getRangeCutoff(range) {
    const rangeHours = {
        '1d': 24,
        '1w': 24 * 7,
        '1m': 24 * 30,
        '3m': 24 * 90
    };

    return Date.now() - (rangeHours[range] || 24) * 60 * 60 * 1000;
}

function getWearableData(range, metric) {
    if (!hasRecentWearableMetric(metric)) return null;

    const state = readWearableState();
    const points = (state.history[metric] || [])
        .filter(point => new Date(point.time).getTime() >= getRangeCutoff(range));

    const metricState = state.metrics[metric];
    const series = points.length
        ? points
        : [{ time: metricState.updatedAt, value: metricState.value }];

    return {
        labels: series.map(point => formatHistoryLabel(new Date(point.time), range)),
        data: series.map(point => Math.round(point.value)),
        currentVal: Math.round(metricState.value),
        isReal: true
    };
}

// Helper to generate mock data based on the metric and time range
function generateMockData(range, metric) {
    let labels = [];
    let data = [];
    let currentVal = 0;

    if (metric === 'hr') {
        const base = 70;
        if (range === '1d') {
            for(let i=0; i<24; i+=2) { labels.push(`${i}:00`); data.push(base + Math.random()*20 - 10); }
        } else if (range === '1w') {
            labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
            for(let i=0; i<7; i++) data.push(base + Math.random()*15 - 5);
        } else if (range === '1m') {
            for(let i=1; i<=30; i+=3) { labels.push(`Día ${i}`); data.push(base + Math.random()*15 - 5); }
        } else if (range === '3m') {
             for(let i=1; i<=12; i++) { labels.push(`Sem ${i}`); data.push(base + Math.random()*15 - 5); }
        }
        currentVal = Math.round(data[data.length-1]);
    } else if (metric === 'steps') {
        const base = 8000;
        if (range === '1d') {
            for(let i=8; i<=20; i+=2) { labels.push(`${i}:00`); data.push(Math.random()*1500); }
            currentVal = Math.round(data.reduce((a,b)=>a+b,0));
        } else if (range === '1w') {
            labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
            for(let i=0; i<7; i++) data.push(base + Math.random()*4000 - 2000);
            currentVal = Math.round(data[data.length-1]);
        } else if (range === '1m') {
            for(let i=1; i<=30; i+=3) { labels.push(`Día ${i}`); data.push(base + Math.random()*4000 - 2000); }
            currentVal = Math.round(data[data.length-1]);
        } else if (range === '3m') {
             for(let i=1; i<=12; i++) { labels.push(`Sem ${i}`); data.push((base + Math.random()*4000 - 2000)*7); }
             currentVal = Math.round(data[data.length-1] / 7); // average steps per week
        }
    } else if (metric === 'sleep') {
        const base = 7;
        if (range === '1d') {
            labels = ['22:00', '00:00', '02:00', '04:00', '06:00', '08:00'];
            data = [0, 1, 1, 1, 1, 0]; // simplified representation of sleep stages
            currentVal = 7.5;
        } else if (range === '1w') {
            labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
            for(let i=0; i<7; i++) data.push(base + Math.random()*2 - 1);
            currentVal = data[data.length-1].toFixed(1);
        } else if (range === '1m') {
            for(let i=1; i<=30; i+=3) { labels.push(`Día ${i}`); data.push(base + Math.random()*2 - 1); }
            currentVal = data[data.length-1].toFixed(1);
        } else if (range === '3m') {
             for(let i=1; i<=12; i++) { labels.push(`Sem ${i}`); data.push(base + Math.random()*1.5 - 0.5); }
             currentVal = data[data.length-1].toFixed(1);
        }
    } else if (metric === 'spo2') {
         const base = 96;
        if (range === '1d') {
             for(let i=0; i<24; i+=3) { labels.push(`${i}:00`); data.push(base + Math.random()*4); }
        } else if (range === '1w') {
            labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
            for(let i=0; i<7; i++) data.push(base + Math.random()*3);
        } else if (range === '1m') {
            for(let i=1; i<=30; i+=3) { labels.push(`Día ${i}`); data.push(base + Math.random()*4); }
        } else if (range === '3m') {
             for(let i=1; i<=12; i++) { labels.push(`Sem ${i}`); data.push(base + Math.random()*2); }
        }
        currentVal = Math.round(data[data.length-1]);
    }

    if (metric !== 'sleep' || range === '1d') data = data.map(Math.round);

    return { labels, data, currentVal };
}

let chartInstance = null;

function renderChart(range) {
    const { labels, data, currentVal } = getWearableData(range, metricId) || generateMockData(range, metricId);
    
    document.getElementById('current-value').innerText = currentVal.toLocaleString();

    const ctx = document.getElementById('metricChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Always use a line chart to keep consistency across all metrics
    const chartType = 'line';

    // Parse color to rgba for background fill
    // Hacky way to add opacity to hex
    const bgColor = config.color.replace('ff', '20');
    const textSecondary = getCssVar('--text-secondary', '#14213d');
    const cardColor = getCssVar('--bg-card', '#ffffff');
    const gridColor = document.documentElement.classList.contains('dark-mode')
        ? 'rgba(229, 229, 229, 0.12)'
        : 'rgba(0,0,0,0.05)';

    chartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: config.title,
                data: data,
                borderColor: config.color,
                backgroundColor: bgColor,
                borderWidth: 3,
                borderRadius: 0,
                tension: 0.4,
                fill: true,
                pointRadius: (range === '1d' || range === '1w') ? 4 : 0,
                pointBackgroundColor: cardColor,
                pointBorderColor: config.color,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(20, 33, 61, 0.9)', // Prussian blue semi-transparent
                    titleFont: { family: 'Outfit', size: 14 },
                    bodyFont: { family: 'Outfit', size: 14 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: metricId === 'steps' || metricId === 'sleep',
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { font: { family: 'Outfit' }, color: textSecondary }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { font: { family: 'Outfit' }, color: textSecondary, maxTicksLimit: 7 }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Render chart on load with default range
renderChart('1d');

// Filter button logic
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderChart(e.target.dataset.range);
    });
});
