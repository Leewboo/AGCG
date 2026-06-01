const Game = {
    board: [],
    terrain: [],
    pieces: [],
    currentPlayer: 1,
    selectedPiece: null,
    moveRangeCells: [],
    attackRangeCells: [],
    skillRangeCells: [],
    activeSkill: null,
    gamePhase: 'selection',
    player1Pieces: [],
    player2Pieces: [],
    selectingPlayer: 1,
    selectedGenerals: [],
    logs: [],
    placingGeneral: null,
    placingIndex: 0,

    init: function() {
        this.board = Array(CONFIG.BOARD_ROWS).fill(null).map(() => Array(CONFIG.BOARD_COLS).fill(null));
        this.generateTerrain();
        this.renderSelection();
        this.setupEventListeners();
    },

    generateTerrain: function() {
        this.terrain = Array(CONFIG.BOARD_ROWS).fill(null).map(() => Array(CONFIG.BOARD_COLS).fill('grass'));
        
        const forestPositions = [[1, 1], [1, 8], [2, 2], [2, 7], [7, 2], [7, 7], [8, 1], [8, 8]];
        const mountainPositions = [[4, 0], [5, 0], [4, 9], [5, 9]];
        const waterPositions = [[4, 4], [4, 5], [5, 4], [5, 5]];
        const castlePositions = [[2, 4], [2, 5], [7, 4], [7, 5]];
        const swampPositions = [[4, 2], [5, 7]];

        forestPositions.forEach(([r, c]) => { if (r < CONFIG.BOARD_ROWS && c < CONFIG.BOARD_COLS) this.terrain[r][c] = 'forest'; });
        mountainPositions.forEach(([r, c]) => { if (r < CONFIG.BOARD_ROWS && c < CONFIG.BOARD_COLS) this.terrain[r][c] = 'mountain'; });
        waterPositions.forEach(([r, c]) => { if (r < CONFIG.BOARD_ROWS && c < CONFIG.BOARD_COLS) this.terrain[r][c] = 'water'; });
        castlePositions.forEach(([r, c]) => { if (r < CONFIG.BOARD_ROWS && c < CONFIG.BOARD_COLS) this.terrain[r][c] = 'castle'; });
        swampPositions.forEach(([r, c]) => { if (r < CONFIG.BOARD_ROWS && c < CONFIG.BOARD_COLS) this.terrain[r][c] = 'swamp'; });
    },

    renderSelection: function() {
        const container = document.getElementById('pieceSelection');
        container.innerHTML = '';
        
        Object.values(GENERALS).forEach(general => {
            const div = document.createElement('div');
            div.className = 'piece-option';
            if (this.selectedGenerals.some(g => g.id === general.id)) {
                div.classList.add('disabled');
            }
            div.innerHTML = `
                <div class="symbol">${general.symbol}</div>
                <div class="name">${general.name}</div>
                <div class="stats">❤️${general.hp} ⚔${general.attack} 🛡${general.defense}</div>
            `;
            if (!this.selectedGenerals.some(g => g.id === general.id)) {
                div.onclick = () => this.toggleGeneralSelection(general);
            }
            div.dataset.generalId = general.id;
            container.appendChild(div);
        });
        
        this.updateSelectionUI();
    },

    toggleGeneralSelection: function(general) {
        if (this.selectedGenerals.length < CONFIG.SELECTION_COUNT) {
            this.selectedGenerals.push(general);
            this.updateSelectionUI();
        }
    },

    updateSelectionUI: function() {
        document.querySelectorAll('.piece-option').forEach(el => {
            const id = el.dataset.generalId;
            const isSelected = this.selectedGenerals.some(g => g.id === id);
            el.classList.toggle('disabled', isSelected);
        });
        
        document.getElementById('selectedCount').textContent = `已选择: ${this.selectedGenerals.length}/${CONFIG.SELECTION_COUNT}`;
        document.getElementById('confirmSelection').disabled = this.selectedGenerals.length !== CONFIG.SELECTION_COUNT;
    },

    confirmSelection: function() {
        if (this.selectingPlayer === 1) {
            this.player1Pieces = this.selectedGenerals.map(g => ({
                ...g,
                player: 1,
                energy: CONFIG.INITIAL_ENERGY,
                maxEnergy: CONFIG.MAX_ENERGY
            }));
            this.selectingPlayer = 2;
            this.selectedGenerals = [];
            document.getElementById('selectionPrompt').textContent = '玩家2 选择 5 个武将';
            this.renderSelection();
        } else {
            this.player2Pieces = this.selectedGenerals.map(g => ({
                ...g,
                player: 2,
                energy: CONFIG.INITIAL_ENERGY,
                maxEnergy: CONFIG.MAX_ENERGY
            }));
            this.startPlacementPhase();
        }
    },

    startPlacementPhase: function() {
        this.gamePhase = 'placement';
        this.selectingPlayer = 1;
        this.placingIndex = 0;
        document.getElementById('selectionModal').style.display = 'none';
        this.renderPlacementPhase();
    },

    renderPlacementPhase: function() {
        const pieces = this.selectingPlayer === 1 ? this.player1Pieces : this.player2Pieces;
        this.placingGeneral = pieces[this.placingIndex];
        
        document.getElementById('placementPhase').style.display = 'block';
        document.getElementById('gamePhase').style.display = 'none';
        
        document.getElementById('placementTitle').textContent = `玩家${this.selectingPlayer} 布阵`;
        document.getElementById('placementSubtitle').textContent = `即将放置: ${this.placingGeneral.name} (蓝色区域可放置)`;
        
        const selector = document.getElementById('placementGeneralSelector');
        selector.innerHTML = '';
        pieces.forEach((p, i) => {
            const btn = document.createElement('button');
            btn.className = 'general-option' + (i === this.placingIndex ? ' selected' : '');
            btn.textContent = p.name;
            if (p.row !== undefined) {
                btn.classList.add('disabled');
                btn.textContent = p.name + ' ✓';
            }
            btn.onclick = () => {
                if (p.row === undefined) {
                    this.placingIndex = i;
                    this.renderPlacementPhase();
                }
            };
            selector.appendChild(btn);
        });
        
        this.renderBoard();
        this.highlightPlacementZone();
    },

    highlightPlacementZone: function() {
        this.moveRangeCells = [];
        this.attackRangeCells = [];
        this.skillRangeCells = [];
        
        const startRow = this.selectingPlayer === 1 ? 0 : CONFIG.BOARD_ROWS - 3;
        const endRow = this.selectingPlayer === 1 ? 2 : CONFIG.BOARD_ROWS - 1;
        
        for (let r = startRow; r <= endRow; r++) {
            for (let c = 0; c < CONFIG.BOARD_COLS; c++) {
                if (!this.board[r][c] && TERRAINS[this.terrain[r][c]].passable) {
                    this.moveRangeCells.push(`${r},${c}`);
                }
            }
        }
        this.renderBoard();
    },

    placeGeneral: function(row, col) {
        const key = `${row},${col}`;
        if (this.moveRangeCells.includes(key)) {
            this.placingGeneral.row = row;
            this.placingGeneral.col = col;
            this.placingGeneral.hasMoved = false;
            this.placingGeneral.hasAttacked = false;
            this.board[row][col] = this.placingGeneral;
            this.pieces.push(this.placingGeneral);
            
            const pieces = this.selectingPlayer === 1 ? this.player1Pieces : this.player2Pieces;
            
            let nextIndex = this.placingIndex + 1;
            while (nextIndex < pieces.length && pieces[nextIndex].row !== undefined) {
                nextIndex++;
            }
            
            if (nextIndex < pieces.length) {
                this.placingIndex = nextIndex;
                this.renderPlacementPhase();
            } else if (this.selectingPlayer === 1) {
                this.selectingPlayer = 2;
                this.placingIndex = 0;
                let i = 0;
                while (i < this.player2Pieces.length && this.player2Pieces[i].row !== undefined) {
                    i++;
                }
                this.placingIndex = i < this.player2Pieces.length ? i : 0;
                this.renderPlacementPhase();
            } else {
                this.startGame();
            }
        }
    },

    startGame: function() {
        this.gamePhase = 'playing';
        this.currentPlayer = 1;
        document.getElementById('placementPhase').style.display = 'none';
        document.getElementById('gamePhase').style.display = 'block';
        this.addLog('游戏开始！玩家1先手');
        this.renderBoard();
    },

    setupEventListeners: function() {
        document.getElementById('confirmSelection').onclick = () => this.confirmSelection();
        document.getElementById('endTurnBtn').onclick = () => this.endTurn();
        document.getElementById('restartBtn').onclick = () => this.restart();
    },

    renderBoard: function() {
        const container = document.getElementById('gameBoard');
        container.innerHTML = '';
        
        for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
            for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
                const cell = document.createElement('div');
                const terrainType = this.terrain[row][col];
                cell.className = 'cell ' + terrainType;
                
                if (row === 0) {
                    const colLabel = document.createElement('span');
                    colLabel.className = 'cell-label col';
                    colLabel.textContent = col;
                    cell.appendChild(colLabel);
                }
                if (col === 0) {
                    const rowLabel = document.createElement('span');
                    rowLabel.className = 'cell-label row';
                    rowLabel.textContent = row;
                    cell.appendChild(rowLabel);
                }
                
                const terrain = TERRAINS[terrainType];
                if (terrain.symbol) {
                    const terrainSym = document.createElement('span');
                    terrainSym.className = 'terrain-symbol';
                    terrainSym.textContent = terrain.symbol;
                    cell.appendChild(terrainSym);
                }
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = 'piece player' + piece.player;
                    pieceEl.textContent = piece.symbol;
                    cell.appendChild(pieceEl);
                }
                
                const cellKey = row + ',' + col;
                if (this.moveRangeCells.includes(cellKey)) {
                    cell.classList.add('move-range');
                }
                if (this.attackRangeCells.includes(cellKey)) {
                    cell.classList.add('attack-range');
                }
                if (this.skillRangeCells.includes(cellKey)) {
                    cell.classList.add('skill-range');
                }
                if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                    cell.classList.add('selected');
                }
                
                cell.onclick = () => this.handleCellClick(row, col);
                container.appendChild(cell);
            }
        }
        
        const turnIndicator = document.getElementById('turnIndicator');
        if (turnIndicator) {
            turnIndicator.className = 'turn-indicator player' + this.currentPlayer;
            turnIndicator.textContent = '玩家' + this.currentPlayer + ' 回合';
        }
    },

    handleCellClick: function(row, col) {
        if (this.gamePhase === 'placement') {
            this.placeGeneral(row, col);
            return;
        }
        
        if (this.gamePhase !== 'playing') return;
        
        const clickedPiece = this.board[row][col];
        const cellKey = row + ',' + col;
        
        if (this.activeSkill) {
            if (this.skillRangeCells.includes(cellKey)) {
                this.executeSkill(row, col);
            }
            this.activeSkill = null;
            this.skillRangeCells = [];
            this.renderBoard();
            this.renderSkillButtons();
            return;
        }
        
        if (this.moveRangeCells.includes(cellKey) && !clickedPiece) {
            this.movePiece(this.selectedPiece, row, col);
            return;
        }
        
        if (this.attackRangeCells.includes(cellKey) && clickedPiece) {
            this.attack(this.selectedPiece, clickedPiece);
            return;
        }
        
        if (clickedPiece && clickedPiece.player === this.currentPlayer) {
            this.selectPiece(clickedPiece);
        } else {
            this.clearSelection();
        }
    },

    selectPiece: function(piece) {
        this.selectedPiece = piece;
        this.moveRangeCells = [];
        this.attackRangeCells = [];
        
        if (!piece.hasMoved) {
            const moveCells = RangeSystem.getCellsInRange(piece.row, piece.col, piece.moveRange, this.board);
            this.moveRangeCells = moveCells.filter(key => {
                const [r, c] = key.split(',').map(Number);
                const terrain = TERRAINS[this.terrain[r][c]];
                return terrain.passable && !this.board[r][c];
            });
        }
        
        if (!piece.hasAttacked) {
            const attackCells = RangeSystem.getCellsInRange(piece.row, piece.col, piece.attackRange, this.board);
            this.attackRangeCells = attackCells.filter(key => {
                const [r, c] = key.split(',').map(Number);
                const target = this.board[r][c];
                return target && target.player !== piece.player;
            });
        }
        
        this.renderBoard();
        this.renderPieceInfo();
        this.renderSkillButtons();
    },

    clearSelection: function() {
        this.selectedPiece = null;
        this.moveRangeCells = [];
        this.attackRangeCells = [];
        this.activeSkill = null;
        this.skillRangeCells = [];
        this.renderBoard();
        this.renderPieceInfo();
        this.renderSkillButtons();
    },

    movePiece: function(piece, toRow, toCol) {
        Effect.movePiece(piece, toRow, toCol);
        piece.hasMoved = true;
        this.addLog(piece.name + ' 移动到 (' + toRow + ',' + toCol + ')');
        
        piece.energy = Math.min(piece.maxEnergy, piece.energy + CONFIG.MOVE_ENERGY);
        
        this.selectPiece(piece);
    },

    attack: function(attacker, defender) {
        const terrain = TERRAINS[this.terrain[defender.row][defender.col]];
        const defenseBonus = terrain.defense;
        const effectiveDefense = defender.defense + defenseBonus;
        
        let damage = Math.max(1, Math.floor(attacker.attack * (1 - effectiveDefense / 100)));
        
        let finalDamage = damage;
        defender.skills.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (skill.type === 'passive' && skill.trigger === 'onDamage') {
                finalDamage = skill.content(defender, finalDamage);
            }
        });
        
        defender.hp -= finalDamage;
        attacker.hasAttacked = true;
        
        this.addLog(attacker.name + ' 攻击 ' + defender.name + '，造成 ' + finalDamage + ' 点伤害！');
        
        if (defender.hp <= 0) {
            defender.hp = 0;
            this.board[defender.row][defender.col] = null;
            this.pieces = this.pieces.filter(p => p !== defender);
            this.addLog(defender.name + ' 被击败了！');
            this.checkWinCondition();
        }
        
        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + CONFIG.ATTACK_ENERGY);
        
        this.selectPiece(attacker);
    },

    renderPieceInfo: function() {
        const container = document.getElementById('pieceInfo');
        if (!container) return;
        
        if (!this.selectedPiece) {
            container.innerHTML = '<p style="color: var(--text-secondary);">选择一个武将查看信息</p>';
            return;
        }
        
        const p = this.selectedPiece;
        container.innerHTML = `
            <div class="piece-icon">${p.symbol}</div>
            <div class="piece-name">${p.name}</div>
            <div class="stat-bar">
                <div class="stat-header">
                    <span class="stat-label">❤️ 生命</span>
                    <span class="stat-value">${p.hp}/${p.maxHp}</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill health-fill" style="width: ${(p.hp/p.maxHp)*100}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-header">
                    <span class="stat-label">⚡ 能量</span>
                    <span class="stat-value">${p.energy}/${p.maxEnergy}</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill energy-fill" style="width: ${(p.energy/p.maxEnergy)*100}%"></div>
                </div>
            </div>
            <div class="piece-stats">
                <span>⚔ ${p.attack}</span>
                <span>🛡 ${p.defense}</span>
            </div>
            <div class="piece-status">
                ${p.hasMoved ? '✓ 已移动' : '○ 可移动'} | ${p.hasAttacked ? '✓ 已攻击' : '○ 可攻击'}
            </div>
        `;
    },

    renderSkillButtons: function() {
        const container = document.getElementById('skillButtons');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.selectedPiece) {
            container.innerHTML = '<p style="color: var(--text-secondary);">选择武将查看技能</p>';
            return;
        }
        
        this.selectedPiece.skills.forEach(skillId => {
            const skill = SKILLS[skillId];
            const btn = document.createElement('button');
            btn.className = 'skill-btn';
            
            if (skill.type === 'passive') {
                btn.classList.add('passive');
                btn.innerHTML = '<div class="skill-name">' + skill.name + ' (被动)</div><div class="skill-desc">' + skill.description + '</div>';
                btn.disabled = true;
            } else {
                const canUse = this.selectedPiece.energy >= skill.energyCost;
                if (this.activeSkill === skillId) {
                    btn.classList.add('active');
                } else if (!canUse) {
                    btn.classList.add('disabled');
                }
                btn.innerHTML = '<div class="skill-name">' + skill.name + ' (' + skill.energyCost + '能量)</div><div class="skill-desc">' + skill.description + '</div>';
                btn.disabled = !canUse;
                btn.onclick = () => this.activateSkill(skillId);
            }
            
            container.appendChild(btn);
        });
    },

    activateSkill: function(skillId) {
        if (this.activeSkill === skillId) {
            this.activeSkill = null;
            this.skillRangeCells = [];
        } else {
            const skill = SKILLS[skillId];
            this.activeSkill = skillId;
            this.skillRangeCells = RangeSystem.getCellsInRange(
                this.selectedPiece.row, 
                this.selectedPiece.col, 
                skill.range, 
                this.board
            );
        }
        this.renderBoard();
        this.renderSkillButtons();
    },

    executeSkill: function(row, col) {
        const skill = SKILLS[this.activeSkill];
        const target = this.board[row][col];
        
        if (skill.filter(this.selectedPiece, target, row, col)) {
            this.selectedPiece.energy -= skill.energyCost;
            skill.content(this.selectedPiece, target, row, col);
            this.checkWinCondition();
        } else {
            this.addLog('无法对该目标使用此技能！');
        }
    },

    endTurn: function() {
        this.clearSelection();
        
        this.pieces.filter(p => p.player === this.currentPlayer).forEach(piece => {
            piece.skills.forEach(skillId => {
                const skill = SKILLS[skillId];
                if (skill.type === 'passive' && skill.trigger === 'onTurnStart') {
                    if (!skill.filter || skill.filter(piece)) {
                        skill.content(piece);
                    }
                }
            });
        });
        
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        this.pieces.filter(p => p.player === this.currentPlayer).forEach(piece => {
            piece.hasMoved = false;
            piece.hasAttacked = false;
        });
        
        this.addLog('玩家' + this.currentPlayer + ' 回合开始');
        this.renderBoard();
    },

    checkWinCondition: function() {
        const player1Alive = this.pieces.some(p => p.player === 1 && !p.isSummon);
        const player2Alive = this.pieces.some(p => p.player === 2 && !p.isSummon);
        
        if (!player1Alive) {
            this.showWinner(2);
        } else if (!player2Alive) {
            this.showWinner(1);
        }
    },

    showWinner: function(player) {
        this.gamePhase = 'ended';
        this.addLog('🎉 玩家' + player + ' 获胜！');
        setTimeout(() => {
            alert('🎉 玩家' + player + ' 获胜！');
        }, 100);
    },

    addLog: function(message) {
        const time = new Date().toLocaleTimeString();
        this.logs.unshift('[' + time + '] ' + message);
        if (this.logs.length > 50) this.logs.pop();
        
        const container = document.getElementById('gameLog');
        if (container) {
            container.innerHTML = this.logs.map(log => '<div class="log-entry">' + log + '</div>').join('');
        }
    },

    restart: function() {
        this.board = [];
        this.pieces = [];
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.moveRangeCells = [];
        this.attackRangeCells = [];
        this.skillRangeCells = [];
        this.activeSkill = null;
        this.gamePhase = 'selection';
        this.player1Pieces = [];
        this.player2Pieces = [];
        this.selectingPlayer = 1;
        this.selectedGenerals = [];
        this.logs = [];
        this.placingGeneral = null;
        this.placingIndex = 0;
        
        document.getElementById('selectionModal').style.display = 'flex';
        document.getElementById('placementPhase').style.display = 'none';
        document.getElementById('gamePhase').style.display = 'none';
        document.getElementById('selectionPrompt').textContent = '玩家1 选择 5 个武将';
        this.init();
    }
};
