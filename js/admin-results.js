class AdminResultsApp {
    constructor() {
        this.matchNames = {
            "queretaro_vs_pumas": "Querétaro vs Pumas",
            "puebla_vs_santos": "Puebla vs Santos",
            "tijuana_vs_juarez": "Tijuana vs Juárez",
            "pachuca_vs_mazatlan": "Pachuca vs Mazatlán",
            "chivas_vs_san_luis": "Chivas vs San Luis",
            "toluca_vs_tigres": "Toluca vs Tigres",
            "monterrey_vs_atlas": "Monterrey vs Atlas",
            "cruz_azul_vs_leon": "Cruz Azul vs León",
            "necaxa_vs_america": "Necaxa vs América",
            "dallas_vs_nyc": "Dallas vs NYC FC",
            "lafc_vs_portland": "LAFC vs Portland",
            "inter_miami_vs_cincinnati": "Inter Miami vs Cincinnati"
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCurrentResults();
        this.loadIndividualMatches();
    }

    bindEvents() {
        document.getElementById('results-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveResults();
        });

        document.getElementById('load-current').addEventListener('click', () => {
            this.loadCurrentResults();
        });
    }

    async saveResults() {
        try {
            const formData = new FormData(document.getElementById('results-form'));
            const results = {};
            
            // Validate all fields are filled
            let emptyFields = [];
            for (const [key, value] of formData.entries()) {
                if (!value) {
                    emptyFields.push(this.matchNames[key] || key);
                } else {
                    results[key] = value;
                }
            }

            if (emptyFields.length > 0) {
                this.showError(`Por favor completa todos los campos. Faltan: ${emptyFields.join(', ')}`);
                return;
            }

            // Send to API
            const response = await fetch('api/results-admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save_results',
                    results: results
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Resultados guardados correctamente. Los aciertos se han recalculado automáticamente.');
                this.loadCurrentResults();
            } else {
                throw new Error(data.error || 'Error al guardar resultados');
            }
        } catch (error) {
            console.error('Error saving results:', error);
            this.showError('Error al guardar los resultados: ' + error.message);
        }
    }

    async loadCurrentResults() {
        try {
            const response = await fetch('api/results-admin.php?action=get_current_results');
            const data = await response.json();

            if (data.success) {
                this.displayCurrentResults(data.data);
                this.populateForm(data.data);
            } else {
                this.showError('Error al cargar resultados actuales');
            }
        } catch (error) {
            console.error('Error loading current results:', error);
            this.showError('Error al cargar los resultados actuales');
        }
    }

    displayCurrentResults(results) {
        const container = document.getElementById('current-results-grid');
        container.innerHTML = '';

        if (!results || Object.keys(results).length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-400">No hay resultados guardados</div>';
            return;
        }

        Object.entries(results).forEach(([matchKey, result]) => {
            const matchName = this.matchNames[matchKey] || matchKey;
            
            const resultCard = document.createElement('div');
            resultCard.className = 'bg-charcoal border border-gray-600 rounded-lg p-4';
            
            // Result color
            let resultClass = 'text-green-400';
            if (result === 'Empate') resultClass = 'text-yellow-400';

            resultCard.innerHTML = `
                <h4 class="text-sm font-bold text-gray-300 mb-2">${matchName}</h4>
                <div class="text-center">
                    <div class="text-lg font-bold ${resultClass}">${result}</div>
                </div>
            `;

            container.appendChild(resultCard);
        });
    }

    populateForm(results) {
        if (!results) return;

        Object.entries(results).forEach(([matchKey, result]) => {
            const select = document.querySelector(`select[name="${matchKey}"]`);
            if (select) {
                select.value = result;
            }
        });
    }

    showSuccess(message) {
        document.getElementById('success-text').textContent = message;
        document.getElementById('success-message').classList.remove('hidden');
        document.getElementById('error-message').classList.add('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            document.getElementById('success-message').classList.add('hidden');
        }, 5000);
    }

    showError(message) {
        document.getElementById('error-text').textContent = message;
        document.getElementById('error-message').classList.remove('hidden');
        document.getElementById('success-message').classList.add('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            document.getElementById('error-message').classList.add('hidden');
        }, 5000);
    }

    loadIndividualMatches() {
        const container = document.getElementById('individual-matches-grid');
        container.innerHTML = '';

        Object.entries(this.matchNames).forEach(([matchKey, matchName]) => {
            const matchCard = document.createElement('div');
            matchCard.className = 'bg-charcoal border border-gray-600 rounded-lg p-4';
            
            matchCard.innerHTML = `
                <h4 class="text-sm font-bold text-gray-300 mb-3">${matchName}</h4>
                <div class="space-y-2">
                    <select id="select-${matchKey}" class="w-full bg-slate-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-crimson focus:outline-none text-sm">
                        <option value="">Sin resultado</option>
                        <option value="${this.getTeamOptions(matchKey).team1}">${this.getTeamOptions(matchKey).team1}</option>
                        <option value="${this.getTeamOptions(matchKey).team2}">${this.getTeamOptions(matchKey).team2}</option>
                        <option value="Empate">Empate</option>
                    </select>
                    <button 
                        onclick="adminApp.updateSingleMatch('${matchKey}')"
                        class="w-full bg-gradient-to-r from-green-600 to-green-800 text-white py-2 px-3 rounded-lg hover:from-green-700 hover:to-green-900 transition-all duration-300 font-bold text-xs"
                    >
                        💾 Actualizar
                    </button>
                </div>
            `;

            container.appendChild(matchCard);
        });
    }

    getTeamOptions(matchKey) {
        const teamMappings = {
            'queretaro_vs_pumas': { team1: 'Queretaro', team2: 'Pumas' },
            'puebla_vs_santos': { team1: 'Puebla', team2: 'Santos' },
            'tijuana_vs_juarez': { team1: 'Tijuana', team2: 'Juarez' },
            'pachuca_vs_mazatlan': { team1: 'Pachuca', team2: 'Mazatlan' },
            'chivas_vs_san_luis': { team1: 'Chivas', team2: 'San Luis' },
            'toluca_vs_tigres': { team1: 'Toluca', team2: 'Tigres' },
            'monterrey_vs_atlas': { team1: 'Monterrey', team2: 'Atlas' },
            'cruz_azul_vs_leon': { team1: 'Cruz Azul', team2: 'Leon' },
            'necaxa_vs_america': { team1: 'Necaxa', team2: 'America' },
            'dallas_vs_nyc': { team1: 'Dallas', team2: 'NYC' },
            'lafc_vs_portland': { team1: 'LAFC', team2: 'Portland Timb' },
            'inter_miami_vs_cincinnati': { team1: 'Inter Miami', team2: 'Cincinnati' }
        };
        return teamMappings[matchKey] || { team1: 'Equipo1', team2: 'Equipo2' };
    }

    async updateSingleMatch(matchKey) {
        try {
            const selectElement = document.getElementById(`select-${matchKey}`);
            const result = selectElement.value;
            
            if (!result) {
                alert('Por favor selecciona un resultado');
                return;
            }

            // Get current results
            const currentResponse = await fetch('api/results-admin.php?action=get_current_results');
            const currentData = await currentResponse.json();
            
            if (!currentData.success) {
                throw new Error('Error al cargar resultados actuales');
            }

            // Update only this match
            const updatedResults = { ...currentData.data };
            updatedResults[matchKey] = result;

            // Save updated results
            const response = await fetch('api/results-admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save_results',
                    results: updatedResults
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(`${this.matchNames[matchKey]} actualizado: ${result}`);
                this.loadCurrentResults();
            } else {
                throw new Error(data.error || 'Error al actualizar partido');
            }
        } catch (error) {
            console.error('Error updating single match:', error);
            this.showError('Error al actualizar el partido: ' + error.message);
        }
    }
}

// Make adminApp globally available for onclick handlers
let adminApp;

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminResultsApp();
});