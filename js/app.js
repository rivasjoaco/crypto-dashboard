// ============================================================
// CRYPTO CONTROL V4.0 - API AUTOMÁTICA Y DATOS FINANCIEROS
// ============================================================

const coinNames = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", ADA: "Cardano", BNB: "BNB" };
const binanceSymbols = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT", ADA: "ADAUSDT", BNB: "BNBUSDT" };

// Estos son los precios máximos que llegaron a tener estas monedas en tu mejor momento (2025)
const historicalATH = { BTC: 108731, ETH: 4314, SOL: 234.54, ADA: 1.079, BNB: 710.92 };

let portfolio = null;
let prices = {};
let changes24h = {}; // Guarda si la moneda saltó o cayó en el día

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

// 1. CONEXIÓN A LA API DE BINANCE (TRAE PRECIO Y SALTO 24HS)
async function fetchLivePrices() {
    try {
        // Pedimos la data de las últimas 24hs
        const symbolsArray = JSON.stringify(Object.values(binanceSymbols));
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsArray)}`;
        
        const response = await fetch(url);
        const data = await response.json();

        data.forEach(ticker => {
            for (const [coin, symbol] of Object.entries(binanceSymbols)) {
                if (ticker.symbol === symbol) {
                    prices[coin] = Number(ticker.lastPrice);
                    changes24h[coin] = Number(ticker.priceChangePercent);
                }
            }
        });
        
        renderDashboard();
    } catch (error) {
        console.error("Error obteniendo precios:", error);
    }
}

// 2. CARGAR TU ARCHIVO JSON
async function loadPortfolio() {
    try {
        const response = await fetch("data/portfolio.json");
        portfolio = await response.json();
        Object.keys(portfolio.balances).forEach(coin => { prices[coin] = 0; changes24h[coin] = 0; });
        
        renderDashboard();
        await fetchLivePrices();
        setInterval(fetchLivePrices, 10000); // Se auto-actualiza cada 10 segundos
    } catch (error) {
        document.getElementById("cards").innerHTML = `<h3 style="color:red">Error cargando portfolio.json</h3>`;
    }
}

// 3. RENDERIZAR TABLERO TOTAL
function renderKPIs() {
    let currentValue = 0;
    let totalInvested = 0;

    Object.keys(portfolio.balances).forEach(coin => {
        const balance = portfolio.balances[coin];
        const average = portfolio.averagePurchasePrice[coin];
        const currentPrice = prices[coin] || 0;

        if (currentPrice > 0) currentValue += balance * currentPrice;
        totalInvested += balance * average;
    });

    const result = currentValue - totalInvested;
    const resultPct = (currentValue / totalInvested - 1) * 100;
    const pnlClass = result >= 0 ? "positive" : "negative";
    const sign = result >= 0 ? "+" : "";

    document.getElementById("kpis").innerHTML = `
        <div class="total-label">Balance Total en USDT (En vivo)</div>
        <div class="total-balance">${currentValue > 0 ? formatCurrency(currentValue) : "Sincronizando..."}</div>
        ${currentValue > 0 ? `
            <div class="total-pnl ${pnlClass}">
                Rendimiento Neto: ${sign}${formatCurrency(result)} (${sign}${resultPct.toFixed(2)}%)
            </div>
            <div style="margin-top: 15px; font-size:13px; color: var(--text-secondary);">
                Capital Inyectado de tu bolsillo: <b>${formatCurrency(totalInvested)}</b>
            </div>
        ` : ""}
    `;
}

// 4. RENDERIZAR TARJETAS POR MONEDA
function renderCoins() {
    const html = Object.keys(portfolio.balances).map(coin => {
        const balance = portfolio.balances[coin];
        const avgPrice = portfolio.averagePurchasePrice[coin];
        const currentPrice = prices[coin] || 0;
        const change24 = changes24h[coin] || 0;
        
        // Cálculos que pediste
        const totalInvested = balance * avgPrice; // Cuánta plata metiste en esta moneda
        const currentVal = balance * currentPrice; // Cuánta plata tenés ahora
        const maxHistoricalVal = balance * historicalATH[coin]; // Cuánta plata llegaste a tener en el ATH
        
        // Etiqueta de tendencia 24hs
        let trendTag = `<div class="trend-tag trend-normal">${change24 > 0 ? '+' : ''}${change24.toFixed(1)}% hoy</div>`;
        if (change24 >= 5) trendTag = `<div class="trend-tag trend-fire">🔥 VOLANDO +${change24.toFixed(1)}%</div>`;
        if (change24 <= -5) trendTag = `<div class="trend-tag trend-drop">🔻 CAYENDO ${change24.toFixed(1)}%</div>`;

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
                    <div class="market-price">
                        ${currentPrice > 0 ? formatCurrency(currentPrice) : "..."}
                    </div>
                </div>

                <div class="financial-data">
                    <div class="data-box">
                        <span class="data-label">Plata que metiste (Costo)</span>
                        <span class="data-value">${formatCurrency(totalInvested)}</span>
                    </div>
                    <div class="data-box">
                        <span class="data-label">Máximo histórico que tuviste</span>
                        <span class="data-value ath">${formatCurrency(maxHistoricalVal)}</span>
                    </div>
                    <div class="data-box">
                        <span class="data-label">Tu saldo actual</span>
                        <span class="data-value highlight">${currentVal > 0 ? formatCurrency(currentVal) : "..."}</span>
                    </div>
                    <div class="data-box">
                        <span class="data-label">Rendimiento</span>
                        <span class="data-value ${pnlClass}">${sign}${pnlPct.toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("cards").innerHTML = html;
}

document.getElementById("refresh").addEventListener("click", (e) => {
    e.target.textContent = "Sincronizando...";
    fetchLivePrices().then(() => setTimeout(() => e.target.textContent = "↻ Actualizar", 1000));
});

loadPortfolio();
