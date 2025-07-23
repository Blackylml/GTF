class QuinelasApp {
    constructor() {
        this.matches = [];
        this.predictions = {};
        this.selectedCount = 0;
        this.quinelaTypes = [];
        this.selectedQuinelaType = null;
        this.init();
    }

    // Team shield mapping function
    getTeamShield(teamName, league) {
        const leagueFolder = league === 'Liga MX' ? 'ligamx' : 'mls';
        
        // Normalize team name to match file names
        const normalizedName = this.normalizeTeamName(teamName);
        
        return `shields/${leagueFolder}/${normalizedName}.png`;
    }

    normalizeTeamName(teamName) {
        // Add logging to debug team names
        console.log('Team name received:', teamName);
        
        // Map team names to shield file names
        const teamMappings = {
            // Liga MX mappings - Adding more variations
            'Club América': 'america',
            'CF América': 'america',
            'América': 'america',
            'America': 'america',
            'Club America': 'america',
            
            'Atlas FC': 'atlas',
            'Atlas': 'atlas',
            
            'Atlético San Luis': 'atleticosl',
            'Atletico San Luis': 'atleticosl',
            'Club Atlético San Luis': 'atleticosl',
            'San Luis': 'atleticosl',
            
            'Cruz Azul': 'cruzazul',
            'Cruz Azul FC': 'cruzazul',
            
            'Guadalajara': 'guadalajara',
            'Club Guadalajara': 'guadalajara',
            'Chivas': 'guadalajara',
            'Chivas Guadalajara': 'guadalajara',
            'CD Guadalajara': 'guadalajara',
            
            'FC Juárez': 'juarez',
            'FC Juarez': 'juarez',
            'Juárez': 'juarez',
            'Juarez': 'juarez',
            'Club Juarez': 'juarez',
            
            'León': 'leon',
            'Leon': 'leon',
            'Club León': 'leon',
            'Club Leon': 'leon',
            
            'FC Mazatlán': 'mazatlan',
            'FC Mazatlan': 'mazatlan',
            'Mazatlán': 'mazatlan',
            'Mazatlan': 'mazatlan',
            
            'Monterrey': 'monterrey',
            'CF Monterrey': 'monterrey',
            'Club Monterrey': 'monterrey',
            'Rayados': 'monterrey',
            
            'Club Necaxa': 'necaxa',
            'Necaxa': 'necaxa',
            
            'CF Pachuca': 'pachuca',
            'Pachuca': 'pachuca',
            'Club Pachuca': 'pachuca',
            
            'FC Puebla': 'puebla',
            'Puebla': 'puebla',
            'Club Puebla': 'puebla',
            
            'Pumas UNAM': 'pumas',
            'Pumas': 'pumas',
            'Club Universidad Nacional': 'pumas',
            'Universidad Nacional': 'pumas',
            
            'FC Querétaro': 'queretaro',
            'FC Queretaro': 'queretaro',
            'Querétaro': 'queretaro',
            'Queretaro': 'queretaro',
            'Club Querétaro': 'queretaro',
            'Club Queretaro': 'queretaro',
            
            'Santos Laguna': 'santos',
            'Santos': 'santos',
            'Club Santos': 'santos',
            
            'Tigres UANL': 'tigres',
            'Tigres': 'tigres',
            'Club Tigres': 'tigres',
            
            'Club Tijuana': 'tijuana',
            'Tijuana': 'tijuana',
            'Club de Fútbol Tijuana': 'tijuana',
            'Xolos': 'tijuana',
            
            'Toluca FC': 'toluca',
            'Toluca': 'toluca',
            'Club Toluca': 'toluca',
            
            // MLS mappings
            'Atlanta United FC': 'atlanta',
            'Atlanta United': 'atlanta',
            'Austin FC': 'austin',
            'Charlotte FC': 'charlotte',
            'Chicago Fire FC': 'chicago',
            'Chicago Fire': 'chicago',
            'FC Cincinnati': 'cincinnati',
            'Cincinnati': 'cincinnati',
            'Colorado Rapids': 'colorado',
            'Columbus Crew': 'columbus',
            'FC Dallas': 'dallas',
            'Dallas': 'dallas',
            'D.C. United': 'dcunited',
            'DC United': 'dcunited',
            'Houston Dynamo FC': 'houstondynamo',
            'Houston Dynamo': 'houstondynamo',
            'Inter Miami CF': 'intermiami',
            'Inter Miami': 'intermiami',
            'Sporting Kansas City': 'kansascity',
            'Kansas City': 'kansascity',
            'LAFC': 'losangeles',
            'Los Angeles FC': 'losangeles',
            'LA Galaxy': 'losangelesgalaxy',
            'Los Angeles Galaxy': 'losangelesgalaxy',
            'Minnesota United FC': 'minnesota',
            'Minnesota United': 'minnesota',
            'CF Montréal': 'montreal',
            'Montreal': 'montreal',
            'Nashville SC': 'nashville',
            'New England Revolution': 'newengland',
            'New York Red Bulls': 'newyork',
            'New York City FC': 'newyorkcity',
            'Orlando City SC': 'orlandocity',
            'Orlando City': 'orlandocity',
            'Philadelphia Union': 'philadelphia',
            'Portland Timbers': 'portland',
            'Real Salt Lake': 'realstaltlake',
            'San Diego FC': 'sandiego',
            'San Jose Earthquakes': 'sanjose',
            'Seattle Sounders FC': 'seattle',
            'Seattle Sounders': 'seattle',
            'St. Louis CITY SC': 'st_louis_city',
            'St Louis City': 'st_louis_city',
            'Toronto FC': 'toronto',
            'Vancouver Whitecaps FC': 'vancouver',
            'Vancouver Whitecaps': 'vancouver'
        };

        const mapped = teamMappings[teamName];
        if (mapped) {
            console.log(`Mapped "${teamName}" to "${mapped}"`);
            return mapped;
        }
        
        // Try without accents
        const withoutAccents = teamName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const mappedWithoutAccents = teamMappings[withoutAccents];
        if (mappedWithoutAccents) {
            console.log(`Mapped "${teamName}" (without accents: "${withoutAccents}") to "${mappedWithoutAccents}"`);
            return mappedWithoutAccents;
        }
        
        // Fallback: clean the team name
        const fallback = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
        console.log(`No mapping found for "${teamName}", using fallback: "${fallback}"`);
        return fallback;
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
                <h3 class="text-lg sm:text-xl font-bold gradient-text mb-3">${quinelType.name}</h3>
                <p class="text-gray-300 mb-4 text-sm sm:text-base">${quinelType.description}</p>
                
                <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div class="bg-charcoal p-2 sm:p-3 rounded-lg border border-gray-700">
                        <div class="text-xs text-gray-400 uppercase">Precio</div>
                        <div class="text-xl sm:text-2xl font-bold text-crimson">$${quinelType.price}</div>
                    </div>
                    <div class="bg-charcoal p-2 sm:p-3 rounded-lg border border-gray-700">
                        <div class="text-xs text-gray-400 uppercase">Bolsa</div>
                        <div class="text-lg sm:text-xl font-bold text-yellow-400">$${quinelType.accumulated_pot}</div>
                    </div>
                </div>

                <button class="w-full bg-gradient-to-r from-dark-red to-crimson text-white py-2 sm:py-3 px-4 rounded-xl font-bold hover:from-crimson hover:to-dark-red transition-all duration-300 neon-border text-sm sm:text-base">
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
        matchDiv.className = 'glass-effect border border-gray-600 rounded-xl p-4 sm:p-6 animate-fadeIn hover:neon-border transition-all duration-300';
        
        // Get team shields
        const homeShield = this.getTeamShield(homeTeam, league);
        const awayShield = this.getTeamShield(awayTeam, league);
        
        matchDiv.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
                <div class="flex items-center gap-2">
                    <span class="text-base sm:text-lg font-bold gradient-text">⚽ PARTIDO ${matchNumber + 1}</span>
                    <span class="text-xs sm:text-sm text-gray-400 font-semibold">${league}</span>
                </div>
                <span class="text-xs sm:text-sm text-gray-400 bg-charcoal px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">${formattedDate} • ${formattedTime}</span>
            </div>

            <!-- Teams matchup display -->
            <div class="flex items-center justify-between mb-6 px-2">
                <div class="flex flex-col items-center text-center flex-1">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                        <img src="${homeShield}" alt="${homeTeam}" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; console.log('Failed to load: ${homeShield}');">
                        <div class="text-2xl sm:text-3xl font-bold text-crimson hidden items-center justify-center">🏠</div>
                    </div>
                    <span class="text-xs sm:text-sm font-bold text-white leading-tight">${homeTeam}</span>
                    <span class="text-xs text-gray-400">LOCAL</span>
                </div>
                
                <div class="flex flex-col items-center mx-4">
                    <div class="text-2xl sm:text-3xl font-bold text-gray-400 mb-1">VS</div>
                    <div class="text-xs text-gray-500">${formattedTime}</div>
                </div>
                
                <div class="flex flex-col items-center text-center flex-1">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                        <img src="${awayShield}" alt="${awayTeam}" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; console.log('Failed to load: ${awayShield}');">
                        <div class="text-2xl sm:text-3xl font-bold text-crimson hidden items-center justify-center">✈️</div>
                    </div>
                    <span class="text-xs sm:text-sm font-bold text-white leading-tight">${awayTeam}</span>
                    <span class="text-xs text-gray-400">VISITANTE</span>
                </div>
            </div>
            
            <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                <!-- Home Team -->
                <button 
                    class="prediction-btn p-3 sm:p-4 border-2 border-gray-600 rounded-xl text-center hover:border-crimson hover:bg-gradient-to-b hover:from-dark-red/20 hover:to-crimson/20 transition-all duration-300 font-bold transform hover:scale-105 glass-effect group"
                    data-match="${matchNumber}" 
                    data-prediction="home"
                    data-team="${homeTeam}"
                >
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                            <img src="${homeShield}" alt="${homeTeam}" class="w-full h-full object-contain group-hover:scale-110 transition-transform" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="text-lg sm:text-xl font-bold text-crimson hidden items-center justify-center">🏠</div>
                        </div>
                        <div class="text-xs text-gray-400 uppercase tracking-wide">Local</div>
                        <div class="text-white font-bold text-xs sm:text-sm leading-tight mt-1">${homeTeam.split(' ')[0]}</div>
                    </div>
                </button>
                
                <!-- Draw -->
                <button 
                    class="prediction-btn p-3 sm:p-4 border-2 border-gray-600 rounded-xl text-center hover:border-yellow-500 hover:bg-gradient-to-b hover:from-yellow-600/20 hover:to-yellow-500/20 transition-all duration-300 font-bold transform hover:scale-105 glass-effect group"
                    data-match="${matchNumber}" 
                    data-prediction="draw"
                    data-team="Empate"
                >
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                            <div class="text-yellow-400 font-black text-2xl sm:text-3xl group-hover:scale-110 transition-transform">=</div>
                        </div>
                        <div class="text-xs text-gray-400 uppercase tracking-wide">Empate</div>
                        <div class="text-yellow-400 font-bold text-xs sm:text-sm leading-tight mt-1">Empate</div>
                    </div>
                </button>
                
                <!-- Away Team -->
                <button 
                    class="prediction-btn p-3 sm:p-4 border-2 border-gray-600 rounded-xl text-center hover:border-crimson hover:bg-gradient-to-b hover:from-dark-red/20 hover:to-crimson/20 transition-all duration-300 font-bold transform hover:scale-105 glass-effect group"
                    data-match="${matchNumber}" 
                    data-prediction="away"
                    data-team="${awayTeam}"
                >
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                            <img src="${awayShield}" alt="${awayTeam}" class="w-full h-full object-contain group-hover:scale-110 transition-transform" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="text-lg sm:text-xl font-bold text-crimson hidden items-center justify-center">✈️</div>
                        </div>
                        <div class="text-xs text-gray-400 uppercase tracking-wide">Visitante</div>
                        <div class="text-white font-bold text-xs sm:text-sm leading-tight mt-1">${awayTeam.split(' ')[0]}</div>
                    </div>
                </button>
            </div>
            
            <div class="text-xs sm:text-sm text-gray-400 text-center bg-charcoal p-2 rounded-lg border border-gray-700">
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