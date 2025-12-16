// Get canvas contexts for the two charts
const revenueCtx = document.getElementById("revenueChart").getContext("2d");
const productCtx = document.getElementById("productChart").getContext("2d");

// Get DOM elements for KPIs, activity feed, customer table, and metadata labels
const kpiGrid = document.getElementById("kpiGrid");
const activityFeed = document.getElementById("activityFeed");
const customerTableBody = document.querySelector("#customerTable tbody");
const revenueMeta = document.getElementById("revenueMeta");
const mixMeta = document.getElementById("mixMeta");
const activityMeta = document.getElementById("activityMeta");

// Controls for range filtering and refreshing
const rangeFilter = document.getElementById("rangeFilter");
const refreshButton = document.getElementById("refreshButton");

// Static list of customer data
const customers = [
    { name: "Acme Holdings", value: 420000, health: "good" },
    { name: "Northwind Group", value: 350000, health: "warning" },
    { name: "Lumina Retail", value: 285000, health: "good" },
    { name: "Vertex Media", value: 198000, health: "risk" },
    { name: "Atlas Mobility", value: 167000, health: "good" }
];

// Random activity messages shown in the activity feed
const activities = [
    { label: "New order", value: () => `+₱${randomInt(8, 75)}k` },
    { label: "Renewal", value: () => `+₱${randomInt(20, 60)}k` },
    { label: "Churn alert", value: () => "-1 acct" },
    { label: "Product inquiry", value: () => randomInt(5, 22) + " leads" },
    { label: "Refund issued", value: () => `-₱${randomInt(4, 18)}k` }
];

// Dashboard state container
const state = {
    range: Number(rangeFilter.value), // Selected number of days
    revenueSeries: [],               // Line chart data
    productMix: [],                  // Bar chart data
    kpis: []                         // KPI widget data
};

// Generates a random integer (used for fake data)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Formats numbers as Philippine Peso currency
function formatCurrency(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(value);
}

// Formats values as percentages
function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
}

// Creates random revenue values for the line chart
function generateRevenueSeries(days) {
    const series = [];
    let value = randomInt(180, 260);

    for (let i = days - 1; i >= 0; i--) {
        value += randomInt(-12, 15); // Random fluctuation
        if (value < 120) value = 120;
        series.unshift({ day: days - i, value });
    }

    return series;
}

// Creates random product mix percentages for the bar chart
function generateProductMix() {
    const base = [
        { label: "Subscriptions", value: randomInt(38, 48) },
        { label: "Managed Ops", value: randomInt(22, 32) },
        { label: "Advisory", value: randomInt(14, 22) },
        { label: "Support", value: randomInt(8, 16) }
    ];

    const total = base.reduce((sum, e) => sum + e.value, 0);
    return base.map(entry => ({ ...entry, ratio: entry.value / total }));
}

// Builds KPI values using revenue and generated metrics
function buildKpis(series) {
    const latest = series[series.length - 1].value;
    const prior = series[Math.max(series.length - 8, 0)].value;
    const delta = ((latest - prior) / prior) || 0;

    const sales = randomInt(280, 430);
    const pipeline = randomInt(32, 55);
    const churn = Math.max(0.02, Math.random() * 0.05);
    const satisfaction = Math.random() * 0.25 + 0.65;

    return [
        { label: "Revenue", value: formatCurrency(latest * 1000), trend: delta, deltaLabel: formatPercent(delta) },
        { label: "Sales Volume", value: `${sales} deals`, trend: (sales - 320) / 320, deltaLabel: `${sales} deals` },
        { label: "Pipeline", value: formatCurrency(pipeline * 10000), trend: (pipeline - 40) / 40, deltaLabel: `${pipeline} active` },
        { label: "Customer Satisfaction", value: formatPercent(satisfaction), trend: satisfaction - 0.75, deltaLabel: formatPercent(satisfaction) }
    ];
}

// Renders KPI cards on the UI
function renderKpis(kpis) {
    kpiGrid.innerHTML = kpis.map(kpi => {
        const trendClass = kpi.trend >= 0 ? "up" : "down";
        const trendSymbol = kpi.trend >= 0 ? "▲" : "▼";

        return `
            <article class="kpi-card">
                <span class="kpi-trend ${trendClass}">${trendSymbol} ${Math.abs(kpi.trend * 100).toFixed(1)}%</span>
                <h3>${kpi.label}</h3>
                <strong>${kpi.value}</strong>
                <small>${kpi.deltaLabel}</small>
            </article>
        `;
    }).join("");
}

// Draws the revenue line chart
function drawLineChart(ctx, series) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const values = series.map(p => p.value);
    const min = Math.min(...values) - 10;
    const max = Math.max(...values) + 10;
    const range = max - min || 1;

    // Background grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw line path
    ctx.beginPath();
    series.forEach((point, index) => {
        const x = (index / (series.length - 1)) * width;
        const y = height - ((point.value - min) / range) * height;
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill area under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    gradient.addColorStop(1, "rgba(15, 23, 42, 0)");

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Helper function to draw rounded bars
function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Draws the product mix bar chart
function drawBarChart(ctx, mix) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / mix.length - 20;

    mix.forEach((product, index) => {
        const x = index * (barWidth + 20) + 10;
        const barHeight = product.ratio * (height - 40);
        const y = height - barHeight - 20;

        ctx.fillStyle = index % 2 === 0 ? "#f97316" : "#38bdf8";
        drawRoundedRectPath(ctx, x, y, barWidth, barHeight, 6);
        ctx.fill();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px 'Segoe UI'";
        ctx.fillText(product.label, x, height - 6);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 13px 'Segoe UI'";
        ctx.fillText(formatPercent(product.ratio), x, y - 8);
    });
}

// Shows random activity log entries
function renderActivity() {
    const now = new Date();
    activityMeta.textContent = `Updated ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const entries = Array.from({ length: 5 }, () =>
        activities[randomInt(0, activities.length - 1)]
    );

    activityFeed.innerHTML = entries.map(entry => `
        <li class="activity__item">
            <span class="activity__label">${entry.label}</span>
            <span class="activity__value">${entry.value()}</span>
        </li>
    `).join("");
}

// Displays customer table
function renderCustomers() {
    customerTableBody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${formatCurrency(customer.value)}</td>
            <td><span class="badge ${customer.health}">${customer.health}</span></td>
        </tr>
    `).join("");
}

// Main function to update everything on dashboard
function updateDashboard() {
    state.range = Number(rangeFilter.value);
    state.revenueSeries = generateRevenueSeries(state.range);
    state.productMix = generateProductMix();
    state.kpis = buildKpis(state.revenueSeries);

    renderKpis(state.kpis);
    drawLineChart(revenueCtx, state.revenueSeries);
    drawBarChart(productCtx, state.productMix);
    renderActivity();
    renderCustomers();

    const total = state.revenueSeries.reduce((sum, p) => sum + p.value, 0);
    revenueMeta.textContent = `${formatCurrency(total * 1000)} ${state.range}-day total`;
    mixMeta.textContent = "Share of revenue by service line";
}

// Event listeners for changing range + manual refresh
rangeFilter.addEventListener("change", updateDashboard);
refreshButton.addEventListener("click", updateDashboard);

// Auto-update dashboard every 8 seconds
updateDashboard();
setInterval(updateDashboard, 8000);
