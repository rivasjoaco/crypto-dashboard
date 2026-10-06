// ============================================================
// CRYPTO CONTROL V6.0 - SIMULADOR + GRÁFICO DE TORTA
// ============================================================

const portfolio = {
    balances: { BTC: 0.06727496, ETH: 1.05404764, SOL: 5.30285393, ADA: 1949.92009588, BNB: 0.44205987 },
    averagePurchasePrice: { BTC: 99569.18, ETH: 3077.91, SOL: 193.13, ADA: 0.86, BNB: 845.03 }
};

const coinNames = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", ADA: "Cardano", BNB: "BNB" };
const binanceSymbols = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT", ADA: "ADAUSDT", BNB: "BNBUSDT" };
const historicalATH = { BTC: 108731, ETH: 4314, SOL: 234.54, ADA: 1.079, BNB: 710.92 };

// Colores oficiales de cada criptomoneda para el gráfico
const coinColors = { BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', ADA: '#0033AD', BNB: '#F3BA2F' };

let realPrices = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 }; // Precios inalterables de la API
let displayPrices = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 }; // Precios que se muestran (pueden ser simulados)
let changes24h = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 };

let isSimulating = false;
let portfolioChart = null;

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// 1. CONEXIÓN A LA API DE BINANCE
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
        
        // Si no estamos jugando con el simulador, actualizamos los precios de pantalla
        if (!isSimulating) {
            Object.assign(displayPrices, realPrices);
            document.getElementById('btc-slider').value = realPrices.BTC;
            document.getElementById('sim-price-display').textContent = formatCurrency(realPrices.BTC);
            document.getElementById('sim-price-display').style.color = "var(--text-primary)";
        }
        
        renderDashboard();
    } catch (error) {
        console.error("Error obteniendo precios:", error);
    }
}

// 2. ACTUALIZAR TODO EL TABLERO
function renderDashboard() {
    renderKPIs();
    renderCoins();
    renderChart();
}

// 3. RENDERIZAR MÉTRICAS PRINCIPALES
function renderKPIs() {
    let currentValue = 0;
    let totalInvested = 0;

    Object.keys(portfolio.balances).forEach(coin => {
        const balance = portfolio.balances[coin];
        const currentPrice = displayPrices[coin] || 0;
        if (currentPrice > 0) currentValue += balance * currentPrice;
        totalInvested += balance * portfolio.averagePurchasePrice[coin];
    });

    const result = currentValue - totalInvested;
    const resultPct = totalInvested > 0 ? (currentValue / totalInvested - 1) * 100 : 0;
    const pnlClass = result >= 0 ? "positive" : "negative";
    const sign = result >= 0 ? "+" : "";

    document.getElementById("kpis").innerHTML = `
        <div class="total-label">${isSimulating ? 'Balance Total SIMULADO' : 'Balance Total en USDT (En vivo)'}</div>
        <div class="total-balance" style="${isSimulating ? 'color: var(--accent-blue);' : ''}">${currentValue > 0 ? formatCurrency(currentValue) : "Sincronizando..."}</div>
        ${currentValue > 0 ? `
            <div class="total-pnl ${pnlClass}">
                Rendimiento Neto: ${sign}${formatCurrency(result)} (${sign}${resultPct.toFixed(2)}%)
            </div>
            <div style="margin-top: 15px; font-size:13px; color: var(--text-secondary);">
                Plata inyectada de tu bolsillo (Costo Base): <b>${formatCurrency(totalInvested)}</b>
            </div>
        ` : ""}
    `;
}

// 4. RENDERIZAR GRÁFICO DE TORTA
function renderChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    let labels = [];
    let dataValues = [];
    let backgroundColors = [];

    Object.keys(portfolio.balances).forEach(coin => {
        const val = portfolio.balances[coin] * (displayPrices[coin] || 0);
        if (val > 0) {
            labels.push(coin);
            dataValues.push(val);
            backgroundColors.push(coinColors[coin]);
        }
    });

    if (portfolioChart) {
        portfolioChart.data.datasets[0].data = dataValues;
        portfolioChart.update();
    } else {
        portfolioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#8492A6', padding: 15, font: { size: 12 } } },
                    tooltip: { callbacks: { label: function(context) { return ' ' + formatCurrency(context.raw); } } }
                },
                cutout: '70%' // Hace la torta más finita y moderna
            }
        });
    }
}

// 5. RENDERIZAR TARJETAS
function renderCoins() {
    const html = Object.keys(portfolio.balances).map(coin => {
        const balance = portfolio.balances[coin];
        const avgPrice = portfolio.averagePurchasePrice[coin];
        const currentPrice = displayPrices[coin] || 0;
        const change24 = changes24h[coin] || 0;
        
        const totalInvested = balance * avgPrice; 
        const currentVal = balance * currentPrice; 
        const maxHistoricalVal = balance * historicalATH[coin]; 
        
        let trendTag = '';
        if (!isSimulating) {
            trendTag = `<div class="trend-tag trend-normal">${change24 > 0 ? '+' : ''}${change24.toFixed(1)}% hoy</div>`;
            if (change24 >= 5) trendTag = `<div class="trend-tag trend-fire">🔥 VOLANDO +${change24.toFixed(1)}%</div>`;
            if (change24 <= -5) trendTag = `<div class="trend-tag trend-drop">🔻 CAYENDO ${change24.toFixed(1)}%</div>`;
        } else {
            trendTag = `<div class="trend-tag trend-fire" style="background: rgba(41, 112, 255, 0.15); color: var(--accent-blue); border-color: rgba(41,112,255,0.3);">MODO SIMULACIÓN</div>`;
        }

        let pnlPct = 0;
        if (currentPrice > 0) pnlPct = (currentPrice / avgPrice - 1) * 100;
        const pnlClass = pnlPct >= 0 ? "positive" : "negative";
        const sign = pnlPct >= 0 ? "+" : "";

        return `
            <div class="crypto-card">
                ${currentPrice > 0 ? trendTag : ''}
                <div class="card-top">
                    <div class="coin-id">
                        <h3>${coin} <span>${coinNames[coin]}</span></h3>
                        <div style="color: var(--text-secondary);">${balance.toFixed(4)} tokens</div>
                    </div>
                    <div class="market-price" style="${isSimulating ? 'color: var(--accent-blue);' : ''}">
                        ${currentPrice > 0 ? formatCurrency(currentPrice) : "..."}
                    </div>
                </div>
                <div class="financial-data">
                    <div class="data-box">
                        <span class="data-label">Dólares que metiste</span>
                        <span class="data-value">${formatCurrency(totalInvested)}</span>
                    </div>
                    <div class="data-box">
                        <span class="data-label">Máximo histórico</span>
                        <span class="data-value ath">${formatCurrency(maxHistoricalVal)}</span>
                    </div>
                    <div class="data-box">
                        <span class="data-label">Saldo Actual</span>
                        <span class="data-value highlight">${currentVal > 0 ? formatCurrency(currentVal) : "..."}</span>
                    </div>
                    <div class="data-box">
                        <span class="data-label">P/L vs Promedio</span>
                        <span class="data-value ${pnlClass}">${sign}${pnlPct.toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("cards").innerHTML = html;
}

// ==========================================
// CONTROLADORES DE LA INTERFAZ
// ==========================================
const slider = document.getElementById('btc-slider');
const simDisplay = document.getElementById('sim-price-display');
const simCard = document.querySelector('.simulator-card');

slider.addEventListener('input', (e) => {
    if (realPrices.BTC === 0) return; // Esperar a que cargue la API
    isSimulating = true;
    simCard.classList.add('active');
    
    const simulatedBtcPrice = Number(e.target.value);
    simDisplay.textContent = formatCurrency(simulatedBtcPrice);
    simDisplay.style.color = "var(--accent-blue)";
    
    // Calcular el porcentaje de variación de BTC para aplicarlo al resto de la cartera
    const multiplier = simulatedBtcPrice / realPrices.BTC;
    
    Object.keys(realPrices).forEach(coin => {
        displayPrices[coin] = realPrices[coin] * multiplier;
    });
    
    renderDashboard();
});

document.getElementById('reset-sim').addEventListener('click', () => {
    isSimulating = false;
    simCard.classList.remove('active');
    Object.assign(displayPrices, realPrices); // Volver precios a la normalidad
    slider.value = realPrices.BTC;
    simDisplay.textContent = formatCurrency(realPrices.BTC);
    simDisplay.style.color = "var(--text-primary)";
    renderDashboard();
});

document.getElementById("refresh").addEventListener("click", (e) => {
    e.target.textContent = "Sincronizando...";
    fetchLivePrices().then(() => setTimeout(() => e.target.textContent = "↻ Sincronizar", 1000));
});

// ARRANQUE
fetchLivePrices();
setInterval(fetchLivePrices, 10000);
