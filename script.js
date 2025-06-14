// Função para gerar curva de rendimento
function generateEfficiencyCurve(flowData, bepFlow, maxEfficiency) {
    return flowData.map(flow => {
        const efficiency = maxEfficiency - Math.pow((flow - bepFlow) / bepFlow, 2) * maxEfficiency * 1.2;
        return Math.max(0, efficiency);
    });
}

// Função para gerar dados de vazão
function linspace(start, stop, num) {
    const step = (stop - start) / (num - 1);
    return Array.from({length: num}, (_, i) => start + step * i);
}

// Dados das bombas
const pumpData = {
    "BC-21 R 1/2 (3 CV)": {
        potencia_cv: 3,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 57.05,
        vazao_data: linspace(0, 42, 100),
        get altura_data() {
            return this.vazao_data.map(q => -0.016 * q * q + 0.25 * q + 30);
        },
        get potencia_data() {
            return this.vazao_data.map(q => -0.0025 * q * q + 0.18 * q + 0.8);
        },
        get npsh_curva() {
            return this.vazao_data.map(() => Math.random() * 2 + 1.5);
        },
        get rendimento_curva() {
            return generateEfficiencyCurve(this.vazao_data, 25, 57.05);
        }
    },
    "BC-21 R 1/2 (4 CV)": {
        potencia_cv: 4,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 54.68,
        vazao_data: linspace(0, 50, 100),
        get altura_data() {
            return this.vazao_data.map(q => -0.014 * q * q + 0.1 * q + 41);
        },
        get potencia_data() {
            return this.vazao_data.map(q => -0.001 * q * q + 0.1 * q + 1.5);
        },
        get npsh_curva() {
            return this.vazao_data.map(() => Math.random() * 1.2 + 1.8);
        },
        get rendimento_curva() {
            return generateEfficiencyCurve(this.vazao_data, 30, 54.68);
        }
    },
    "Bomba Trabalho": {
        potencia_cv: 46.5,
        rotacao_rpm: 1700,
        npsh_mca: 25,
        rendimento_percent: 75,
        vazao_data: linspace(0, 100, 100),
        get altura_data() {
            return this.vazao_data.map(q => -0.005 * q * q - 0.1 * q + 60);
        },
        get potencia_data() {
            return this.vazao_data.map(q => -0.002 * q * q + 0.5 * q + 15);
        },
        get npsh_curva() {
            return this.vazao_data.map(() => Math.random() * 15 + 15);
        },
        get rendimento_curva() {
            return generateEfficiencyCurve(this.vazao_data, 65, 75);
        }
    }
};

let chart;
let operatingPointDatasets = [];

// Função de interpolação linear
function interp(x, xp, fp) {
    if (x <= xp[0]) return fp[0];
    if (x >= xp[xp.length - 1]) return fp[fp.length - 1];
    
    for (let i = 0; i < xp.length - 1; i++) {
        if (x >= xp[i] && x <= xp[i + 1]) {
            const t = (x - xp[i]) / (xp[i + 1] - xp[i]);
            return fp[i] + t * (fp[i + 1] - fp[i]);
        }
    }
    return fp[fp.length - 1];
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('pumpChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Curvas Características da Bomba',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Vazão - Q (m³/h)'
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Altura (m)',
                        color: 'red'
                    },
                    ticks: {
                        color: 'red'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Potência (CV)',
                        color: 'blue'
                    },
                    ticks: {
                        color: 'blue'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'NPSH (mca)',
                        color: 'green'
                    },
                    ticks: {
                        color: 'green'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    offset: true
                },
                y3: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Rendimento (%)',
                        color: 'purple'
                    },
                    ticks: {
                        color: 'purple'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    offset: true
                }
            }
        }
    });
    
    // Event listeners
    document.getElementById('pumpSelect').addEventListener('change', onPumpSelect);
    
    // Inicializar com a primeira bomba
    onPumpSelect();
});

function onPumpSelect() {
    clearResults();
    const selectedPump = document.getElementById('pumpSelect').value;
    const data = pumpData[selectedPump];
    
    // Atualizar informações da bomba
    document.getElementById('powerInfo').textContent = `${data.potencia_cv} CV`;
    document.getElementById('rotationInfo').textContent = `${data.rotacao_rpm} rpm`;
    document.getElementById('npshInfo').textContent = `${data.npsh_mca} mca`;
    document.getElementById('efficiencyInfo').textContent = `${data.rendimento_percent}%`;
    
    plotCurves();
}

function plotCurves() {
    const selectedPump = document.getElementById('pumpSelect').value;
    const data = pumpData[selectedPump];
    
    const datasets = [
        {
            label: 'Altura (H)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.altura_data[i]})),
            borderColor: 'red',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            yAxisID: 'y',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
        },
        {
            label: 'Potência (CV)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.potencia_data[i]})),
            borderColor: 'blue',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            yAxisID: 'y1',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
        },
        {
            label: 'NPSH (mca)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.npsh_curva[i]})),
            borderColor: 'green',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            yAxisID: 'y2',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
        },
        {
            label: 'Rendimento (%)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.rendimento_curva[i]})),
            borderColor: 'purple',
            backgroundColor: 'rgba(128, 0, 128, 0.1)',
            yAxisID: 'y3',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
        }
    ];
    
    chart.data.datasets = datasets;
    chart.update();
}

function updateFromFlow() {
    clearOperatingPoint();
    try {
        const flowVal = parseFloat(document.getElementById('flowInput').value);
        const selectedPump = document.getElementById('pumpSelect').value;
        const data = pumpData[selectedPump];
        
        if (isNaN(flowVal)) {
            clearResults("Erro: Entrada de vazão inválida.");
            return;
        }
        
        const minFlow = Math.min(...data.vazao_data);
        const maxFlow = Math.max(...data.vazao_data);
        
        if (flowVal < minFlow || flowVal > maxFlow) {
            clearResults("Erro: Vazão fora da faixa da curva.");
            return;
        }
        
        const headVal = interp(flowVal, data.vazao_data, data.altura_data);
        const powerVal = interp(flowVal, data.vazao_data, data.potencia_data);
        const effVal = interp(flowVal, data.vazao_data, data.rendimento_curva);
        
        document.getElementById('headInput').value = headVal.toFixed(2);
        
        updateOperatingPointDisplay(flowVal, headVal, powerVal, effVal);
        
    } catch (error) {
        clearResults("Erro: Entrada de vazão inválida.");
    }
}

function updateFromHead() {
    clearOperatingPoint();
    try {
        const headVal = parseFloat(document.getElementById('headInput').value);
        const selectedPump = document.getElementById('pumpSelect').value;
        const data = pumpData[selectedPump];
        
        if (isNaN(headVal)) {
            clearResults("Erro: Entrada de altura inválida.");
            return;
        }
        
        const headCurve = data.altura_data;
        const flowCurve = data.vazao_data;
        
        // Encontrar o ponto de altura máxima
        let maxHeadIndex = 0;
        for (let i = 1; i < headCurve.length; i++) {
            if (headCurve[i] > headCurve[maxHeadIndex]) {
                maxHeadIndex = i;
            }
        }
        
        // Usar apenas a parte estável da curva (após o pico)
        const stableHeadCurve = headCurve.slice(maxHeadIndex);
        const stableFlowCurve = flowCurve.slice(maxHeadIndex);
        
        const minH = Math.min(...stableHeadCurve);
        const maxH = Math.max(...stableHeadCurve);
        
        if (headVal < minH - 1e-6 || headVal > maxH + 1e-6) {
            clearResults("Erro: Altura fora da faixa operacional da curva.");
            return;
        }
        
        // Inverter arrays para interpolação
        const reversedHeadCurve = [...stableHeadCurve].reverse();
        const reversedFlowCurve = [...stableFlowCurve].reverse();
        
        const flowVal = interp(headVal, reversedHeadCurve, reversedFlowCurve);
        const powerVal = interp(flowVal, flowCurve, data.potencia_data);
        const effVal = interp(flowVal, flowCurve, data.rendimento_curva);
        
        document.getElementById('flowInput').value = flowVal.toFixed(2);
        
        updateOperatingPointDisplay(flowVal, headVal, powerVal, effVal);
        
    } catch (error) {
        clearResults("Erro: Entrada de altura inválida.");
    }
}

function updateOperatingPointDisplay(flow, head, power, efficiency) {
    clearOperatingPoint();
    
    // Adicionar pontos de operação ao gráfico
    const operatingPoints = [
        {
            label: 'Ponto de Operação',
            data: [{x: flow, y: head}],
            borderColor: 'black',
            backgroundColor: 'black',
            yAxisID: 'y',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        },
        {
            label: '',
            data: [{x: flow, y: power}],
            borderColor: 'black',
            backgroundColor: 'black',
            yAxisID: 'y1',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        },
        {
            label: '',
            data: [{x: flow, y: efficiency}],
            borderColor: 'black',
            backgroundColor: 'black',
            yAxisID: 'y3',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        }
    ];
    
    operatingPointDatasets = operatingPoints;
    chart.data.datasets = [...chart.data.datasets.slice(0, 4), ...operatingPoints];
    
    // Atualizar resultados
    document.getElementById('flowResult').textContent = `Vazão (m³/h): ${flow.toFixed(2)}`;
    document.getElementById('headResult').textContent = `Altura (m): ${head.toFixed(2)}`;
    document.getElementById('powerResult').textContent = `Potência Resultante (CV): ${power.toFixed(3)}`;
    document.getElementById('efficiencyResult').textContent = `Rendimento no Ponto (%): ${efficiency.toFixed(2)}`;
    
    chart.update();
}

function clearOperatingPoint() {
    if (operatingPointDatasets.length > 0) {
        chart.data.datasets = chart.data.datasets.slice(0, 4);
        operatingPointDatasets = [];
        chart.update();
    }
}

function clearResults(error = null) {
    document.getElementById('flowInput').value = '';
    document.getElementById('headInput').value = '';
    
    clearOperatingPoint();
    
    if (error) {
        document.getElementById('flowResult').textContent = error;
        document.getElementById('flowResult').className = 'error';
        document.getElementById('headResult').textContent = '';
        document.getElementById('powerResult').textContent = '';
        document.getElementById('efficiencyResult').textContent = '';
    } else {
        document.getElementById('flowResult').textContent = 'Vazão (m³/h): -';
        document.getElementById('flowResult').className = '';
        document.getElementById('headResult').textContent = 'Altura (m): -';
        document.getElementById('powerResult').textContent = 'Potência Resultante (CV): -';
        document.getElementById('efficiencyResult').textContent = 'Rendimento no Ponto (%): -';
    }
}