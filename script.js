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
        }
    },
    "Bomba Trabalho": {
        potencia_cv: 46.5,
        rotacao_rpm: 1700,
        npsh_mca: 25,
        rendimento_percent: 75,
        vazao_data: linspace(0, 500, 100),
        get altura_data() {
            // Curva de altura que vai até -10m no final
            return this.vazao_data.map(q => {
                // Altura inicial de 200m, chegando a -10m em 500 m³/h
                const h0 = 200; // Altura de shutoff
                const hFinal = -10; // Altura final em vazão máxima
                const qMax = 500; // Vazão máxima
                
                // Curva parabólica que vai de 200m a -10m
                const normalizedQ = q / qMax;
                return h0 + (hFinal - h0) * Math.pow(normalizedQ, 1.5);
            });
        },
        get potencia_data() {
            // Curva de potência CURVA (não reta) que vai até exatamente 46.5 CV
            return this.vazao_data.map(q => {
                const p0 = 12; // Potência inicial
                const pMax = 46.5; // Potência máxima
                const qMax = 500; // Vazão máxima
                
                // Curva quadrática crescente até 46.5 CV
                const normalizedQ = q / qMax;
                return p0 + (pMax - p0) * (0.3 * normalizedQ + 0.7 * normalizedQ * normalizedQ);
            });
        },
        get npsh_curva() {
            // NPSH CURVA (não reta) que tem pico de 25 mca
            return this.vazao_data.map(q => {
                const npshMin = 15; // NPSH mínimo
                const npshMax = 25; // NPSH máximo (pico)
                const qPico = 300; // Vazão onde ocorre o pico
                const qMax = 500; // Vazão máxima
                
                if (q <= qPico) {
                    // Crescimento curvo até o pico
                    const normalizedQ = q / qPico;
                    return npshMin + (npshMax - npshMin) * (0.5 * normalizedQ + 0.5 * normalizedQ * normalizedQ);
                } else {
                    // Decrescimento curvo após o pico
                    const normalizedQ = (q - qPico) / (qMax - qPico);
                    const decrescimento = 0.4 * normalizedQ + 0.1 * normalizedQ * normalizedQ;
                    return npshMax - (npshMax - npshMin) * 0.4 * decrescimento;
                }
            });
        },
        get rendimento_curva() {
            return generateEfficiencyCurve(this.vazao_data, 300, 75);
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

// Aguardar o carregamento completo da página
function initializeSystem() {
    console.log('Inicializando sistema...');
    
    const ctx = document.getElementById('pumpChart');
    if (!ctx) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    console.log('Canvas encontrado, criando gráfico...');
    
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
                        color: 'red',
                        stepSize: 20 // Força intervalos de 20 em 20
                    },
                    grid: {
                        display: true
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
    
    console.log('Gráfico criado com sucesso!');
    
    // Event listeners
    const pumpSelect = document.getElementById('pumpSelect');
    if (pumpSelect) {
        pumpSelect.addEventListener('change', onPumpSelect);
        console.log('Event listener adicionado ao select');
    }
    
    // Inicializar com a primeira bomba
    onPumpSelect();
    console.log('Sistema inicializado completamente!');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, aguardando Chart.js...');
    
    // Verificar se Chart.js está carregado
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js já carregado');
        initializeSystem();
    } else {
        console.log('Aguardando Chart.js...');
        // Aguardar um pouco para o Chart.js carregar
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js carregado após timeout');
                initializeSystem();
            } else {
                console.error('Chart.js não foi carregado!');
                // Tentar carregar Chart.js dinamicamente
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
                script.onload = () => {
                    console.log('Chart.js carregado dinamicamente');
                    initializeSystem();
                };
                document.head.appendChild(script);
            }
        }, 1000);
    }
});

function onPumpSelect() {
    console.log('Bomba selecionada');
    clearResults();
    const selectedPump = document.getElementById('pumpSelect').value;
    const data = pumpData[selectedPump];
    
    console.log('Dados da bomba:', data);
    
    // Atualizar informações da bomba
    const powerInfo = document.getElementById('powerInfo');
    const rotationInfo = document.getElementById('rotationInfo');
    const npshInfo = document.getElementById('npshInfo');
    const efficiencyInfo = document.getElementById('efficiencyInfo');
    
    if (powerInfo) powerInfo.textContent = `${data.potencia_cv} CV`;
    if (rotationInfo) rotationInfo.textContent = `${data.rotacao_rpm} rpm`;
    if (npshInfo) npshInfo.textContent = `${data.npsh_mca} mca`;
    if (efficiencyInfo) efficiencyInfo.textContent = `${data.rendimento_percent}%`;
    
    console.log('Informações da bomba atualizadas');
    
    plotCurves();
}

function plotCurves() {
    if (!chart) {
        console.error('Gráfico não inicializado!');
        return;
    }
    
    const selectedPump = document.getElementById('pumpSelect').value;
    const data = pumpData[selectedPump];
    
    console.log('Plotando curvas para:', selectedPump);
    
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
    console.log('Curvas plotadas com sucesso!');
}

function calculateOperatingPoint() {
    console.log('Calculando ponto de operação...');
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
        
        console.log('Valores:', { flowVal, headVal, selectedPump });
        
        if (isNaN(flowVal) || isNaN(headVal)) {
            showStatus("Erro: Valores inválidos inseridos.", "error");
            return;
        }
        
        // Verificar se a vazão é negativa (não permitido)
        if (flowVal < 0) {
            showStatus("Erro: Vazão não pode ser negativa.", "error");
            return;
        }
        
        // Para "Bomba Trabalho", permitir altura negativa
        // Para outras bombas, não permitir altura negativa
        if (selectedPump !== "Bomba Trabalho" && headVal < 0) {
            showStatus("Erro: Altura não pode ser negativa para esta bomba.", "error");
            return;
        }
        
        // Verificar se os valores estão dentro da faixa da bomba (com tolerância para valores baixos)
        const maxFlow = Math.max(...data.vazao_data);
        const maxHead = Math.max(...data.altura_data);
        const minHead = Math.min(...data.altura_data); // Para bombas que podem ter altura negativa
        
        let warningMessage = "";
        
        // Avisos mais flexíveis para valores baixos
        if (flowVal > maxFlow * 1.2) {
            warningMessage += "Vazão muito alta para esta bomba. ";
        } else if (flowVal > maxFlow) {
            warningMessage += "Vazão acima da faixa recomendada. ";
        }
        
        // Verificar altura considerando valores negativos possíveis
        if (headVal > maxHead * 1.2) {
            warningMessage += "Altura muito alta para esta bomba. ";
        } else if (headVal > maxHead) {
            warningMessage += "Altura acima da faixa recomendada. ";
        }
        
        // Para bombas com altura negativa possível (como Bomba Trabalho)
        if (minHead < 0 && headVal < minHead * 1.2) {
            warningMessage += "Altura muito baixa para esta bomba. ";
        }
        
        // Avisos específicos para valores muito baixos
        if (flowVal > 0 && flowVal < maxFlow * 0.05) {
            warningMessage += "Vazão muito baixa - verifique se é adequada para a aplicação. ";
        }
        
        if (headVal > 0 && headVal < Math.abs(maxHead) * 0.05) {
            warningMessage += "Altura muito baixa - verifique se é adequada para a aplicação. ";
        }
        
        // Calcular valores nas curvas da bomba para a vazão especificada
        let powerFromCurve, effFromCurve, npshFromCurve, headFromCurve;
        
        if (flowVal === 0) {
            // Condições especiais para vazão zero (shutoff)
            powerFromCurve = data.potencia_data[0]; // Potência no shutoff
            effFromCurve = 0; // Rendimento zero em shutoff
            npshFromCurve = data.npsh_curva[0]; // NPSH mínimo
            headFromCurve = data.altura_data[0]; // Altura de shutoff
        } else {
            // Interpolar valores das curvas para a vazão especificada
            powerFromCurve = interp(flowVal, data.vazao_data, data.potencia_data);
            effFromCurve = interp(flowVal, data.vazao_data, data.rendimento_curva);
            npshFromCurve = interp(flowVal, data.vazao_data, data.npsh_curva);
            headFromCurve = interp(flowVal, data.vazao_data, data.altura_data);
        }
        
        console.log('Valores calculados:', { powerFromCurve, effFromCurve, npshFromCurve, headFromCurve });
        
        // Verificar se o ponto está próximo da curva característica (apenas se não for zero)
        if (flowVal > 0 && headVal !== 0) {
            const headDifference = Math.abs(headVal - headFromCurve);
            const headTolerance = Math.max(Math.abs(headFromCurve) * 0.2, 5); // 20% de tolerância ou mínimo 5m
            
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
        
        // Aviso específico para altura negativa na Bomba Trabalho
        if (selectedPump === "Bomba Trabalho" && headVal < 0) {
            warningMessage += "Operação com altura negativa (sucção) - verifique as condições de instalação. ";
        }
        
        if (warningMessage) {
            showStatus("Aviso: " + warningMessage.trim(), "warning");
        } else {
            showStatus("Ponto de operação calculado com sucesso.", "success");
        }
        
        // Usar os valores das curvas da bomba para mostrar os pontos corretos no gráfico
        updateOperatingPointDisplay(flowVal, headVal, powerFromCurve, effFromCurve, npshFromCurve, headFromCurve);
        
    } catch (error) {
        console.error("Erro no cálculo:", error);
        showStatus("Erro: Falha no cálculo do ponto de operação.", "error");
    }
}

function updateOperatingPointDisplay(flow, userHead, power, efficiency, npshRequired, curveHead) {
    if (!chart) {
        console.error('Gráfico não disponível para atualizar pontos');
        return;
    }
    
    console.log('Atualizando display do ponto de operação');
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
    const maxHeightForLine = Math.max(curveHead, userHead, 0) * 1.1;
    const minHeightForLine = Math.min(curveHead, userHead, 0) * 1.1;
    
    const verticalLine = {
        label: '',
        data: [
            {x: flow, y: minHeightForLine},
            {x: flow, y: maxHeightForLine}
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
    const flowResult = document.getElementById('flowResult');
    const headResult = document.getElementById('headResult');
    const powerResult = document.getElementById('powerResult');
    const efficiencyResult = document.getElementById('efficiencyResult');
    
    if (flowResult) flowResult.textContent = `Vazão (m³/h): ${flow.toFixed(2)}`;
    if (headResult) headResult.textContent = `Altura Especificada (m): ${userHead.toFixed(2)} | Altura da Curva (m): ${curveHead.toFixed(2)}`;
    if (powerResult) powerResult.textContent = `Potência da Curva (CV): ${power.toFixed(3)}`;
    if (efficiencyResult) efficiencyResult.textContent = `Rendimento da Curva (%): ${efficiency.toFixed(2)}`;
    
    chart.update();
    console.log('Pontos de operação atualizados no gráfico');
}

function clearOperatingPoint() {
    if (chart && operatingPointDatasets.length > 0) {
        chart.data.datasets = chart.data.datasets.slice(0, 4);
        operatingPointDatasets = [];
        chart.update();
    }
}

function clearAll() {
    const flowInput = document.getElementById('flowInput');
    const headInput = document.getElementById('headInput');
    
    if (flowInput) flowInput.value = '';
    if (headInput) headInput.value = '';
    
    clearOperatingPoint();
    clearResults();
}

function clearResults() {
    const flowResult = document.getElementById('flowResult');
    const headResult = document.getElementById('headResult');
    const powerResult = document.getElementById('powerResult');
    const efficiencyResult = document.getElementById('efficiencyResult');
    const statusResult = document.getElementById('statusResult');
    
    if (flowResult) flowResult.textContent = 'Vazão (m³/h): -';
    if (headResult) headResult.textContent = 'Altura (m): -';
    if (powerResult) powerResult.textContent = 'Potência Resultante (CV): -';
    if (efficiencyResult) efficiencyResult.textContent = 'Rendimento no Ponto (%): -';
    if (statusResult) {
        statusResult.textContent = '';
        statusResult.className = 'status-message';
    }
}

function showStatus(message, type) {
    const statusElement = document.getElementById('statusResult');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
    }
    console.log(`Status: ${type} - ${message}`);
}