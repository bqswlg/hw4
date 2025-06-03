let allData = [];
let allChart = null;
let chart = null;

// 新增：分頁狀態
let pesticideTabList = [];
let currentPesticideTabIdx = 0;

async function fetchAllValues() {
    toggleLoading(true);
    const res = await fetch('/api/value');
    allData = await res.json();
    renderAllPesticidesChart();
    renderPesticideTabs();
    toggleLoading(false);
}

// 將所有農藥歷年價格以折線圖呈現
function renderAllPesticidesChart() {
    // 整理資料：以 PesticideName 分組
    const grouped = {};
    allData.forEach(row => {
        if (!grouped[row.PesticideName]) grouped[row.PesticideName] = [];
        grouped[row.PesticideName].push({ year: row.Year, price: row.Price });
    });

    // 取得所有年份（去重排序）
    const yearsSet = new Set();
    allData.forEach(row => yearsSet.add(row.Year));
    const years = Array.from(yearsSet).sort();

    // 為每個農藥建立 dataset
    const datasets = Object.entries(grouped).map(([name, arr], idx) => {
        // 依年份排序
        arr.sort((a, b) => a.year - b.year);
        // 依年份對齊價格
        const priceMap = {};
        arr.forEach(item => priceMap[item.year] = item.price);
        const data = years.map(y => priceMap[y] ?? null);

        // 顏色
        const color = `hsl(${(idx * 47) % 360}, 60%, 50%)`;
        return {
            label: name,
            data,
            borderColor: color,
            backgroundColor: color + '33',
            fill: false,
            spanGaps: true,
            tension: 0.3,
            borderWidth: 3 // 線條加粗
        };
    });

    const ctx = document.getElementById('allPesticidesChart').getContext('2d');
    if (allChart) allChart.destroy();
    allChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// 新增：分頁欄與表格渲染
function renderPesticideTabs() {
    // 以 PesticideName 分組
    const grouped = {};
    allData.forEach(row => {
        if (!grouped[row.PesticideName]) grouped[row.PesticideName] = [];
        grouped[row.PesticideName].push(row);
    });
    pesticideTabList = Object.keys(grouped);

    // 分頁欄
    const tabUl = document.getElementById('pesticideTabs');
    tabUl.innerHTML = '';
    pesticideTabList.forEach((name, idx) => {
        tabUl.innerHTML += `
            <li class="page-item${idx === currentPesticideTabIdx ? ' active' : ''}">
                <a class="page-link" href="#" onclick="switchPesticideTab(${idx});return false;">${name}</a>
            </li>
        `;
    });

    // 表格
    renderPesticideTabTable(grouped[pesticideTabList[currentPesticideTabIdx]] || []);
}

window.switchPesticideTab = function(idx) {
    currentPesticideTabIdx = idx;
    renderPesticideTabs();
};

function renderPesticideTabTable(rows) {
    const tbody = document.getElementById('pesticideTabTable');
    tbody.innerHTML = '';
    // 依年份遞減排序
    rows = [...rows].sort((a, b) => b.Year - a.Year);
    rows.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td>${row.Year}</td>
                <td>${row.Price}</td>
                <td>${row.Currency}</td>
            </tr>
        `;
    });
}

// 保留單一農藥查詢與繪圖
async function searchByYear() {
    const year = document.getElementById('yearInput').value;
    if (!year) return alert('請輸入年份');
    toggleLoading(true);
    const res = await fetch(`/api/year?Year=${year}`);
    const data = await res.json();
    const tbody = document.getElementById('allPricesTable');
    tbody.innerHTML = '';
    data.forEach(row => {
        tbody.innerHTML += `
      <tr>
        <td>${row.PesticideName}</td>
        <td>${row.Price}</td>
      </tr>`;
    });
    document.getElementById('pagination').innerHTML = '';
    // 顯示結果表格
    document.getElementById('yearResultBlock').classList.remove('d-none');
    toggleLoading(false);
}

async function showPesticideHistory(pesticideID, name = '') {
    const res = await fetch(`/api/one?PesticideID=${pesticideID}`);
    const data = await res.json();
    const tbody = document.getElementById('onePesticideTable');
    tbody.innerHTML = '';

    const labels = [];
    const values = [];

    data.forEach(row => {
        labels.push(row.Year);
        values.push(row.Price);
        tbody.innerHTML += `
      <tr>
        <td>${row.Year}</td>
        <td>${row.Price}</td>
        <td>${row.Currency}</td>
      </tr>`;
    });

    renderChart(labels.reverse(), values.reverse(), name);
}

function renderChart(labels, values, name) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `價格走勢圖 (${name})`,
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.3,
                borderWidth: 3 // 線條加粗
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function toggleLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'inline-block' : 'none';
}

fetchAllValues();
