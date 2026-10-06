// ============================================================
// CRYPTO CONTROL V2.0 - INTEGRACIÓN API EN VIVO
// ============================================================

const coinNames = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    SOL: "Solana",
    ADA: "Cardano",
    BNB: "BNB"
};

// Símbolos de Binance correspondientes a tus monedas
const binanceSymbols = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    SOL: "SOLUSDT",
    ADA: "ADAUSDT",
    BNB: "BNBUSDT"
};

let portfolio = null;
let prices = {};

// ============================================================
// FORMATO DE NÚMEROS
// ============================================================
function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

function formatPrice(value) {
    if (value < 10) return "USDT " + formatNumber(value, 4);
    return "USDT " + formatNumber(value, 0);
}

function parseDate(dateString) {
    const parts = dateString.split("/");
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

// ============================================================
// CLASIFICACIÓN DE MOVIMIENTOS
// ============================================================
function classifyTransaction(transaction, coin) {
    if (transaction.Moneda === coin) return "entrada";
    if (transaction["Moneda Origen"] === coin) return "salida";
    return "otra";
}

function getReferencePurchases(coin) {
    return portfolio.transactions
        .filter(transaction => {
            const type = classifyTransaction(transaction, coin);
            const originCurrency = transaction["Moneda Origen"];
            return (
                type === "entrada" &&
                (originCurrency === "USDT" || originCurrency === "DAI") &&
                Number(transaction.Precio) > 0
            );
        })
        .sort((a, b) => parseDate(b.Fecha) - parseDate(a.Fecha));
}

// ============================================================
// CONEXIÓN A LA API DE BINANCE (¡NUEVO!)
// ============================================================
async function fetchLivePrices() {
    try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/price");
        const data = await response.json();

        // Mapear los precios de la API a nuestra variable 'prices'
        data.forEach(ticker => {
            for (const [coin, symbol] of Object.entries(binanceSymbols)) {
                if (ticker.symbol === symbol) {
                    prices[coin] = Number(ticker.price);
                }
            }
        });
        
        renderDashboard();
    } catch (error) {
        console.error("Error obteniendo precios de Binance:", error);
    }
}

// ============================================================
// CARGAR PORTFOLIO.JSON
// ============================================================
async function loadPortfolio() {
    try {
        const response = await fetch("data/portfolio.json");
        if (!response.ok) throw new Error("No se pudo cargar portfolio.json");
        portfolio = await response.json();

        // Inicializar precios en 0 temporalmente hasta que cargue la API
        Object.keys(portfolio.balances).forEach(coin => prices[coin] = 0);
        
        // Renderizar interfaz vacía y luego buscar precios reales
        renderDashboard();
        await fetchLivePrices();

        // Auto-refresh de precios cada 30 segundos
        setInterval(fetchLivePrices, 30000);

    } catch (error) {
        console.error("Error cargando cartera:", error);
        document.getElementById("cards").innerHTML = `
            <div class="asset">
                <h2>No se pudo cargar la cartera</h2>
                <p class="red">Revisar data/portfolio.json</p>
            </div>
        `;
    }
}

// ============================================================
// RENDER PRINCIPAL Y KPIS
// ============================================================
function renderDashboard() {
    renderKPIs();
    renderCoins();
    addPriceEvents();
}

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

    const result = currentValue > 0 ? currentValue - referenceCost : 0;
    const resultPercentage = currentValue > 0 ? (currentValue / referenceCost - 1) * 100 : 0;
    const resultClass = result >= 0 ? "green" : "red";

    document.getElementById("kpis").innerHTML = `
        <div class="kpi">
            <span>Valor actual</span>
            <strong>${currentValue > 0 ? formatPrice(currentValue) : "Cargando..."}</strong>
        </div>
        <div class="kpi">
            <span>Costo referencia</span>
            <strong>${formatPrice(referenceCost)}</strong>
        </div>
        <div class="kpi">
            <span>Resultado</span>
            <strong class="${resultClass}">
                ${currentValue > 0 ? formatPrice(result) : "—"}
            </strong>
            ${currentValue > 0 ? `<small class="${resultClass}">${resultPercentage >= 0 ? "+" : ""}${formatNumber(resultPercentage, 1)}%</small>` : ""}
        </div>
        <div class="kpi">
            <span>Activos</span>
            <strong>${Object.keys(portfolio.balances).length}</strong>
        </div>
    `;
}

// ============================================================
// RENDER DE MONEDAS Y COMPONENTES
// ============================================================
function renderCoins() {
    const coins = Object.keys(portfolio.balances);
    document.getElementById("cards").innerHTML = coins.map(coin => createCoinCard(coin)).join("");
}

function createCoinCard(coin) {
    const balance = portfolio.balances[coin];
    const average = portfolio.averagePurchasePrice[coin];
    const currentPrice = prices[coin] || 0;
    const purchases = getReferencePurchases(coin);

    let difference = 0;
    let recoveryNeeded = 0;

    if (currentPrice > 0) {
        difference = (currentPrice / average - 1) * 100;
        recoveryNeeded = (average / currentPrice - 1) * 100;
    }

    const statusClass = difference >= 0 ? "green" : "red";
    const level10 = average * 1.10;
    const level20 = average * 1.20;
    const currentValue = currentPrice > 0 ? balance * currentPrice : 0;

    return `
        <article class="asset">
            <div class="asset-head">
                <div>
                    <div class="coin">${coin} · ${coinNames[coin]}</div>
                    <div class="holding">${formatNumber(balance, 8)} ${coin}</div>
                    ${currentValue > 0 ? `<div class="holding">Valor: ${formatPrice(currentValue)}</div>` : ""}
                </div>
                <div class="market">
                    <div class="label">Precio actual (USDT)</div>
                    <!-- El input permite sobreescribir el precio para simular -->
                    <input class="price-input" data-coin="${coin}" type="number" step="any" value="${currentPrice > 0 ? currentPrice : ""}" placeholder="Cargando...">
                    <div class="price">${currentPrice > 0 ? formatPrice(currentPrice) : "—"}</div>
                </div>
            </div>

            ${currentPrice > 0 ? `
                <div class="status">
                    <b class="${statusClass}">${difference >= 0 ? "+" : ""}${formatNumber(difference, 1)}%</b> vs. promedio
                    ${recoveryNeeded > 0 ? ` · necesita <b>+${formatNumber(recoveryNeeded, 1)}%</b> para recuperar el promedio` : ` · <span class="green">sobre break-even</span>`}
                </div>
            ` : ""}

            <div class="levels">
                ${createLevel("+20% promedio", level20, "up")}
                ${createLevel("+10% promedio", level10, "up")}
                ${createLevel("PROMEDIO / BREAK-EVEN", average, "avg")}
                ${currentPrice > 0 ? createLevel("PRECIO ACTUAL", currentPrice, "current") : ""}
            </div>

            ${createPurchaseHistory(coin, purchases, average, currentPrice)}
            ${createTransactionHistory(coin)}
        </article>
    `;
}

function createLevel(name, value, className) {
    return `
        <div class="level ${className}">
            <span>${name}</span>
            <div class="bar"><i class="dot" style="--pos: 50%;"></i></div>
            <span class="value">${formatPrice(value)}</span>
        </div>
    `;
}

function createPurchaseHistory(coin, purchases, average, currentPrice) {
    if (!purchases || purchases.length === 0) {
        return `<details class="tx"><summary>Compras históricas</summary><p class="muted">No se detectaron compras contra USDT o DAI.</p></details>`;
    }

    const rows = purchases.map(transaction => {
        const purchasePrice = Number(transaction.Precio);
        let performanceText = "";

        if (currentPrice > 0) {
            const performance = (currentPrice / purchasePrice - 1) * 100;
            const performanceClass = performance >= 0 ? "green" : "red";
            performanceText = `<span class="${performanceClass}">${performance >= 0 ? "+" : ""}${formatNumber(performance, 1)}%</span>`;
        }

        return `
            <div class="tx-row">
                <span><span class="tag">COMPRA</span><br>${transaction.Fecha}</span>
                <span>${formatPrice(purchasePrice)}<br>${performanceText}</span>
            </div>
        `;
    }).join("");

    return `<details class="tx" open><summary>Compras históricas (${purchases.length})</summary><div class="tx-grid">${rows}</div></details>`;
}

function createTransactionHistory(coin) {
    const transactions = portfolio.transactions
        .filter(transaction => transaction.Moneda === coin || transaction["Moneda Origen"] === coin)
        .sort((a, b) => parseDate(b.Fecha) - parseDate(a.Fecha));

    const rows = transactions.map(transaction => {
        const type = classifyTransaction(transaction, coin);
        return `
            <div class="tx-row">
                <span><span class="tag">${type.toUpperCase()}</span><br>${transaction.Fecha}</span>
                <span>${transaction.Precio ? formatNumber(Number(transaction.Precio), 4) : "—"}</span>
            </div>
        `;
    }).join("");

    return `<details class="tx"><summary>Ver todos los movimientos (${transactions.length})</summary><div class="tx-grid">${rows}</div></details>`;
}

// ============================================================
// EVENTOS
// ============================================================
function addPriceEvents() {
    // Escucha el input por si el usuario quiere "Simular" un precio
    document.querySelectorAll(".price-input").forEach(input => {
        input.addEventListener("input", event => {
            const coin = event.target.dataset.coin;
            const value = Number(event.target.value);
            if (value > 0) {
                prices[coin] = value;
                renderDashboard();
                // Al volver a renderizar, el foco se pierde. Para una simulación rápida es suficiente.
            }
        });
    });
}

const refreshButton = document.getElementById("refresh");
if (refreshButton) {
    refreshButton.addEventListener("click", () => {
        refreshButton.textContent = "Actualizando...";
        fetchLivePrices().then(() => {
            setTimeout(() => refreshButton.textContent = "Actualizar Ahora", 1000);
        });
    });
}

// ============================================================
// INICIAR CRYPTO CONTROL
// ============================================================
loadPortfolio();
