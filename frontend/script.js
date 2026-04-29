async function analyzeFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file first!');
        return;
    }

    // Show loading
    document.getElementById('cardsSection').style.display = 'none';
    document.getElementById('tableSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('chartsSection').style.display = 'none';
    document.getElementById('topSection').style.display = 'none';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        alert('Error connecting to backend. Make sure the server is running!');
        console.error(error);
    }
}

function displayResults(data) {

    // --- SUMMARY CARDS ---
    document.getElementById('totalRows').textContent = data.rows;
    document.getElementById('totalCols').textContent = data.cols;

    const totalMissing = Object.values(data.missing).reduce((a, b) => a + b, 0);
    document.getElementById('totalMissing').textContent = totalMissing;
    document.getElementById('totalDuplicates').textContent = data.duplicates;

    document.getElementById('cardsSection').style.display = 'flex';

    // --- DATA PREVIEW TABLE ---
    const table = document.getElementById('previewTable');
    table.innerHTML = '';

    const headers = Object.keys(data.preview[0]);
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.preview.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = row[h];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    document.getElementById('tableSection').style.display = 'block';

    // --- NUMERIC STATS ---
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = '';

    if (Object.keys(data.numeric_stats).length > 0) {
        Object.entries(data.numeric_stats).forEach(([col, stats]) => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h4>${col}</h4>
                <div class="stat-row">
                    <span>Min: ${stats.min}</span>
                    <span>Max: ${stats.max}</span>
                    <span>Mean: ${stats.mean}</span>
                    <span>Median: ${stats.median}</span>
                </div>
            `;
            statsContainer.appendChild(card);
        });
        document.getElementById('statsSection').style.display = 'block';
    }

    // --- CHARTS ---
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';

    if (Object.keys(data.numeric_stats).length > 0) {
        Object.entries(data.numeric_stats).forEach(([col, stats]) => {
            const box = document.createElement('div');
            box.className = 'chart-box';

            const canvas = document.createElement('canvas');
            box.appendChild(canvas);
            chartsContainer.appendChild(box);

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['Min', 'Max', 'Mean', 'Median'],
                    datasets: [{
                        label: col,
                        data: [stats.min, stats.max, stats.mean, stats.median],
                        backgroundColor: [
                            '#1a73e8',
                            '#0d47a1',
                            '#42a5f5',
                            '#90caf9'
                        ],
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: col,
                            font: { size: 14 }
                        }
                    }
                }
            });
        });
        document.getElementById('chartsSection').style.display = 'block';
    }

    // --- TOP VALUES ---
    const topContainer = document.getElementById('topContainer');
    topContainer.innerHTML = '';

    if (Object.keys(data.top_values).length > 0) {
        Object.entries(data.top_values).forEach(([col, values]) => {
            const card = document.createElement('div');
            card.className = 'top-card';

            let itemsHTML = Object.entries(values).map(([val, count]) => `
                <div class="top-item">
                    <span>${val}</span>
                    <span>${count}</span>
                </div>
            `).join('');

            card.innerHTML = `<h4>${col}</h4>${itemsHTML}`;
            topContainer.appendChild(card);
        });
        document.getElementById('topSection').style.display = 'block';
    }
}
