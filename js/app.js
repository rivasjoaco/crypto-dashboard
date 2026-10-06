// ============================================================
// CRYPTO CONTROL V5.0 - A PRUEBA DE FALLOS (SIN JSON)
// ============================================================

// 1. TUS DATOS INTEGRADOS (Ya no usamos portfolio.json)
const portfolio = {
    balances: {
        BTC: 0.06727496,
        ETH: 1.05404764,
        SOL: 5.30285393,
        ADA: 1949.92009588,
        BNB: 0.44205987
    },
    averagePurchasePrice: {
        BTC: 99569.18,
        ETH: 3077.91,
        SOL: 193.13,
        ADA: 0.86,
        BNB: 845.03
    }
};

const coinNames = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", ADA: "Cardano", BNB: "BNB" };
const binanceSymbols = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT", ADA: "ADAUSDT", BNB: "BNBUSDT" };
const historicalATH = { BTC: 108731, ETH: 4314, SOL: 234.54, ADA: 1.079, BNB: 710.92 };

let prices = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 };
let changes24h = { BTC: 0, ETH: 0, SOL: 0, ADA: 0, BNB: 0 };

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// 2. CONEXIÓN A LA API DE BINANCE
async function fetchLivePrices() {
    try {
        const symbolsArray = JSON.stringify(Object.values(binanceSymbols));
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsArray)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fallo en la API de Binance");
        
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
        document.getElementById("kpis").innerHTML = `<div class="dashboard-hero"><h3 style="color:var(--accent-red);">Error conectando a Binance. Verificá tu conexión o bloqueador de anuncios.</h3></div>`;
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
                Capital inyectado de tu bolsillo: <b>${formatCurrency(totalInvested)}</b>
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
        
        const totalInvested = balance * avgPrice; 
        const currentVal = balance * currentPrice; 
        const maxHistoricalVal = balance * historicalATH[coin]; 
        
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
    fetchLivePrices().then(() => setTimeout(() => e.target.textContent = "↻ Sincronizar", 1000));
});

// 5. INICIAR LA APLICACIÓN DIRECTAMENTE
renderDashboard();
fetchLivePrices();
setInterval(fetchLivePrices, 10000); // Se auto-actualiza cada 10 segundos
