class QuinelasApp {
    constructor() {
        this.matches = [];
        this.predictions = {};
        this.selectedCount = 0;
        this.quinelaTypes = [];
        this.selectedQuinelaType = null;
        this.init();
    }

    init() {
        this.loadQuinelaTypes();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main actions
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.showConfirmation();
        });

        document.getElementById('copy-folio').addEventListener('click', () => {
            this.copyFolio();
        });

        document.getElementById('new-quinela').addEventListener('click', () => {
            this.resetQuinela();
        });

        // Navigation
        document.getElementById('change-quinela-btn')?.addEventListener('click', () => {
            this.showQuinelaSelection();
        });

        document.getElementById('back-to-selection').addEventListener('click', () => {
            this.showQuinelaSelection();
        });

        document.getElementById('nav-home').addEventListener('click', () => {
            this.goHome();
        });


        // Confirmation modal
        document.getElementById('confirm-submit').addEventListener('click', () => {
            this.submitPredictions();
        });

        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.hideConfirmation();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    async loadQuinelaTypes() {
        try {
            this.showLoading();
            const response = await fetch('api/quinela-types.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error('API returned invalid response: ' + text.substring(0, 100));
            }
            
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown API error');
            }

            this.quinelaTypes = data.quinela_types;
            this.renderQuinelaTypes();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading quinela types:', error);
            this.showError('Error al cargar quinelas: ' + error.message);
        }
    }

    renderQuinelaTypes() {
        const container = document.getElementById('quinela-types-container');
        container.innerHTML = '';

        this.quinelaTypes.forEach(quinelType => {
            const quinelaCard = this.createQuinelaTypeCard(quinelType);
            container.appendChild(quinelaCard);
        });

        document.getElementById('quinela-selection').classList.remove('hidden');
    }

    createQuinelaTypeCard(quinelType) {
        const card = document.createElement('div');
        card.className = 'glass-effect border border-gray-600 rounded-xl p-6 cursor-pointer hover:neon-border transition-all duration-300 transform hover:scale-105';
        
        const netAmount = quinelType.price * (1 - quinelType.commission_rate / 100);
        
        card.innerHTML = `
            <div class="text-center">
                <h3 class="text-xl font-bold gradient-text mb-3">${quinelType.name}</h3>
                <p class="text-gray-300 mb-4">${quinelType.description}</p>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-charcoal p-3 rounded-lg border border-gray-700">
                        <div class="text-xs text-gray-400 uppercase">Precio</div>
                        <div class="text-2xl font-bold text-crimson">$${quinelType.price}</div>
                    </div>
                    <div class="bg-charcoal p-3 rounded-lg border border-gray-700">
                        <div class="text-xs text-gray-400 uppercase">Bolsa</div>
                        <div class="text-xl font-bold text-yellow-400">$${quinelType.accumulated_pot}</div>
                    </div>
                </div>

                <button class="w-full bg-gradient-to-r from-dark-red to-crimson text-white py-3 px-4 rounded-xl font-bold hover:from-crimson hover:to-dark-red transition-all duration-300 neon-border">
                    🎯 Seleccionar Quinela
                </button>
            </div>
        `;

        card.addEventListener('click', () => {
            this.selectQuinelaType(quinelType);
        });

        return card;
    }

    selectQuinelaType(quinelType) {
        this.selectedQuinelaType = quinelType;
        this.showSelectedQuinelaInfo();
        this.hideQuinelaSelection();
        this.loadMatches();
    }

    showSelectedQuinelaInfo() {
        document.getElementById('selected-quinela-name').textContent = this.selectedQuinelaType.name;
        document.getElementById('selected-quinela-description').textContent = this.selectedQuinelaType.description;
        document.getElementById('selected-quinela-price').textContent = `$${this.selectedQuinelaType.price}`;
        document.getElementById('selected-quinela-pot').textContent = `$${this.selectedQuinelaType.accumulated_pot}`;
        document.getElementById('selected-quinela-info').classList.remove('hidden');
        
        // Update breadcrumbs
        document.getElementById('breadcrumbs').classList.remove('hidden');
        document.getElementById('nav-current').textContent = this.selectedQuinelaType.name;
        
        this.updateProgressBar();
    }

    showQuinelaSelection() {
        document.getElementById('quinela-selection').classList.remove('hidden');
        document.getElementById('selected-quinela-info').classList.add('hidden');
        document.getElementById('matches-container').classList.add('hidden');
        this.resetPredictions();
    }

    hideQuinelaSelection() {
        document.getElementById('quinela-selection').classList.add('hidden');
    }

    async loadMatches() {
        try {
            this.showLoading();
            const response = await fetch('api/matches.php');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            this.matches = [...data.liga_mx, ...data.mls];
            this.renderMatches(data.liga_mx, data.mls);
            this.hideLoading();
        } catch (error) {
            this.showError(error.message);
        }
    }

    renderMatches(ligaMxMatches, mlsMatches) {
        this.renderLigaMXMatches(ligaMxMatches);
        this.renderMLSMatches(mlsMatches);
        document.getElementById('matches-container').classList.remove('hidden');
    }

    renderLigaMXMatches(matches) {
        const container = document.getElementById('liga-mx-matches');
        container.innerHTML = '';

        matches.forEach((match, index) => {
            const matchElement = this.createMatchElement(match, index, 'Liga MX');
            container.appendChild(matchElement);
        });
    }

    renderMLSMatches(matches) {
        const container = document.getElementById('mls-matches');
        container.innerHTML = '';

        matches.forEach((match, index) => {
            // Continue numbering from Liga MX matches
            const matchNumber = 9 + index; // Assuming 9 Liga MX matches
            const matchElement = this.createMatchElement(match, matchNumber, 'MLS');
            container.appendChild(matchElement);
        });
    }

    createMatchElement(match, matchNumber, league) {
        const homeTeam = match.teams.home.name;
        const awayTeam = match.teams.away.name;
        const date = new Date(match.fixture.date);
        const venue = match.fixture.venue?.name || 'Estadio por confirmar';
        
        const formattedDate = date.toLocaleDateString('es-MX', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        const formattedTime = date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const matchDiv = document.createElement('div');
        matchDiv.className = 'glass-effect border border-gray-600 rounded-xl p-6 animate-fadeIn hover:neon-border transition-all duration-300';
        
        matchDiv.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <span class="text-lg font-bold gradient-text">⚽ PARTIDO ${matchNumber + 1}</span>
                <span class="text-sm text-gray-400 bg-charcoal px-3 py-1 rounded-full">${formattedDate} • ${formattedTime}</span>
            </div>
            
            <div class="grid grid-cols-3 gap-4 mb-4">
                <!-- Home Team -->
                <button 
                    class="prediction-btn p-5 border-2 border-gray-600 rounded-xl text-center hover:border-crimson hover:bg-gradient-to-b hover:from-dark-red/20 hover:to-crimson/20 transition-all duration-300 font-bold transform hover:scale-105 glass-effect"
                    data-match="${matchNumber}" 
                    data-prediction="home"
                    data-team="${homeTeam}"
                >
                    <div class="text-xs text-gray-400 mb-2 uppercase tracking-wide">Local</div>
                    <div class="text-white font-black text-lg">${homeTeam}</div>
                </button>
                
                <!-- Draw -->
                <button 
                    class="prediction-btn p-5 border-2 border-gray-600 rounded-xl text-center hover:border-yellow-500 hover:bg-gradient-to-b hover:from-yellow-600/20 hover:to-yellow-500/20 transition-all duration-300 font-bold transform hover:scale-105 glass-effect"
                    data-match="${matchNumber}" 
                    data-prediction="draw"
                    data-team="Empate"
                >
                    <div class="text-xs text-gray-400 mb-2 uppercase tracking-wide">Empate</div>
                    <div class="text-yellow-400 font-black text-3xl">=</div>
                </button>
                
                <!-- Away Team -->
                <button 
                    class="prediction-btn p-5 border-2 border-gray-600 rounded-xl text-center hover:border-crimson hover:bg-gradient-to-b hover:from-dark-red/20 hover:to-crimson/20 transition-all duration-300 font-bold transform hover:scale-105 glass-effect"
                    data-match="${matchNumber}" 
                    data-prediction="away"
                    data-team="${awayTeam}"
                >
                    <div class="text-xs text-gray-400 mb-2 uppercase tracking-wide">Visitante</div>
                    <div class="text-white font-black text-lg">${awayTeam}</div>
                </button>
            </div>
            
            <div class="text-sm text-gray-400 text-center bg-charcoal p-2 rounded-lg border border-gray-700">
                🏟️ ${venue}
            </div>
        `;

        // Add event listeners to prediction buttons
        const buttons = matchDiv.querySelectorAll('.prediction-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.selectPrediction(matchNumber, button.dataset.prediction, button.dataset.team, homeTeam, awayTeam, date.toISOString(), league);
                this.updateButtonStates(matchNumber, button.dataset.prediction, buttons);
            });
        });

        return matchDiv;
    }

    selectPrediction(matchNumber, prediction, selectedTeam, homeTeam, awayTeam, matchDate, league) {
        // If this match wasn't selected before, increment count
        if (!this.predictions[matchNumber]) {
            this.selectedCount++;
        }

        this.predictions[matchNumber] = {
            prediction: prediction,
            selectedTeam: selectedTeam,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            matchDate: matchDate,
            league: league
        };

        this.updateUI();
    }

    updateButtonStates(matchNumber, selectedPrediction, buttons) {
        buttons.forEach(button => {
            const isSelected = button.dataset.prediction === selectedPrediction;
            
            // Reset all buttons
            button.classList.remove('border-crimson', 'bg-gradient-to-b', 'from-dark-red/40', 'to-crimson/40', 'border-yellow-500', 'from-yellow-600/40', 'to-yellow-500/40', 'animate-glow');
            
            if (isSelected) {
                // Style selected button based on prediction type
                if (selectedPrediction === 'home') {
                    button.classList.add('border-crimson', 'bg-gradient-to-b', 'from-dark-red/40', 'to-crimson/40', 'animate-glow');
                } else if (selectedPrediction === 'away') {
                    button.classList.add('border-crimson', 'bg-gradient-to-b', 'from-dark-red/40', 'to-crimson/40', 'animate-glow');
                } else if (selectedPrediction === 'draw') {
                    button.classList.add('border-yellow-500', 'bg-gradient-to-b', 'from-yellow-600/40', 'to-yellow-500/40', 'animate-glow');
                }
            } else {
                button.classList.add('border-gray-600');
            }
        });
    }

    updateUI() {
        document.getElementById('selected-count').textContent = this.selectedCount;
        
        const submitBtn = document.getElementById('submit-btn');
        const missingMatches = document.getElementById('missing-matches');
        const missingCount = document.getElementById('missing-count');
        
        if (this.selectedCount === 12) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🎯 Generar Quinela';
            missingMatches.classList.add('hidden');
        } else {
            submitBtn.disabled = true;
            const remaining = 12 - this.selectedCount;
            submitBtn.textContent = `Selecciona ${remaining} más`;
            missingCount.textContent = remaining;
            missingMatches.classList.remove('hidden');
        }
        
        this.updateProgressBar();
    }
    
    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar && progressText) {
            const percentage = (this.selectedCount / 12) * 100;
            progressBar.style.width = percentage + '%';
            progressText.textContent = `${this.selectedCount} / 12 partidos`;
        }
    }

    async submitPredictions() {
        if (!this.selectedQuinelaType) {
            this.showError('Por favor selecciona una quinela primero');
            return;
        }

        try {
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Generando...';

            const response = await fetch('api/submit.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    predictions: this.predictions,
                    quinela_type_id: this.selectedQuinelaType.id
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            this.showResult(data.folio);
        } catch (error) {
            this.showError(error.message);
            document.getElementById('submit-btn').disabled = false;
            document.getElementById('submit-btn').textContent = 'Generar Quinela';
        }
    }

    showResult(folio) {
        document.getElementById('folio-display').textContent = folio;
        document.getElementById('summary-quinela').textContent = this.selectedQuinelaType.name;
        document.getElementById('summary-price').textContent = `$${this.selectedQuinelaType.price}`;
        
        this.hideConfirmation();
        document.getElementById('result-modal').classList.remove('hidden');
        document.getElementById('result-modal').classList.add('flex');
    }

    copyFolio() {
        const folio = document.getElementById('folio-display').textContent;
        navigator.clipboard.writeText(folio).then(() => {
            const button = document.getElementById('copy-folio');
            const originalText = button.textContent;
            button.textContent = '✅ Copiado!';
            button.classList.add('bg-green-500');
            button.classList.remove('bg-blue-500');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-500');
                button.classList.add('bg-blue-500');
            }, 2000);
        });
    }

    resetQuinela() {
        this.resetPredictions();
        
        // Hide modal
        document.getElementById('result-modal').classList.add('hidden');
        document.getElementById('result-modal').classList.remove('flex');
        
        // Show quinela selection again
        this.showQuinelaSelection();
        
        // Refresh quinela types to update pot amounts
        this.loadQuinelaTypes();
    }

    resetPredictions() {
        this.predictions = {};
        this.selectedCount = 0;
        
        // Reset all buttons
        document.querySelectorAll('.prediction-btn').forEach(button => {
            button.classList.remove('border-crimson', 'bg-gradient-to-b', 'from-dark-red/40', 'to-crimson/40', 'border-yellow-500', 'from-yellow-600/40', 'to-yellow-500/40', 'animate-glow');
            button.classList.add('border-gray-600');
        });
        
        this.updateUI();
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('matches-container').classList.add('hidden');
        document.getElementById('error').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error-message').textContent = message;
        document.getElementById('error').classList.remove('hidden');
    }

    // New methods for improved UX
    goHome() {
        this.selectedQuinelaType = null;
        document.getElementById('quinela-selection').classList.remove('hidden');
        document.getElementById('selected-quinela-info').classList.add('hidden');
        document.getElementById('matches-container').classList.add('hidden');
        document.getElementById('breadcrumbs').classList.add('hidden');
        document.getElementById('nav-current').textContent = 'Seleccionar Quinela';
        this.resetPredictions();
    }


    showConfirmation() {
        if (this.selectedCount !== 12) {
            this.showError('Debes seleccionar los 12 partidos antes de continuar');
            return;
        }
        
        document.getElementById('confirmation-modal').classList.remove('hidden');
        document.getElementById('confirmation-modal').classList.add('flex');
    }

    hideConfirmation() {
        document.getElementById('confirmation-modal').classList.add('hidden');
        document.getElementById('confirmation-modal').classList.remove('flex');
    }

    handleKeyboardShortcuts(e) {
        // ESC key - go back or close modals
        if (e.key === 'Escape') {
            if (!document.getElementById('confirmation-modal').classList.contains('hidden')) {
                this.hideConfirmation();
            } else if (!document.getElementById('result-modal').classList.contains('hidden')) {
                // Don't allow closing result modal with ESC
            } else if (!document.getElementById('quinela-selection').classList.contains('hidden')) {
                // Already at home
            } else {
                this.showQuinelaSelection();
            }
        }

        // Ctrl+Enter - submit (if ready)
        if (e.ctrlKey && e.key === 'Enter' && this.selectedCount === 12) {
            this.showConfirmation();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuinelasApp();
});