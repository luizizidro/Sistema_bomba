// Função para gerar curva de rendimento
function generateEfficiencyCurve(flowData, bepFlow, maxEfficiency) {
    return flowData.map(flow => {
        const normalizedFlow = flow / bepFlow;
        // Curva de rendimento mais realística com pico no BEP
        const efficiency = maxEfficiency * (1 - 0.8 * Math.pow(normalizedFlow - 1, 2));
        return Math.max(0, Math.min(efficiency, maxEfficiency));
    });
}

// Função para gerar dados de vazão com range estendido
function linspace(start, stop, num) {
    const step = (stop - start) / (num - 1);
    return Array.from({length: num}, (_, i) => start + step * i);
}

// Função para calcular valores das curvas para qualquer vazão
function calculateCurveValue(flow, pumpName, curveType) {
    const data = pumpData[pumpName];
    
    // Se a vazão está dentro do range dos dados, interpola normalmente
    if (flow <= Math.max(...data.vazao_data)) {
        return interp(flow, data.vazao_data, data[curveType]);
    }
    
    // Para vazões muito altas, extrapola usando a tendência da curva
    const lastTwoPoints = data.vazao_data.slice(-2);
    const lastTwoValues = data[curveType].slice(-2);
    
    const slope = (lastTwoValues[1] - lastTwoValues[0]) / (lastTwoPoints[1] - lastTwoPoints[0]);
    const extrapolatedValue = lastTwoValues[1] + slope * (flow - lastTwoPoints[1]);
    
    // Aplicar limites físicos realistas
    switch(curveType) {
        case 'altura_data':
            return Math.max(0, extrapolatedValue); // Altura não pode ser negativa
        case 'potencia_data':
            // Potência cresce com vazão, mas com limite superior realista
            return Math.max(0, Math.min(extrapolatedValue, data.potencia_cv * 3));
        case 'npsh_curva':
            return Math.max(0, extrapolatedValue); // NPSH sempre positivo
        case 'rendimento_curva':
            // Rendimento diminui drasticamente em vazões muito altas
            const maxFlow = Math.max(...data.vazao_data);
            const overFlowRatio = flow / maxFlow;
            const penaltyFactor = Math.max(0.1, 1 / Math.pow(overFlowRatio, 0.5));
            return Math.max(0, Math.min(extrapolatedValue * penaltyFactor, data.rendimento_percent));
        default:
            return extrapolatedValue;
    }
}

// Dados das bombas com curvas mais realísticas e range estendido
const pumpData = {
    "BC-21 R 1/2 (3 CV)": {
        potencia_cv: 3,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 57.05,
        vazao_data: linspace(0, 60, 150), // Aumentado o range
        get altura_data() {
            // Curva H-Q mais realística: parabólica decrescente
            return this.vazao_data.map(q => {
                const h0 = 32; // Altura de shutoff
                const qMax = 50; // Vazão onde altura chega próximo de zero
                return Math.max(0, h0 * (1 - Math.pow(q / qMax, 1.8)));
            });
        },
        get potencia_data() {
            // Curva de potência crescente com a vazão
            return this.vazao_data.map(q => {
                const p0 = 0.8; // Potência mínima
                return p0 + (q / 42) * 2.2 + 0.001 * q * q;
            });
        },
        get npsh_curva() {
            // NPSH cresce com a vazão
            return this.vazao_data.map(q => 1.5 + (q / 42) * 2.5 + 0.0008 * q * q);
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
        vazao_data: linspace(0, 70, 150), // Aumentado o range
        get altura_data() {
            return this.vazao_data.map(q => {
                const h0 = 42; // Altura de shutoff
                const qMax = 60; // Vazão onde altura chega próximo de zero
                return Math.max(0, h0 * (1 - Math.pow(q / qMax, 1.8)));
            });
        },
        get potencia_data() {
            return this.vazao_data.map(q => {
                const p0 = 1.2;
                return p0 + (q / 50) * 2.8 + 0.0008 * q * q;
            });
        },
        get npsh_curva() {
            return this.vazao_data.map(q => 1.8 + (q / 50) * 2.2 + 0.0006 * q * q);
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
        vazao_data: linspace(0, 180, 150), // Aumentado o range
        get altura_data() {
            return this.vazao_data.map(q => {
                const h0 = 65; // Altura de shutoff
                const qMax = 150; // Vazão onde altura chega próximo de zero
                return Math.max(0, h0 * (1 - Math.pow(q / qMax, 1.6)));
            });
        },
        get potencia_data() {
            return this.vazao_data.map(q => {
                const p0 = 12;
                return p0 + (q / 120) * 34.5 + 0.002 * q * q;
            });
        },
        get npsh_curva() {
            return this.vazao_data.map(q => 15 + (q / 120) * 20 + 0.001 * q * q);
        },
        get rendimento_curva() {
            return generateEfficiencyCurve(this.vazao_data, 75, 75);
        }
    }
};

let chart;
let operatingPointDatasets = [];

// Função de interpolação linear melhorada
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
                        padding: 20,
                        filter: function(legendItem, chartData) {
                            // Ocultar legendas vazias dos pontos de operação
                            return legendItem.text !== '';
                        }
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
                    },
                    min: 0
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
                    },
                    min: 0
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
                    },
                    min: 0
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
                    offset: true,
                    min: 0
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
                    offset: true,
                    min: 0
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
            pointHoverRadius: 4,
            borderWidth: 2
        },
        {
            label: 'Potência (CV)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.potencia_data[i]})),
            borderColor: 'blue',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            yAxisID: 'y1',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
        },
        {
            label: 'NPSH (mca)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.npsh_curva[i]})),
            borderColor: 'green',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            yAxisID: 'y2',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
        },
        {
            label: 'Rendimento (%)',
            data: data.vazao_data.map((x, i) => ({x: x, y: data.rendimento_curva[i]})),
            borderColor: 'purple',
            backgroundColor: 'rgba(128, 0, 128, 0.1)',
            yAxisID: 'y3',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
        }
    ];
    
    chart.data.datasets = datasets;
    chart.update();
}

function calculateOperatingPoint() {
    clearOperatingPoint();
    
    const flowInput = document.getElementById('flowInput').value;
    const headInput = document.getElementById('headInput').value;
    
    if (flowInput === '' || headInput === '') {
        showStatus("Erro: Insira valores para vazão e altura.", "error");
        return;
    }
    
    try {
        const flowVal = parseFloat(flowInput);
        const headVal = parseFloat(headInput);
        const selectedPump = document.getElementById('pumpSelect').value;
        const data = pumpData[selectedPump];
        
        if (isNaN(flowVal) || isNaN(headVal)) {
            showStatus("Erro: Valores inválidos inseridos.", "error");
            return;
        }
        
        // Permitir valores baixos e zero
        if (flowVal < 0 || headVal < 0) {
            showStatus("Erro: Valores não podem ser negativos.", "error");
            return;
        }
        
        let warningMessage = "";
        
        // Calcular valores nas curvas da bomba para a vazão especificada
        let powerFromCurve, effFromCurve, npshFromCurve, headFromCurve;
        
        if (flowVal === 0) {
            // Condições especiais para vazão zero (shutoff)
            powerFromCurve = data.potencia_data[0]; // Potência no shutoff
            effFromCurve = 0; // Rendimento zero em shutoff
            npshFromCurve = data.npsh_curva[0]; // NPSH mínimo
            headFromCurve = data.altura_data[0]; // Altura de shutoff
        } else {
            // Para vazões altas, usar função de cálculo estendida
            powerFromCurve = calculateCurveValue(flowVal, selectedPump, 'potencia_data');
            effFromCurve = calculateCurveValue(flowVal, selectedPump, 'rendimento_curva');
            npshFromCurve = calculateCurveValue(flowVal, selectedPump, 'npsh_curva');
            headFromCurve = calculateCurveValue(flowVal, selectedPump, 'altura_data');
        }
        
        // Verificações e avisos
        const maxFlowInData = Math.max(...data.vazao_data);
        const maxHeadInData = Math.max(...data.altura_data);
        
        if (flowVal > maxFlowInData * 1.5) {
            warningMessage += "Vazão muito alta - operação fora da faixa recomendada. ";
        } else if (flowVal > maxFlowInData) {
            warningMessage += "Vazão acima da faixa de dados - valores extrapolados. ";
        }
        
        if (headVal > maxHeadInData * 1.2) {
            warningMessage += "Altura muito alta para esta bomba. ";
        }
        
        // Avisos específicos para valores muito baixos
        if (flowVal > 0 && flowVal < maxFlowInData * 0.05) {
            warningMessage += "Vazão muito baixa - verifique se é adequada para a aplicação. ";
        }
        
        if (headVal > 0 && headVal < maxHeadInData * 0.05) {
            warningMessage += "Altura muito baixa - verifique se é adequada para a aplicação. ";
        }
        
        // Verificar se o ponto está próximo da curva característica (apenas se não for zero)
        if (flowVal > 0 && headVal > 0) {
            const headDifference = Math.abs(headVal - headFromCurve);
            const headTolerance = Math.max(headFromCurve * 0.3, 5); // 30% de tolerância ou mínimo 5m
            
            if (headDifference > headTolerance) {
                warningMessage += `Ponto distante da curva característica (altura esperada: ${headFromCurve.toFixed(2)}m). `;
            }
        }
        
        // Mensagens específicas para condições especiais
        if (flowVal === 0 && headVal === 0) {
            warningMessage += "Condição de parada total - bomba desligada. ";
        } else if (flowVal === 0) {
            warningMessage += "Condição de shutoff - válvula fechada. ";
        } else if (headVal === 0) {
            warningMessage += "Condição de descarga livre - sem pressão. ";
        }
        
        // Avisos para vazões muito altas
        if (flowVal > maxFlowInData * 2) {
            warningMessage += "ATENÇÃO: Vazão extremamente alta - bomba pode não conseguir operar nesta condição. ";
        }
        
        if (warningMessage) {
            showStatus("Aviso: " + warningMessage.trim(), "warning");
        } else {
            showStatus("Ponto de operação calculado com sucesso.", "success");
        }
        
        // Usar os valores das curvas da bomba para mostrar os pontos corretos no gráfico
        updateOperatingPointDisplay(flowVal, headVal, powerFromCurve, effFromCurve, npshFromCurve, headFromCurve);
        
    } catch (error) {
        showStatus("Erro: Falha no cálculo do ponto de operação.", "error");
    }
}

function updateOperatingPointDisplay(flow, userHead, power, efficiency, npshRequired, curveHead) {
    clearOperatingPoint();
    
    // Ajustar escala do gráfico se necessário para vazões altas
    const currentMaxX = chart.scales.x.max || 0;
    if (flow > currentMaxX) {
        chart.options.scales.x.max = flow * 1.1;
    }
    
    // Adicionar pontos de operação ao gráfico
    // Ponto do usuário (altura especificada pelo usuário)
    const userPoint = {
        label: 'Ponto Especificado',
        data: [{x: flow, y: userHead}],
        borderColor: 'red',
        backgroundColor: 'red',
        yAxisID: 'y',
        pointRadius: 10,
        pointHoverRadius: 12,
        showLine: false,
        pointBorderWidth: 3,
        pointBorderColor: 'darkred',
        pointStyle: 'circle'
    };
    
    // Pontos nas curvas da bomba (valores reais das curvas)
    const curvePoints = [
        {
            label: 'Ponto na Curva H-Q',
            data: [{x: flow, y: curveHead}],
            borderColor: 'black',
            backgroundColor: 'yellow',
            yAxisID: 'y',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        },
        {
            label: '',
            data: [{x: flow, y: power}],
            borderColor: 'black',
            backgroundColor: 'yellow',
            yAxisID: 'y1',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        },
        {
            label: '',
            data: [{x: flow, y: npshRequired}],
            borderColor: 'black',
            backgroundColor: 'yellow',
            yAxisID: 'y2',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        },
        {
            label: '',
            data: [{x: flow, y: efficiency}],
            borderColor: 'black',
            backgroundColor: 'yellow',
            yAxisID: 'y3',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        }
    ];
    
    // Adicionar linha vertical para mostrar a vazão
    const maxY = Math.max(curveHead, userHead, power, efficiency, npshRequired);
    const verticalLine = {
        label: '',
        data: [
            {x: flow, y: 0},
            {x: flow, y: maxY * 1.1}
        ],
        borderColor: 'rgba(128, 128, 128, 0.5)',
        backgroundColor: 'transparent',
        yAxisID: 'y',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        showLine: true,
        fill: false
    };
    
    operatingPointDatasets = [userPoint, ...curvePoints, verticalLine];
    chart.data.datasets = [...chart.data.datasets.slice(0, 4), ...operatingPointDatasets];
    
    // Atualizar resultados com valores das curvas da bomba
    document.getElementById('flowResult').textContent = `Vazão (m³/h): ${flow.toFixed(2)}`;
    document.getElementById('headResult').textContent = `Altura Especificada (m): ${userHead.toFixed(2)} | Altura da Curva (m): ${curveHead.toFixed(2)}`;
    document.getElementById('powerResult').textContent = `Potência da Curva (CV): ${power.toFixed(3)}`;
    document.getElementById('efficiencyResult').textContent = `Rendimento da Curva (%): ${efficiency.toFixed(2)}`;
    
    chart.update();
}

function clearOperatingPoint() {
    if (operatingPointDatasets.length > 0) {
        chart.data.datasets = chart.data.datasets.slice(0, 4);
        operatingPointDatasets = [];
        chart.update();
    }
}

function clearAll() {
    document.getElementById('flowInput').value = '';
    document.getElementById('headInput').value = '';
    
    clearOperatingPoint();
    clearResults();
    
    // Resetar escala do gráfico
    chart.options.scales.x.max = undefined;
    chart.update();
}

function clearResults() {
    document.getElementById('flowResult').textContent = 'Vazão (m³/h): -';
    document.getElementById('headResult').textContent = 'Altura (m): -';
    document.getElementById('powerResult').textContent = 'Potência Resultante (CV): -';
    document.getElementById('efficiencyResult').textContent = 'Rendimento no Ponto (%): -';
    document.getElementById('statusResult').textContent = '';
    document.getElementById('statusResult').className = 'status-message';
}

function showStatus(message, type) {
    const statusElement = document.getElementById('statusResult');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}