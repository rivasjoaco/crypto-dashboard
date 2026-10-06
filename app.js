// ============================================================
// CRYPTO CONTROL V7.0 - PESTAÑAS + GRÁFICOS DE LÍNEA HISTÓRICOS
// ============================================================

const portfolio = {
    balances: { BTC: 0.06727496, ETH: 1.05404764, SOL: 5.30285393, ADA: 1949.92009588, BNB: 0.44205987 },
    averagePurchasePrice: { BTC: 99569.18, ETH: 3077.91, SOL: 193.13, ADA: 0.86, BNB: 845.03 }
};

const coinNames = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", ADA: "Cardano", BNB: "BNB" };
const binanceSymbols = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT", ADA: "ADAUSDT", BNB: "BNBUSDT" };
const historicalATH = { BTC: 108731, ETH: 4314, SOL: 234.54, ADA: 1.079, BNB: 710.92 };
const coinColors = { BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', ADA: '#0033AD', BNB: '#F3BA2F' };

let realPrices = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 };
let displayPrices = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 };
let changes24h = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 };

let isSimulating = false;
let portfolioChart = null;

// Variables Históricos
let historyPortChart = null;
let historyCoinChart = null;
let historicalDataRaw = {}; 
let historyDates = [];

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// ==========================================
// PESTAÑA 1: DATOS EN VIVO
// ==========================================
async function fetchLivePrices() {
    try {
        const symbolsArray = JSON.stringify(Object.values(binanceSymbols));
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsArray)}`;
        const response = await fetch(url);
        const data = await response.json();

        data.forEach(ticker => {
            for (const [coin, symbol] of Object.entries(binanceSymbols)) {
                if (ticker.symbol === symbol) {
                    realPrices[coin] = Number(ticker.lastPrice);
                    changes24h[coin] = Number(ticker.priceChangePercent);
                }
            }
        });
        
        if (!isSimulating) {
            Object.assign(displayPrices, realPrices);
            document.getElementById('btc-slider').value = realPrices.BTC;
            document.getElementById('sim-price-display').textContent = formatCurrency(realPrices.BTC);
            document.getElementById('sim-price-display').style.color = "var(--text-primary)";
        }
        
        renderDashboard();
    } catch (error) {
        console.error("Error API En Vivo:", error);
    }
}

function renderDashboard() {
    renderKPIs();
    renderDoughnutChart();
    renderCoins();
}

function renderKPIs() {
    let currentValue = 0;
    let totalInvested = 0;

    Object.keys(portfolio.balances).forEach(coin => {
        if (displayPrices[coin] > 0) currentValue += portfolio.balances[coin] * displayPrices[coin];
        totalInvested += portfolio.balances[coin] * portfolio.averagePurchasePrice[coin];
    });

    const result = currentValue - totalInvested;
    const resultPct = totalInvested > 0 ? (result / totalInvested) * 100 : 0;
    const pnlClass = result >= 0 ? "positive" : "negative";
    const sign = result >= 0 ? "+" : "";

    document.getElementById("kpis").innerHTML = `
        <div class="total-label">${isSimulating ? 'Balance Total SIMULADO' : 'Balance Total en USDT (En vivo)'}</div>
        <div class="total-balance" style="${isSimulating ? 'color: #2970FF;' : ''}">${currentValue > 0 ? formatCurrency(currentValue) : "Calculando..."}</div>
        ${currentValue > 0 ? `
            <div class="total-pnl ${pnlClass}">
                Rendimiento: ${sign}${formatCurrency(result)} (${sign}${resultPct.toFixed(2)}%)
            </div>
            <div style="margin-top: 15px; font-size:13px; color: #8492A6;">
                Capital Inyectado: <b>${formatCurrency(totalInvested)}</b>
            </div>
        ` : ""}
    `;
}

function renderDoughnutChart() {
    try {
        const ctx = document.getElementById('portfolioChart').getContext('2d');
        let labels = [], dataValues = [], bgColors = [];

        Object.keys(portfolio.balances).forEach(coin => {
            const val = portfolio.balances[coin] * (displayPrices[coin] || 0);
            if (val > 0) { labels.push(coin); dataValues.push(val); bgColors.push(coinColors[coin]); }
        });

        if (portfolioChart) {
            portfolioChart.data.datasets[0].data = dataValues;
            portfolioChart.update();
        } else {
            portfolioChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: labels, datasets: [{ data: dataValues, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 5 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8492A6', padding: 15 } } }, cutout: '70%' }
            });
        }
    } catch (e) { console.error("Error graficando:", e); }
}

function renderCoins() {
    const html = Object.keys(portfolio.balances).map(coin => {
        const balance = portfolio.balances[coin];
        const avgPrice = portfolio.averagePurchasePrice[coin];
        const currentPrice = displayPrices[coin] || 0;
        const change24 = changes24h[coin] || 0;
        
        let trendTag = '';
        if (!isSimulating) {
            if (change24 >= 5) trendTag = `<div class="trend-tag trend-fire">🔥 VOLANDO +${change24.toFixed(1)}%</div>`;
            else if (change24 <= -5) trendTag = `<div class="trend-tag trend-drop">🔻 CAYENDO ${change24.toFixed(1)}%</div>`;
            else trendTag = `<div class="trend-tag trend-normal">${change24 > 0 ? '+' : ''}${change24.toFixed(1)}% hoy</div>`;
        } else {
            trendTag = `<div class="trend-tag" style="background: rgba(41,112,255,0.15); color: #2970FF;">SIMULACIÓN</div>`;
        }

        const pnlPct = currentPrice > 0 ? (currentPrice / avgPrice - 1) * 100 : 0;
        const pnlClass = pnlPct >= 0 ? "positive" : "negative";
        const sign = pnlPct >= 0 ? "+" : "";

        return `
            <div class="crypto-card">
                ${currentPrice > 0 ? trendTag : ''}
                <div class="card-top">
                    <div class="coin-id">
                        <h3>${coin} <span>${coinNames[coin]}</span></h3>
                        <div style="color: #8492A6;">${balance.toFixed(4)} tokens</div>
                    </div>
                    <div class="market-price" style="${isSimulating ? 'color: #2970FF;' : ''}">
                        ${currentPrice > 0 ? formatCurrency(currentPrice) : "..."}
                    </div>
                </div>
                <div class="financial-data">
                    <div class="data-box"><span class="data-label">Plata que metiste</span><span class="data-value">${formatCurrency(balance * avgPrice)}</span></div>
                    <div class="data-box"><span class="data-label">Máximo histórico</span><span class="data-value ath">${formatCurrency(balance * historicalATH[coin])}</span></div>
                    <div class="data-box"><span class="data-label">Saldo Actual</span><span class="data-value highlight">${currentPrice > 0 ? formatCurrency(balance * currentPrice) : "..."}</span></div>
                    <div class="data-box"><span class="data-label">P/L vs Promedio</span><span class="data-value ${pnlClass}">${sign}${pnlPct.toFixed(2)}%</span></div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("cards").innerHTML = html;
}

// ==========================================
// PESTAÑA 2: LÓGICA HISTÓRICA (NUEVO)
// ==========================================
async function fetchHistoricalData(days = 90) {
    try {
        const promises = Object.values(binanceSymbols).map(symbol => 
            fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${days}`)
            .then(res => res.json())
            .then(data => ({ symbol, data }))
        );

        const results = await Promise.all(promises);
        
        // Extraer fechas de BTC (Todos tienen las mismas)
        const btcData = results.find(r => r.symbol === 'BTCUSDT').data;
        historyDates = btcData.map(k => {
            const date = new Date(k[0]);
            return `${date.getDate()}/${date.getMonth()+1}`;
        });

        // Extraer precios de cierre
        results.forEach(res => {
            const coin = Object.keys(binanceSymbols).find(k => binanceSymbols[k] === res.symbol);
            historicalDataRaw[coin] = res.data.map(k => Number(k[4]));
        });

        renderHistoryCharts();
    } catch (error) {
        console.error("Error obteniendo datos históricos:", error);
    }
}

function renderHistoryCharts() {
    // 1. Chart de Portfolio (Capital Total)
    let portfolioHistory = [];
    for (let i = 0; i < historyDates.length; i++) {
        let dailyTotal = 0;
        Object.keys(portfolio.balances).forEach(coin => {
            dailyTotal += portfolio.balances[coin] * historicalDataRaw[coin][i];
        });
        portfolioHistory.push(dailyTotal);
    }

    const ctxPort = document.getElementById('historyPortChart').getContext('2d');
    
    // Crear un gradiente azul fachero
    let gradientBlue = ctxPort.createLinearGradient(0, 0, 0, 300);
    gradientBlue.addColorStop(0, 'rgba(41, 112, 255, 0.4)');
    gradientBlue.addColorStop(1, 'rgba(41, 112, 255, 0.0)');

    if (historyPortChart) {
        historyPortChart.data.labels = historyDates;
        historyPortChart.data.datasets[0].data = portfolioHistory;
        historyPortChart.update();
    } else {
        historyPortChart = new Chart(ctxPort, {
            type: 'line',
            data: {
                labels: historyDates,
                datasets: [{
                    label: 'Valor de Cartera (USDT)',
                    data: portfolioHistory,
                    borderColor: '#2970FF',
                    backgroundColor: gradientBlue,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 10
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                    x: { grid: { display: false, color: '#222B38' }, ticks: { color: '#8492A6' } },
                    y: { grid: { color: '#222B38' }, ticks: { color: '#8492A6', callback: function(val) { return '$' + val; } } }
                }
            }
        });
    }

    // 2. Chart por Moneda (Select)
    const selectedCoin = document.getElementById('history-coin-select').value;
    const coinData = historicalDataRaw[selectedCoin];
    const ctxCoin = document.getElementById('historyCoinChart').getContext('2d');
    
    if (historyCoinChart) {
        historyCoinChart.data.labels = historyDates;
        historyCoinChart.data.datasets[0].data = coinData;
        historyCoinChart.data.datasets[0].borderColor = coinColors[selectedCoin];
        historyCoinChart.data.datasets[0].label = `Precio ${selectedCoin} (USDT)`;
        historyCoinChart.update();
    } else {
        historyCoinChart = new Chart(ctxCoin, {
            type: 'line',
            data: {
                labels: historyDates,
                datasets: [{
                    label: `Precio ${selectedCoin} (USDT)`,
                    data: coinData,
                    borderColor: coinColors[selectedCoin],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHitRadius: 10
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#8492A6' } },
                    y: { grid: { color: '#222B38' }, ticks: { color: '#8492A6', callback: function(val) { return '$' + val; } } }
                }
            }
        });
    }
}

// ==========================================
// CONTROLADORES DE INTERFAZ (BOTONES, SLIDERS, TABS)
// ==========================================

// Pestañas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        // Si entra a la pestaña histórico y no hay datos, los busca
        if (btn.dataset.tab === 'tab-history' && historyDates.length === 0) {
            fetchHistoricalData(90); // Default 3 meses
        }
    });
});

// Filtros de tiempo Histórico
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const days = Number(btn.dataset.days);
        fetchHistoricalData(days);
    });
});

// Selector de Moneda
document.getElementById('history-coin-select').addEventListener('change', () => {
    renderHistoryCharts();
});

// Simulador
document.getElementById('btc-slider').addEventListener('input', (e) => {
    if (realPrices.BTC === 0) return;
    isSimulating = true;
    document.querySelector('.simulator-card').classList.add('active');
    const simBtc = Number(e.target.value);
    document.getElementById('sim-price-display').textContent = formatCurrency(simBtc);
    document.getElementById('sim-price-display').style.color = "#2970FF";
    const multiplier = simBtc / realPrices.BTC;
    Object.keys(realPrices).forEach(coin => displayPrices[coin] = realPrices[coin] * multiplier);
    renderDashboard();
});

document.getElementById('reset-sim').addEventListener('click', () => {
    isSimulating = false;
    document.querySelector('.simulator-card').classList.remove('active');
    Object.assign(displayPrices, realPrices);
    document.getElementById('btc-slider').value = realPrices.BTC;
    document.getElementById('sim-price-display').textContent = formatCurrency(realPrices.BTC);
    document.getElementById('sim-price-display').style.color = "#FFFFFF";
    renderDashboard();
});

document.getElementById("refresh").addEventListener("click", (e) => {
    e.target.textContent = "Sincronizando...";
    fetchLivePrices().then(() => setTimeout(() => e.target.textContent = "↻ Sincronizar", 1000));
});

// ARRANQUE
fetchLivePrices();
setInterval(fetchLivePrices, 10000);
