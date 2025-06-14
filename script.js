// Função para gerar curva de rendimento
function generateEfficiencyCurve(flowData, bepFlow, maxEfficiency) {
    return flowData.map(flow => {
        const normalizedFlow = flow / bepFlow;
        // Curva de rendimento mais realística com pico no BEP
        const efficiency = maxEfficiency * (1 - 0.8 * Math.pow(normalizedFlow - 1, 2));
        return Math.max(0, Math.min(efficiency, maxEfficiency));
    });
}

// Função para gerar dados de vazão
function linspace(start, stop, num) {
    const step = (stop - start) / (num - 1);
    return Array.from({length: num}, (_, i) => start + step * i);
}

// Função para calcular faixas dinâmicas
function calculateDynamicRanges(data) {
    const maxFlow = Math.max(...data.vazao_data);
    const minFlow = Math.min(...data.vazao_data);
    const maxHeight = Math.max(...data.altura_data);
    const minHeight = Math.min(...data.altura_data);
    
    return {
        flowRange: {
            min: minFlow,
            max: maxFlow,
            recommended: {
                min: maxFlow * 0.1, // 10% da vazão máxima
                max: maxFlow * 0.9   // 90% da vazão máxima
            }
        },
        heightRange: {
            min: minHeight,
            max: maxHeight,
            recommended: {
                min: maxHeight * 0.1, // 10% da altura máxima
                max: maxHeight * 0.9   // 90% da altura máxima
            }
        }
    };
}

// Função para estender curvas além da faixa normal (para visualização)
function extendCurveData(data, targetFlow, targetHead) {
    const originalMaxFlow = Math.max(...data.vazao_data);
    const originalMaxHead = Math.max(...data.altura_data);
    
    // Determinar nova faixa necessária
    const newMaxFlow = Math.max(originalMaxFlow, targetFlow * 1.2);
    const newMaxHead = Math.max(originalMaxHead, targetHead * 1.2);
    
    // Se não precisa estender, retorna dados originais
    if (newMaxFlow <= originalMaxFlow && newMaxHead <= originalMaxHead) {
        return data;
    }
    
    // Criar nova faixa de vazão estendida
    const extendedFlowData = linspace(0, newMaxFlow, 150);
    
    // Estender curvas usando extrapolação
    const extendedHeightData = extendedFlowData.map(q => {
        if (q <= originalMaxFlow) {
            // Interpolar dentro da faixa original
            return interp(q, data.vazao_data, data.altura_data);
        } else {
            // Extrapolar além da faixa (altura decresce mais rapidamente)
            const lastFlow = data.vazao_data[data.vazao_data.length - 1];
            const lastHeight = data.altura_data[data.altura_data.length - 1];
            const secondLastHeight = data.altura_data[data.altura_data.length - 2];
            const slope = (lastHeight - secondLastHeight) / (data.vazao_data[data.vazao_data.length - 1] - data.vazao_data[data.vazao_data.length - 2]);
            
            // Aplicar decaimento exponencial para altura
            const extraFlow = q - lastFlow;
            const decayFactor = Math.exp(-extraFlow / (originalMaxFlow * 0.3));
            return Math.max(0, lastHeight * decayFactor);
        }
    });
    
    const extendedPowerData = extendedFlowData.map(q => {
        if (q <= originalMaxFlow) {
            return interp(q, data.vazao_data, data.potencia_data);
        } else {
            // Potência continua crescendo linearmente
            const lastPower = data.potencia_data[data.potencia_data.length - 1];
            const secondLastPower = data.potencia_data[data.potencia_data.length - 2];
            const slope = (lastPower - secondLastPower) / (data.vazao_data[data.vazao_data.length - 1] - data.vazao_data[data.vazao_data.length - 2]);
            const extraFlow = q - originalMaxFlow;
            return lastPower + slope * extraFlow;
        }
    });
    
    const extendedNPSHData = extendedFlowData.map(q => {
        if (q <= originalMaxFlow) {
            return interp(q, data.vazao_data, data.npsh_curva);
        } else {
            // NPSH cresce quadraticamente
            const lastNPSH = data.npsh_curva[data.npsh_curva.length - 1];
            const extraFlow = q - originalMaxFlow;
            return lastNPSH + 0.001 * extraFlow * extraFlow;
        }
    });
    
    const extendedEfficiencyData = extendedFlowData.map(q => {
        if (q <= originalMaxFlow) {
            return interp(q, data.vazao_data, data.rendimento_curva);
        } else {
            // Rendimento decresce rapidamente fora da faixa
            const extraFlow = q - originalMaxFlow;
            const decayFactor = Math.exp(-extraFlow / (originalMaxFlow * 0.2));
            return Math.max(0, data.rendimento_percent * 0.1 * decayFactor);
        }
    });
    
    return {
        ...data,
        vazao_data: extendedFlowData,
        altura_data: extendedHeightData,
        potencia_data: extendedPowerData,
        npsh_curva: extendedNPSHData,
        rendimento_curva: extendedEfficiencyData
    };
}

// Dados das bombas com curvas mais realísticas
const pumpData = {
    "BC-21 R 1/2 (3 CV)": {
        potencia_cv: 3,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 57.05,
        vazao_data: linspace(0, 42, 100),
        get altura_data() {
            // Curva H-Q mais realística: parabólica decrescente
            return this.vazao_data.map(q => {
                const h0 = 32; // Altura de shutoff
                const qMax = 45; // Vazão máxima teórica
                return h0 * (1 - Math.pow(q / qMax, 1.8));
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
        },
        get ranges() {
            return calculateDynamicRanges(this);
        }
    },
    "BC-21 R 1/2 (4 CV)": {
        potencia_cv: 4,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 54.68,
        vazao_data: linspace(0, 50, 100),
        get altura_data() {
            return this.vazao_data.map(q => {
                const h0 = 42; // Altura de shutoff
                const qMax = 55; // Vazão máxima teórica
                return h0 * (1 - Math.pow(q / qMax, 1.8));
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
        },
        get ranges() {
            return calculateDynamicRanges(this);
        }
    },
    "Bomba Trabalho": {
        potencia_cv: 46.5,
        rotacao_rpm: 1700,
        npsh_mca: 25,
        rendimento_percent: 75,
        vazao_data: linspace(0, 120, 100),
        get altura_data() {
            return this.vazao_data.map(q => {
                const h0 = 65; // Altura de shutoff
                const qMax = 130; // Vazão máxima teórica
                return h0 * (1 - Math.pow(q / qMax, 1.6));
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
        },
        get ranges() {
            return calculateDynamicRanges(this);
        }
    }
};

let chart;
let operatingPointDatasets = [];
let currentExtendedData = null;

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

// Função para validar valores com base nas faixas dinâmicas
function validateInputs(flowVal, headVal, ranges) {
    let warnings = [];
    let errors = [];
    
    // Validação de vazão
    if (flowVal < 0) {
        errors.push("Vazão não pode ser negativa.");
    } else if (flowVal > ranges.flowRange.max * 2) {
        warnings.push(`Vazão muito alta (máximo da bomba: ${ranges.flowRange.max.toFixed(1)} m³/h).`);
    } else if (flowVal > ranges.flowRange.max) {
        warnings.push(`Vazão acima da faixa da bomba (máximo: ${ranges.flowRange.max.toFixed(1)} m³/h).`);
    } else if (flowVal > 0 && flowVal < ranges.flowRange.recommended.min) {
        warnings.push(`Vazão muito baixa (mínimo recomendado: ${ranges.flowRange.recommended.min.toFixed(1)} m³/h).`);
    }
    
    // Validação de altura
    if (headVal < 0) {
        errors.push("Altura não pode ser negativa.");
    } else if (headVal > ranges.heightRange.max * 2) {
        warnings.push(`Altura muito alta (máximo da bomba: ${ranges.heightRange.max.toFixed(1)} m).`);
    } else if (headVal > ranges.heightRange.max) {
        warnings.push(`Altura acima da faixa da bomba (máximo: ${ranges.heightRange.max.toFixed(1)} m).`);
    } else if (headVal > 0 && headVal < ranges.heightRange.recommended.min) {
        warnings.push(`Altura muito baixa (mínimo recomendado: ${ranges.heightRange.recommended.min.toFixed(1)} m).`);
    }
    
    return { warnings, errors };
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
    
    // Reset para dados originais
    currentExtendedData = null;
    
    plotCurves();
    updateScales();
}

function updateScales(targetFlow = null, targetHead = null) {
    const selectedPump = document.getElementById('pumpSelect').value;
    const data = currentExtendedData || pumpData[selectedPump];
    
    // Calcular escalas baseadas nos dados atuais e pontos de operação
    let maxFlow = Math.max(...data.vazao_data);
    let maxHeight = Math.max(...data.altura_data);
    let maxPower = Math.max(...data.potencia_data);
    let maxNPSH = Math.max(...data.npsh_curva);
    let maxEfficiency = Math.max(...data.rendimento_curva);
    
    // Ajustar escalas se houver pontos de operação
    if (targetFlow !== null) {
        maxFlow = Math.max(maxFlow, targetFlow * 1.1);
    }
    if (targetHead !== null) {
        maxHeight = Math.max(maxHeight, targetHead * 1.1);
    }
    
    // Atualizar escalas do gráfico
    chart.options.scales.x.max = maxFlow * 1.05;
    chart.options.scales.y.max = maxHeight * 1.05;
    chart.options.scales.y1.max = maxPower * 1.05;
    chart.options.scales.y2.max = maxNPSH * 1.05;
    chart.options.scales.y3.max = Math.max(maxEfficiency * 1.05, 100);
    
    chart.update('none'); // Update sem animação para melhor performance
}

function plotCurves(extendedData = null) {
    const selectedPump = document.getElementById('pumpSelect').value;
    const data = extendedData || pumpData[selectedPump];
    
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
        const originalData = pumpData[selectedPump];
        const ranges = originalData.ranges;
        
        if (isNaN(flowVal) || isNaN(headVal)) {
            showStatus("Erro: Valores inválidos inseridos.", "error");
            return;
        }
        
        // Validar entradas com faixas dinâmicas
        const validation = validateInputs(flowVal, headVal, ranges);
        
        if (validation.errors.length > 0) {
            showStatus("Erro: " + validation.errors.join(" "), "error");
            return;
        }
        
        // Verificar se precisa estender as curvas
        const needsExtension = flowVal > Math.max(...originalData.vazao_data) || 
                              headVal > Math.max(...originalData.altura_data);
        
        let dataToUse = originalData;
        if (needsExtension) {
            // Estender curvas para incluir o ponto de operação
            dataToUse = extendCurveData(originalData, flowVal, headVal);
            currentExtendedData = dataToUse;
            
            // Replotar com dados estendidos
            plotCurves(dataToUse);
        }
        
        // Calcular valores nas curvas da bomba para a vazão especificada
        let powerFromCurve, effFromCurve, npshFromCurve, headFromCurve;
        
        if (flowVal === 0) {
            // Condições especiais para vazão zero (shutoff)
            powerFromCurve = dataToUse.potencia_data[0]; // Potência no shutoff
            effFromCurve = 0; // Rendimento zero em shutoff
            npshFromCurve = dataToUse.npsh_curva[0]; // NPSH mínimo
            headFromCurve = dataToUse.altura_data[0]; // Altura de shutoff
        } else {
            // Interpolar valores das curvas para a vazão especificada
            powerFromCurve = interp(flowVal, dataToUse.vazao_data, dataToUse.potencia_data);
            effFromCurve = interp(flowVal, dataToUse.vazao_data, dataToUse.rendimento_curva);
            npshFromCurve = interp(flowVal, dataToUse.vazao_data, dataToUse.npsh_curva);
            headFromCurve = interp(flowVal, dataToUse.vazao_data, dataToUse.altura_data);
        }
        
        let warningMessage = validation.warnings.join(" ");
        
        // Verificar se o ponto está próximo da curva característica (apenas se não for zero)
        if (flowVal > 0 && headVal > 0) {
            const headDifference = Math.abs(headVal - headFromCurve);
            const headTolerance = Math.max(headFromCurve * 0.2, 3); // 20% de tolerância ou mínimo 3m
            
            if (headDifference > headTolerance) {
                warningMessage += ` Ponto distante da curva característica (altura esperada: ${headFromCurve.toFixed(2)}m).`;
            }
        }
        
        // Mensagens específicas para condições especiais
        if (flowVal === 0 && headVal === 0) {
            warningMessage += " Condição de parada total - bomba desligada.";
        } else if (flowVal === 0) {
            warningMessage += " Condição de shutoff - válvula fechada.";
        } else if (headVal === 0) {
            warningMessage += " Condição de descarga livre - sem pressão.";
        }
        
        if (warningMessage.trim()) {
            showStatus("Aviso: " + warningMessage.trim(), "warning");
        } else {
            showStatus("Ponto de operação calculado com sucesso.", "success");
        }
        
        // Atualizar escalas e exibir ponto de operação
        updateScales(flowVal, headVal);
        updateOperatingPointDisplay(flowVal, headVal, powerFromCurve, effFromCurve, npshFromCurve, headFromCurve);
        
    } catch (error) {
        showStatus("Erro: Falha no cálculo do ponto de operação.", "error");
        console.error("Erro no cálculo:", error);
    }
}

function updateOperatingPointDisplay(flow, userHead, power, efficiency, npshRequired, curveHead) {
    clearOperatingPoint();
    
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
    const verticalLine = {
        label: '',
        data: [
            {x: flow, y: 0},
            {x: flow, y: Math.max(curveHead, userHead) * 1.1}
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
    
    // Reset para dados originais
    currentExtendedData = null;
    plotCurves();
    updateScales();
    
    clearOperatingPoint();
    clearResults();
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