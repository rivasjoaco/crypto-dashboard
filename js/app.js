// ============================================================
// CRYPTO CONTROL V3.0 - DISEÑO LIMPIO
// ============================================================

const coinNames = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    SOL: "Solana",
    ADA: "Cardano",
    BNB: "BNB"
};

const binanceSymbols = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    SOL: "SOLUSDT",
    ADA: "ADAUSDT",
    BNB: "BNBUSDT"
};

let portfolio = null;
let prices = {};

// FORMATO DE NÚMEROS
function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

// CONEXIÓN A LA API DE BINANCE
async function fetchLivePrices() {
    try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/price");
        const data = await response.json();

        data.forEach(ticker => {
            for (const [coin, symbol] of Object.entries(binanceSymbols)) {
                if (ticker.symbol === symbol) prices[coin] = Number(ticker.price);
            }
        });
        
        renderDashboard();
    } catch (error) {
        console.error("Error obteniendo precios:", error);
    }
}

// CARGAR DATOS
async function loadPortfolio() {
    try {
        const response = await fetch("data/portfolio.json");
        portfolio = await response.json();
        Object.keys(portfolio.balances).forEach(coin => prices[coin] = 0);
        
        renderDashboard();
        await fetchLivePrices();
        setInterval(fetchLivePrices, 10000); // Actualiza cada 10 seg
    } catch (error) {
        document.getElementById("cards").innerHTML = `<h3 style="color:red">Error cargando cartera.</h3>`;
    }
}

// RENDERIZAR BLOQUE PRINCIPAL
function renderKPIs() {
    let currentValue = 0;
    let referenceCost = 0;

    Object.keys(portfolio.balances).forEach(coin => {
        const balance = portfolio.balances[coin];
        const average = portfolio.averagePurchasePrice[coin];
        const currentPrice = prices[coin] || 0;

        if (currentPrice > 0) currentValue += balance * currentPrice;
        referenceCost += balance * average;
    });

    const result = currentValue - referenceCost;
    const resultPct = (currentValue / referenceCost - 1) * 100;
    const pnlClass = result >= 0 ? "positive" : "negative";
    const sign = result >= 0 ? "+" : "";

    document.getElementById("kpis").innerHTML = `
        <div class="total-label">Balance Total Estimado</div>
        <div class="total-balance">${currentValue > 0 ? formatCurrency(currentValue) : "Cargando..."}</div>
        ${currentValue > 0 ? `
            <div class="total-pnl ${pnlClass}">
                Rendimiento: ${sign}${formatCurrency(result)} (${sign}${resultPct.toFixed(2)}%)
            </div>
            <div class="stat-label" style="margin-top: 15px; font-size:12px;">
                Costo Base de Inversión: ${formatCurrency(referenceCost)}
            </div>
        ` : ""}
    `;
}

// RENDERIZAR TARJETAS DE MONEDAS
function renderCoins() {
    const html = Object.keys(portfolio.balances).map(coin => {
        const balance = portfolio.balances[coin];
        const avgPrice = portfolio.averagePurchasePrice[coin];
        const currentPrice = prices[coin] || 0;
        
        let pnlPct = 0;
        let recoveryNeeded = 0;
        
        if (currentPrice > 0) {
            pnlPct = (currentPrice / avgPrice - 1) * 100;
            recoveryNeeded = (avgPrice / currentPrice - 1) * 100;
        }

        const pnlClass = pnlPct >= 0 ? "positive" : "negative";
        const sign = pnlPct >= 0 ? "+" : "";
        const currentVal = balance * currentPrice;

        return `
            <div class="crypto-card">
                <div class="card-top">
                    <div class="coin-id">
                        <h3>${coin} <span>${coinNames[coin]}</span></h3>
                        <div class="coin-holding">${balance.toFixed(4)} ${coin} ≈ ${currentVal > 0 ? formatCurrency(currentVal) : "..."}</div>
                    </div>
                    <div class="coin-market">
                        <div class="market-price">${currentPrice > 0 ? formatCurrency(currentPrice) : "Cargando..."}</div>
                        ${currentPrice > 0 ? `<div class="market-pnl ${pnlClass}">${sign}${pnlPct.toFixed(2)}% vs Promedio</div>` : ""}
                    </div>
                </div>
                <div class="card-bottom">
                    <div class="stat-box">
                        <span class="stat-label">Compraste a (Promedio)</span>
                        <span class="stat-value">${formatCurrency(avgPrice)}</span>
                    </div>
                    <div class="stat-box right">
                        <span class="stat-label">Para recuperar necesitas que suba</span>
                        ${recoveryNeeded > 0 
                            ? `<span class="stat-value recovery-needed">+${recoveryNeeded.toFixed(1)}%</span>` 
                            : `<span class="stat-value" style="color:var(--accent-green)">Ya estás en ganancia</span>`}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("cards").innerHTML = html;
}

// EVENTOS
document.getElementById("refresh").addEventListener("click", (e) => {
    e.target.textContent = "Actualizando...";
    fetchLivePrices().then(() => setTimeout(() => e.target.textContent = "↻ Actualizar", 1000));
});

// INICIAR
loadPortfolio();
