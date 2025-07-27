class ResultsApp {
    constructor() {
        this.results = [];
        this.realResults = {};
        this.matchNames = {};
        this.chart = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadResults();
    }

    bindEvents() {
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadResults();
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchFolio();
        });

        document.getElementById('folio-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchFolio();
            }
        });

        // Format folio input
        document.getElementById('folio-search').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Modal close events
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('user-modal').addEventListener('click', (e) => {
            if (e.target.id === 'user-modal') {
                this.closeModal();
            }
        });
    }

    async loadResults() {
        try {
            this.showLoading();
            this.hideError();

            const response = await fetch('api/results.php');
            const data = await response.json();

            if (data.success) {
                this.results = data.data.results;
                this.realResults = data.data.real_results;
                this.matchNames = data.data.match_names;
                
                this.displayResults();
                this.displayMatchResults();
                this.hideLoading();
            } else {
                throw new Error(data.error || 'Error al cargar resultados');
            }
        } catch (error) {
            console.error('Error loading results:', error);
            this.showError('Error al cargar los resultados: ' + error.message);
            this.hideLoading();
        }
    }

    async searchFolio() {
        const folio = document.getElementById('folio-search').value.trim();
        
        if (!folio) {
            alert('Por favor ingresa un folio');
            return;
        }

        try {
            const response = await fetch(`api/results.php?folio=${encodeURIComponent(folio)}`);
            const data = await response.json();

            if (data.success) {
                this.showUserModal(data.data);
                document.getElementById('folio-search').value = ''; // Clear search
            } else {
                alert(data.error || 'Folio no encontrado');
            }
        } catch (error) {
            console.error('Error searching folio:', error);
            alert('Error al buscar el folio');
        }
    }

    displayResults() {
        this.createChart();
        this.createTable();
        document.getElementById('results-container').classList.remove('hidden');
    }

    createChart() {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Prepare data for chart (top 10 results)
        const topResults = this.results.slice(0, 10);
        const labels = topResults.map(result => result.folio);
        const data = topResults.map(result => result.aciertos);
        const backgroundColors = topResults.map((result, index) => {
            if (index === 0) return '#FFD700'; // Gold for 1st
            if (index === 1) return '#C0C0C0'; // Silver for 2nd  
            if (index === 2) return '#CD7F32'; // Bronze for 3rd
            return '#DC143C'; // Crimson for others
        });

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Aciertos',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color + '80'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.9)',
                        titleColor: '#DC143C',
                        bodyColor: '#ffffff',
                        borderColor: '#DC143C',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const result = topResults[context.dataIndex];
                                return [
                                    `Aciertos: ${result.aciertos}/${result.total}`,
                                    `Porcentaje: ${result.porcentaje}%`,
                                    `Click para ver detalle`
                                ];
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const result = topResults[index];
                        this.showUserModalFromResult(result);
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 12,
                        ticks: {
                            stepSize: 1,
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff',
                            maxRotation: 45
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createTable() {
        const tbody = document.getElementById('results-table-body');
        tbody.innerHTML = '';

        this.results.forEach((result, index) => {
            const position = index + 1;
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700 hover:bg-gray-800 transition-colors';
            
            // Position with trophy for top 3
            let positionDisplay = position;
            if (position === 1) positionDisplay = '🥇 1';
            else if (position === 2) positionDisplay = '🥈 2';
            else if (position === 3) positionDisplay = '🥉 3';

            // Percentage color
            let percentageClass = 'text-gray-300';
            if (result.porcentaje >= 80) percentageClass = 'text-green-400';
            else if (result.porcentaje >= 60) percentageClass = 'text-yellow-400';
            else if (result.porcentaje >= 40) percentageClass = 'text-orange-400';
            else percentageClass = 'text-red-400';

            row.innerHTML = `
                <td class="py-2 px-2 font-bold text-xs sm:text-sm">${positionDisplay}</td>
                <td class="py-2 px-2 font-mono text-crimson text-xs sm:text-sm">${result.folio}</td>
                <td class="py-2 px-2 text-center font-bold text-green-400 text-sm">${result.aciertos}/${result.total}</td>
                <td class="py-2 px-2 text-center font-bold ${percentageClass} text-xs sm:text-sm">${result.porcentaje}%</td>
            `;

            tbody.appendChild(row);
        });
    }

    displayMatchResults() {
        const container = document.getElementById('match-results-grid');
        container.innerHTML = '';

        Object.entries(this.realResults).forEach(([matchKey, result]) => {
            const matchName = this.matchNames[matchKey] || matchKey;
            
            const matchCard = document.createElement('div');
            matchCard.className = 'bg-charcoal border border-gray-600 rounded-lg p-4';
            
            // Result color
            let resultClass = 'text-green-400';
            if (result === 'Empate') resultClass = 'text-yellow-400';

            matchCard.innerHTML = `
                <h4 class="text-sm font-bold text-gray-300 mb-2">${matchName}</h4>
                <div class="text-center">
                    <div class="text-lg font-bold ${resultClass}">${result}</div>
                </div>
            `;

            container.appendChild(matchCard);
        });

        document.getElementById('match-results-container').classList.remove('hidden');
    }

    displaySearchResult(userData) {
        const container = document.getElementById('user-predictions');
        container.innerHTML = '';

        // Show summary first
        const summary = document.createElement('div');
        summary.className = 'bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4';
        
        let percentageClass = 'text-gray-300';
        if (userData.porcentaje >= 80) percentageClass = 'text-green-400';
        else if (userData.porcentaje >= 60) percentageClass = 'text-yellow-400';
        else if (userData.porcentaje >= 40) percentageClass = 'text-orange-400';
        else percentageClass = 'text-red-400';

        summary.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-crimson mb-1">${userData.folio}</div>
                <div class="text-xl font-bold text-green-400">${userData.aciertos} / ${userData.total} aciertos</div>
                <div class="text-lg font-bold ${percentageClass}">${userData.porcentaje}% de efectividad</div>
            </div>
        `;
        container.appendChild(summary);

        // Show predictions vs results
        Object.entries(userData.predicciones).forEach(([matchKey, prediction]) => {
            const realResult = userData.real_results[matchKey];
            const matchName = userData.match_names[matchKey] || matchKey;
            const isCorrect = prediction === realResult;

            const predictionCard = document.createElement('div');
            predictionCard.className = `border rounded-lg p-3 ${isCorrect ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`;
            
            predictionCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="text-sm text-gray-300 font-medium">${matchName}</div>
                        <div class="text-xs text-gray-400 mt-1">
                            Tu predicción: <span class="text-white">${prediction}</span>
                        </div>
                        <div class="text-xs text-gray-400">
                            Resultado real: <span class="text-white">${realResult}</span>
                        </div>
                    </div>
                    <div class="text-2xl ml-4">
                        ${isCorrect ? '✅' : '❌'}
                    </div>
                </div>
            `;

            container.appendChild(predictionCard);
        });

        this.showUserModal(userData);
    }

    showUserModal(userData) {
        const modalContent = document.getElementById('modal-content');
        
        // Show summary first
        let percentageClass = 'text-gray-300';
        if (userData.porcentaje >= 80) percentageClass = 'text-green-400';
        else if (userData.porcentaje >= 60) percentageClass = 'text-yellow-400';
        else if (userData.porcentaje >= 40) percentageClass = 'text-orange-400';
        else percentageClass = 'text-red-400';

        let summaryHtml = `
            <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-crimson mb-1">${userData.folio}</div>
                    <div class="text-xl font-bold text-green-400">${userData.aciertos} / ${userData.total} aciertos</div>
                    <div class="text-lg font-bold ${percentageClass}">${userData.porcentaje}% de efectividad</div>
                </div>
            </div>
            <h4 class="text-lg font-bold text-crimson mb-4">Predicciones vs Resultados:</h4>
            <div class="space-y-3">
        `;

        // Show predictions vs results
        Object.entries(userData.predicciones).forEach(([matchKey, prediction]) => {
            const realResult = userData.real_results[matchKey];
            const matchName = userData.match_names[matchKey] || matchKey;
            const isCorrect = prediction === realResult;
            const hasResult = realResult && realResult !== '';

            summaryHtml += `
                <div class="border rounded-lg p-3 ${isCorrect ? 'border-green-500 bg-green-900/20' : hasResult ? 'border-red-500 bg-red-900/20' : 'border-gray-500 bg-gray-900/20'}">
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="text-sm text-gray-300 font-medium">${matchName}</div>
                            <div class="text-xs text-gray-400 mt-1">
                                Tu predicción: <span class="text-white">${prediction}</span>
                            </div>
                            <div class="text-xs text-gray-400">
                                Resultado real: <span class="text-white">${hasResult ? realResult : 'Pendiente'}</span>
                            </div>
                        </div>
                        <div class="text-2xl ml-4">
                            ${hasResult ? (isCorrect ? '✅' : '❌') : '⏳'}
                        </div>
                    </div>
                </div>
            `;
        });

        summaryHtml += '</div>';
        modalContent.innerHTML = summaryHtml;
        
        document.getElementById('user-modal').classList.remove('hidden');
        document.getElementById('user-modal').classList.add('flex');
    }

    showUserModalFromResult(result) {
        // Create userData object from result for the modal
        const userData = {
            folio: result.folio,
            aciertos: result.aciertos,
            total: result.total,
            porcentaje: result.porcentaje,
            predicciones: result.predicciones,
            real_results: this.realResults,
            match_names: this.matchNames
        };
        
        this.showUserModal(userData);
    }

    closeModal() {
        document.getElementById('user-modal').classList.add('hidden');
        document.getElementById('user-modal').classList.remove('flex');
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('results-container').classList.add('hidden');
        document.getElementById('match-results-container').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ResultsApp();
});