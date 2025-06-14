// Função para gerar curva de rendimento realística
function generateEfficiencyCurve(flowData, bepFlow, maxEfficiency) {
    return flowData.map(flow => {
        if (flow === 0) return 0; // Rendimento zero em shutoff
        
        const normalizedFlow = flow / bepFlow;
        // Curva de rendimento mais realística baseada em bombas centrífugas reais
        let efficiency;
        
        if (normalizedFlow <= 0.3) {
            // Região de baixa vazão - rendimento baixo
            efficiency = maxEfficiency * (normalizedFlow / 0.3) * 0.4;
        } else if (normalizedFlow <= 1.2) {
            // Região operacional normal - curva parabólica com pico no BEP
            const deviation = Math.abs(normalizedFlow - 1);
            efficiency = maxEfficiency * (1 - 0.6 * Math.pow(deviation, 1.5));
        } else {
            // Região de alta vazão - queda mais acentuada
            efficiency = maxEfficiency * (1 - 0.8 * Math.pow(normalizedFlow - 1, 2));
        }
        
        return Math.max(0, Math.min(efficiency, maxEfficiency));
    });
}

// Função para gerar dados de vazão
function linspace(start, stop, num) {
    const step = (stop - start) / (num - 1);
    return Array.from({length: num}, (_, i) => start + step * i);
}

// Dados das bombas com curvas características realísticas baseadas em bombas reais
const pumpData = {
    "BC-21 R 1/2 (3 CV)": {
        potencia_cv: 3,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 57.05,
        vazao_data: linspace(0, 42, 150), // Mais pontos para maior precisão
        get altura_data() {
            // Curva H-Q típica de bomba centrífuga - parabólica decrescente
            return this.vazao_data.map(q => {
                if (q === 0) return 32; // Altura de shutoff
                const h0 = 32; // Altura de shutoff (m)
                const qNom = 25; // Vazão nominal (m³/h)
                const hNom = 28; // Altura nominal (m)
                
                // Curva parabólica realística
                const a = (h0 - hNom) / Math.pow(qNom, 2);
                const altura = h0 - a * Math.pow(q, 2);
                return Math.max(0, altura);
            });
        },
        get potencia_data() {
            // Curva de potência crescente típica de bomba centrífuga
            return this.vazao_data.map(q => {
                if (q === 0) return 0.6; // Potência mínima em shutoff
                const p0 = 0.6; // Potência em shutoff
                const qMax = 42; // Vazão máxima
                const pMax = 3.2; // Potência máxima
                
                // Curva cúbica típica para potência
                const potencia = p0 + (pMax - p0) * Math.pow(q / qMax, 2.2);
                return Math.min(potencia, pMax);
            });
        },
        get npsh_curva() {
            // NPSH requerido cresce com a vazão (típico de bombas centrífugas)
            return this.vazao_data.map(q => {
                const npshMin = 1.2; // NPSH mínimo
                const qMax = 42;
                const npshMax = 4.5; // NPSH máximo
                
                // Curva exponencial para NPSH
                const npsh = npshMin + (npshMax - npshMin) * Math.pow(q / qMax, 1.8);
                return Math.min(npsh, npshMax);
            });
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
        vazao_data: linspace(0, 50, 150),
        get altura_data() {
            return this.vazao_data.map(q => {
                if (q === 0) return 42; // Altura de shutoff
                const h0 = 42;
                const qNom = 30; // Vazão nominal
                const hNom = 36; // Altura nominal
                
                const a = (h0 - hNom) / Math.pow(qNom, 2);
                const altura = h0 - a * Math.pow(q, 2);
                return Math.max(0, altura);
            });
        },
        get potencia_data() {
            return this.vazao_data.map(q => {
                if (q === 0) return 0.8; // Potência mínima em shutoff
                const p0 = 0.8;
                const qMax = 50;
                const pMax = 4.2;
                
                const potencia = p0 + (pMax - p0) * Math.pow(q / qMax, 2.1);
                return Math.min(potencia, pMax);
            });
        },
        get npsh_curva() {
            return this.vazao_data.map(q => {
                const npshMin = 1.5;
                const qMax = 50;
                const npshMax = 5.0;
                
                const npsh = npshMin + (npshMax - npshMin) * Math.pow(q / qMax, 1.7);
                return Math.min(npsh, npshMax);
            });
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
        vazao_data: linspace(0, 120, 150),
        get altura_data() {
            return this.vazao_data.map(q => {
                if (q === 0) return 65; // Altura de shutoff
                const h0 = 65;
                const qNom = 75; // Vazão nominal (BEP)
                const hNom = 55; // Altura nominal
                
                // Curva mais suave para bomba de grande porte
                const a = (h0 - hNom) / Math.pow(qNom, 1.9);
                const altura = h0 - a * Math.pow(q, 1.9);
                return Math.max(0, altura);
            });
        },
        get potencia_data() {
            return this.vazao_data.map(q => {
                if (q === 0) return 8; // Potência mínima em shutoff
                const p0 = 8;
                const qMax = 120;
                const pMax = 48;
                
                // Curva mais linear para bomba de grande porte
                const potencia = p0 + (pMax - p0) * Math.pow(q / qMax, 1.8);
                return Math.min(potencia, pMax);
            });
        },
        get npsh_curva() {
            return this.vazao_data.map(q => {
                const npshMin = 12; // NPSH mínimo mais alto para bomba grande
                const qMax = 120;
                const npshMax = 35;
                
                // Curva mais suave para bomba de baixa rotação
                const npsh = npshMin + (npshMax - npshMin) * Math.pow(q / qMax, 1.5);
                return Math.min(npsh, npshMax);
            });
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
    
    // Busca binária para melhor performance
    let left = 0;
    let right = xp.length - 1;
    
    while (right - left > 1) {
        const mid = Math.floor((left + right) / 2);
        if (xp[mid] <= x) {
            left = mid;
        } else {
            right = mid;
        }
    }
    
    const t = (x - xp[left]) / (xp[right] - xp[left]);
    return fp[left] + t * (fp[right] - fp[left]);
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
                        size: 16,
                        weight: 'bold'
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
                        text: 'Vazão - Q (m³/h)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    min: 0
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Altura (m)',
                        color: 'red',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
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
                        color: 'blue',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
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
                        color: 'green',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
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
                        color: 'purple',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: 'purple'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    offset: true,
                    min: 0,
                    max: 100
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
            borderWidth: 3,
            tension: 0.1 // Suavização da curva
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
            borderWidth: 3,
            tension: 0.1
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
            borderWidth: 3,
            tension: 0.1
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
            borderWidth: 3,
            tension: 0.1
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
        
        // Verificar se os valores estão dentro da faixa da bomba
        const maxFlow = Math.max(...data.vazao_data);
        const maxHead = Math.max(...data.altura_data);
        
        let warningMessage = "";
        
        // Avisos para valores fora da faixa operacional
        if (flowVal > maxFlow * 1.1) {
            warningMessage += "Vazão muito alta para esta bomba. ";
        } else if (flowVal > maxFlow * 0.9) {
            warningMessage += "Vazão próxima ao limite máximo da bomba. ";
        }
        
        if (headVal > maxHead * 1.1) {
            warningMessage += "Altura muito alta para esta bomba. ";
        }
        
        // Calcular valores nas curvas da bomba para a vazão especificada
        let powerFromCurve, effFromCurve, npshFromCurve, headFromCurve;
        
        if (flowVal === 0) {
            // Condições especiais para vazão zero (shutoff)
            powerFromCurve = data.potencia_data[0];
            effFromCurve = 0;
            npshFromCurve = data.npsh_curva[0];
            headFromCurve = data.altura_data[0];
        } else {
            // Interpolar valores das curvas para a vazão especificada
            powerFromCurve = interp(flowVal, data.vazao_data, data.potencia_data);
            effFromCurve = interp(flowVal, data.vazao_data, data.rendimento_curva);
            npshFromCurve = interp(flowVal, data.vazao_data, data.npsh_curva);
            headFromCurve = interp(flowVal, data.vazao_data, data.altura_data);
        }
        
        // Verificar se o ponto está próximo da curva característica
        if (flowVal > 0 && headVal > 0) {
            const headDifference = Math.abs(headVal - headFromCurve);
            const headTolerance = Math.max(headFromCurve * 0.15, 2); // 15% de tolerância ou mínimo 2m
            
            if (headDifference > headTolerance) {
                warningMessage += `Ponto distante da curva H-Q (altura da curva: ${headFromCurve.toFixed(2)}m). `;
            }
        }
        
        // Verificações de eficiência operacional
        if (effFromCurve < data.rendimento_percent * 0.7) {
            warningMessage += "Rendimento baixo neste ponto de operação. ";
        }
        
        // Verificação de NPSH
        if (npshFromCurve > data.npsh_mca * 1.5) {
            warningMessage += "NPSH requerido alto - verificar cavitação. ";
        }
        
        // Mensagens específicas para condições especiais
        if (flowVal === 0 && headVal === 0) {
            warningMessage += "Condição de parada total. ";
        } else if (flowVal === 0) {
            warningMessage += "Condição de shutoff - válvula fechada. ";
        } else if (headVal === 0) {
            warningMessage += "Condição de descarga livre. ";
        }
        
        if (warningMessage) {
            showStatus("Aviso: " + warningMessage.trim(), "warning");
        } else {
            showStatus("Ponto de operação dentro da faixa operacional.", "success");
        }
        
        updateOperatingPointDisplay(flowVal, headVal, powerFromCurve, effFromCurve, npshFromCurve, headFromCurve);
        
    } catch (error) {
        showStatus("Erro: Falha no cálculo do ponto de operação.", "error");
    }
}

function updateOperatingPointDisplay(flow, userHead, power, efficiency, npshRequired, curveHead) {
    clearOperatingPoint();
    
    // Ponto especificado pelo usuário (vermelho)
    const userPoint = {
        label: 'Ponto Especificado',
        data: [{x: flow, y: userHead}],
        borderColor: 'red',
        backgroundColor: 'red',
        yAxisID: 'y',
        pointRadius: 12,
        pointHoverRadius: 14,
        showLine: false,
        pointBorderWidth: 3,
        pointBorderColor: 'darkred',
        pointStyle: 'circle'
    };
    
    // Pontos nas curvas da bomba (amarelo com borda preta)
    const curvePoints = [
        {
            label: 'Altura da Curva',
            data: [{x: flow, y: curveHead}],
            borderColor: 'black',
            backgroundColor: 'gold',
            yAxisID: 'y',
            pointRadius: 10,
            pointHoverRadius: 12,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        },
        {
            label: '',
            data: [{x: flow, y: power}],
            borderColor: 'black',
            backgroundColor: 'gold',
            yAxisID: 'y1',
            pointRadius: 10,
            pointHoverRadius: 12,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        },
        {
            label: '',
            data: [{x: flow, y: npshRequired}],
            borderColor: 'black',
            backgroundColor: 'gold',
            yAxisID: 'y2',
            pointRadius: 10,
            pointHoverRadius: 12,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        },
        {
            label: '',
            data: [{x: flow, y: efficiency}],
            borderColor: 'black',
            backgroundColor: 'gold',
            yAxisID: 'y3',
            pointRadius: 10,
            pointHoverRadius: 12,
            showLine: false,
            pointBorderWidth: 2,
            pointBorderColor: 'black',
            pointStyle: 'triangle'
        }
    ];
    
    // Linha vertical para mostrar a vazão
    const verticalLine = {
        label: '',
        data: [
            {x: flow, y: 0},
            {x: flow, y: Math.max(curveHead, userHead) * 1.2}
        ],
        borderColor: 'rgba(128, 128, 128, 0.6)',
        backgroundColor: 'transparent',
        yAxisID: 'y',
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        showLine: true,
        fill: false
    };
    
    operatingPointDatasets = [userPoint, ...curvePoints, verticalLine];
    chart.data.datasets = [...chart.data.datasets.slice(0, 4), ...operatingPointDatasets];
    
    // Atualizar resultados
    document.getElementById('flowResult').textContent = `Vazão (m³/h): ${flow.toFixed(2)}`;
    document.getElementById('headResult').textContent = `Altura Especificada: ${userHead.toFixed(2)}m | Altura da Curva: ${curveHead.toFixed(2)}m`;
    document.getElementById('powerResult').textContent = `Potência da Curva (CV): ${power.toFixed(3)}`;
    document.getElementById('efficiencyResult').textContent = `Rendimento da Curva (%): ${efficiency.toFixed(2)} | NPSH Requerido: ${npshRequired.toFixed(2)}mca`;
    
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