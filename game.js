
const RANGE_TYPES = {
    PLUS: '+',
    X: 'x',
    CIRCLE: 'r'
};

const Effect = {
    damage: (attacker, defender, amount) => {
        const defense = defender.defense || 0;
        const actualDamage = Math.max(1, Math.floor(amount * (1 - defense / 100)));
        defender.hp -= actualDamage;
        Game.addLog(`${attacker.name} 对 ${defender.name} 造成 ${actualDamage} 点伤害！`);
        if (defender.hp <= 0) {
            defender.hp = 0;
            Game.addLog(`${defender.name} 被击败了！`);
        }
        Game.renderBoard();
    },
    
    heal: (target, amount) => {
        const healed = Math.min(amount, target.maxHp - target.hp);
        target.hp += healed;
        Game.addLog(`${target.name} 恢复了 ${healed} 点生命值！`);
        Game.renderBoard();
    },
    
    buff: (target, stat, amount, duration = 3) => {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat, amount, duration });
        target[stat] = (target[stat] || 0) + amount;
        Game.addLog(`${target.name} 获得了 ${stat}+${amount} 的增益！`);
    },
    
    movePiece: (piece, toRow, toCol) => {
        Game.board[piece.row][piece.col] = null;
        piece.row = toRow;
        piece.col = toCol;
        Game.board[toRow][toCol] = piece;
    },
    
    summon: (summoner, summonType, row, col) => {
        if (!Game.board[row][col]) {
            const summon = {
                ...SUMMONS[summonType],
                player: summoner.player,
                row,
                col,
                isSummon: true
            };
            Game.board[row][col] = summon;
            Game.pieces.push(summon);
            Game.addLog(`${summoner.name} 召唤了 ${summon.name}！`);
            Game.renderBoard();
        }
    },
    
    energize: (target, amount) => {
        target.energy = Math.min(target.maxEnergy, target.energy + amount);
        Game.addLog(`${target.name} 获得了 ${amount} 点能量！`);
    }
};

const RangeSystem = {
    getCellsInRange: (row, col, rangePatterns, board) => {
        const cells = new Set();
        rangePatterns.forEach(pattern => {
            const type = pattern[0];
            const n = parseInt(pattern.slice(1));
            switch (type) {
                case RANGE_TYPES.PLUS:
                    RangeSystem.getPlusRange(row, col, n, board, cells);
                    break;
                case RANGE_TYPES.X:
                    RangeSystem.getXRange(row, col, n, board, cells);
                    break;
                case RANGE_TYPES.CIRCLE:
                    RangeSystem.getCircleRange(row, col, n, board, cells);
                    break;
            }
        });
        return Array.from(cells);
    },
    
    getPlusRange: (row, col, n, board, cells) => {
        for (let i = 1; i <= n; i++) {
            if (row - i >= 0) cells.add(`${row - i},${col}`);
            if (row + i < board.length) cells.add(`${row + i},${col}`);
            if (col - i >= 0) cells.add(`${row},${col - i}`);
            if (col + i < board[0].length) cells.add(`${row},${col + i}`);
        }
    },
    
    getXRange: (row, col, n, board, cells) => {
        for (let i = 1; i <= n; i++) {
            if (row - i >= 0 && col - i >= 0) cells.add(`${row - i},${col - i}`);
            if (row - i >= 0 && col + i < board[0].length) cells.add(`${row - i},${col + i}`);
            if (row + i < board.length && col - i >= 0) cells.add(`${row + i},${col - i}`);
            if (row + i < board.length && col + i < board[0].length) cells.add(`${row + i},${col + i}`);
        }
    },
    
    getCircleRange: (row, col, n, board, cells) => {
        for (let dr = -n; dr <= n; dr++) {
            for (let dc = -n; dc <= n; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length) {
                    if (Math.abs(dr) + Math.abs(dc) <= n) {
                        cells.add(`${newRow},${newCol}`);
                    }
                }
            }
        }
    }
};

const TERRAINS = {
    grass: { name: '草地', moveCost: 1, defense: 0, passable: true, symbol: '🌿' },
    forest: { name: '森林', moveCost: 2, defense: 10, passable: true, symbol: '🌲' },
    mountain: { name: '山地', moveCost: 3, defense: 20, passable: true, symbol: '⛰️' },
    water: { name: '水域', moveCost: Infinity, defense: 0, passable: false, symbol: '💧' },
    default: { name: '平地', moveCost: 1, defense: 0, passable: true, symbol: '' }
};

const EQUIPMENT = {
    sword: { name: '青龙偃月刀', slot: 'weapon', attack: 15, hp: 0 },
    spear: { name: '丈八蛇矛', slot: 'weapon', attack: 12, hp: 10 },
    bow: { name: '养由基弓', slot: 'weapon', attack: 10, range: 1 },
    armor: { name: '鱼鳞甲', slot: 'armor', attack: 0, hp: 30, defense: 10 },
    robe: { name: '鹤氅', slot: 'armor', attack: 5, hp: 20, defense: 5 },
    ring: { name: '力量戒指', slot: 'accessory', attack: 8, hp: 0 },
    amulet: { name: '护身符', slot: 'accessory', attack: 0, hp: 25 }
};

const SKILLS = {
    fireAttack: {
        name: '火攻',
        type: 'active',
        category: 'charge',
        energyCost: 30,
        range: ['r2'],
        description: '对目标造成25点伤害',
        filter: (user, target) => target && target.player !== user.player,
        content: (user, target) => {
            Effect.damage(user, target, 25);
        }
    },
    heal: {
        name: '治疗',
        type: 'active',
        category: 'charge',
        energyCost: 25,
        range: ['+1', 'x1'],
        description: '恢复目标20点生命',
        filter: (user, target) => target && target.player === user.player,
        content: (user, target) => {
            Effect.heal(target, 20);
        }
    },
    fury: {
        name: '狂暴',
        type: 'passive',
        category: 'special',
        description: '生命值低于30%时，攻击力+50%',
        trigger: 'onTurnStart',
        filter: (user) => user.hp / user.maxHp < 0.3,
        content: (user) => {
            if (!user.furyActive) {
                user.attack = Math.floor(user.attack * 1.5);
                user.furyActive = true;
                Game.addLog(`${user.name} 进入狂暴状态！`);
            }
        }
    },
    warCry: {
        name: '战吼',
        type: 'active',
        category: 'special',
        energyCost: 40,
        range: ['r1'],
        description: '提升周围友军攻击力',
        filter: (user, target) => target && target.player === user.player,
        content: (user, target) => {
            Effect.buff(target, 'attack', 10, 3);
        }
    },
    summonSoldier: {
        name: '召唤士兵',
        type: 'active',
        category: 'summon',
        energyCost: 50,
        range: ['+1'],
        description: '在相邻空格召唤一个士兵',
        filter: (user, target, row, col) => !target,
        content: (user, target, row, col) => {
            Effect.summon(user, 'soldier', row, col);
        }
    },
    shieldWall: {
        name: '铁壁',
        type: 'passive',
        category: 'special',
        description: '受到伤害减少20%',
        trigger: 'onDamage',
        content: (user, damage) => {
            return Math.floor(damage * 0.8);
        }
    }
};

const SUMMONS = {
    soldier: {
        name: '士兵',
        symbol: '⚔️',
        hp: 30,
        maxHp: 30,
        attack: 8,
        defense: 5,
        moveRange: ['r2'],
        attackRange: ['+1'],
        skills: []
    }
};

const GENERALS = {
    guanYu: {
        id: 'guanYu',
        name: '关羽',
        symbol: '🗡️',
        hp: 100,
        maxHp: 100,
        attack: 25,
        defense: 15,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r2'],
        attackRange: ['+1'],
        skills: ['fireAttack', 'fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    zhangFei: {
        id: 'zhangFei',
        name: '张飞',
        symbol: '🔱',
        hp: 110,
        maxHp: 110,
        attack: 28,
        defense: 12,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r2'],
        attackRange: ['+1'],
        skills: ['warCry', 'fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    zhugeLiang: {
        id: 'zhugeLiang',
        name: '诸葛亮',
        symbol: '📜',
        hp: 70,
        maxHp: 70,
        attack: 15,
        defense: 8,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r2'],
        attackRange: ['r2'],
        skills: ['heal', 'summonSoldier'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    caoCao: {
        id: 'caoCao',
        name: '曹操',
        symbol: '👑',
        hp: 90,
        maxHp: 90,
        attack: 22,
        defense: 18,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r3'],
        attackRange: ['+1'],
        skills: ['warCry', 'shieldWall'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    sunQuan: {
        id: 'sunQuan',
        name: '孙权',
        symbol: '🌊',
        hp: 85,
        maxHp: 85,
        attack: 20,
        defense: 16,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r2'],
        attackRange: ['x1', '+1'],
        skills: ['heal', 'shieldWall'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    zhaoYun: {
        id: 'zhaoYun',
        name: '赵云',
        symbol: '⚡',
        hp: 95,
        maxHp: 95,
        attack: 26,
        defense: 14,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r3'],
        attackRange: ['+1'],
        skills: ['fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    maChao: {
        id: 'maChao',
        name: '马超',
        symbol: '🐴',
        hp: 88,
        maxHp: 88,
        attack: 27,
        defense: 11,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r4'],
        attackRange: ['+1'],
        skills: ['fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    huangZhong: {
        id: 'huangZhong',
        name: '黄忠',
        symbol: '🏹',
        hp: 75,
        maxHp: 75,
        attack: 24,
        defense: 9,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r2'],
        attackRange: ['r3'],
        skills: ['fireAttack'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    luBu: {
        id: 'luBu',
        name: '吕布',
        symbol: '🔥',
        hp: 120,
        maxHp: 120,
        attack: 35,
        defense: 10,
        energy: 0,
        maxEnergy: 100,
        moveRange: ['r2'],
        attackRange: ['+1', 'x1'],
        skills: ['fury', 'warCry'],
        equipment: { weapon: null, armor: null, accessory: null }
    }
};

const Game = {
    board: [],
    terrain: [],
    pieces: [],
    currentPlayer: 1,
    selectedPiece: null,
    moveRangeCells: [],
    attackRangeCells: [],
    activeSkill: null,
    skillRangeCells: [],
    gamePhase: 'selection',
    player1Pieces: [],
    player2Pieces: [],
    selectingPlayer: 1,
    selectedGenerals: [],
    logs: [],
    
    init: () => {
        Game.board = Array(8).fill(null).map(() => Array(10).fill(null));
        Game.generateTerrain();
        Game.renderSelection();
        Game.renderBoard();
        Game.setupEventListeners();
    },
    
    generateTerrain: () => {
        Game.terrain = Array(8).fill(null).map(() => Array(10).fill('default'));
        const forestPositions = [[1,3],[1,4],[2,3],[5,6],[5,7],[6,6]];
        const mountainPositions = [[3,4],[3,5],[4,4],[4,5]];
        const waterPositions = [[2,7],[3,7],[4,2],[5,2]];
        
        forestPositions.forEach(([r,c]) => Game.terrain[r][c] = 'forest');
        mountainPositions.forEach(([r,c]) => Game.terrain[r][c] = 'mountain');
        waterPositions.forEach(([r,c]) => Game.terrain[r][c] = 'water');
    },
    
    renderSelection: () => {
        const container = document.getElementById('pieceSelection');
        container.innerHTML = '';
        
        Object.values(GENERALS).forEach(general => {
            const div = document.createElement('div');
            div.className = 'piece-option';
            div.innerHTML = `
                <div class="symbol">${general.symbol}</div>
                <div class="name">${general.name}</div>
                <div class="stats">
                    ❤️${general.hp} ⚔️${general.attack} 🛡️${general.defense}
                </div>
            `;
            div.onclick = () => Game.toggleGeneralSelection(general);
            div.dataset.generalId = general.id;
            container.appendChild(div);
        });
        
        Game.updateSelectionUI();
    },
    
    toggleGeneralSelection: (general) => {
        const index = Game.selectedGenerals.findIndex(g => g.id === general.id);
        if (index >= 0) {
            Game.selectedGenerals.splice(index, 1);
        } else if (Game.selectedGenerals.length < 5) {
            Game.selectedGenerals.push(general);
        }
        Game.updateSelectionUI();
    },
    
    updateSelectionUI: () => {
        document.querySelectorAll('.piece-option').forEach(el => {
            const id = el.dataset.generalId;
            const isSelected = Game.selectedGenerals.some(g => g.id === id);
            el.classList.toggle('selected', isSelected);
        });
        
        document.getElementById('selectedCount').textContent = `已选择: ${Game.selectedGenerals.length}/5`;
        document.getElementById('confirmSelection').disabled = Game.selectedGenerals.length !== 5;
    },
    
    confirmSelection: () => {
        if (Game.selectingPlayer === 1) {
            Game.player1Pieces = Game.selectedGenerals.map(g => ({...g, player: 1}));
            Game.selectingPlayer = 2;
            Game.selectedGenerals = [];
            document.getElementById('selectionPrompt').textContent = '玩家2 选择 5 个武将';
            Game.updateSelectionUI();
        } else {
            Game.player2Pieces = Game.selectedGenerals.map(g => ({...g, player: 2}));
            document.getElementById('selectionModal').style.display = 'none';
            Game.startGame();
        }
    },
    
    startGame: () => {
        Game.gamePhase = 'playing';
        Game.pieces = [...Game.player1Pieces, ...Game.player2Pieces];
        
        const player1Positions = [[0,0],[0,2],[0,4],[0,6],[0,8]];
        const player2Positions = [[7,1],[7,3],[7,5],[7,7],[7,9]];
        
        Game.player1Pieces.forEach((piece, i) => {
            const [r, c] = player1Positions[i];
            piece.row = r;
            piece.col = c;
            piece.hasMoved = false;
            piece.hasAttacked = false;
            Game.board[r][c] = piece;
        });
        
        Game.player2Pieces.forEach((piece, i) => {
            const [r, c] = player2Positions[i];
            piece.row = r;
            piece.col = c;
            piece.hasMoved = false;
            piece.hasAttacked = false;
            Game.board[r][c] = piece;
        });
        
        Game.addLog('游戏开始！玩家1先手');
        Game.renderBoard();
    },
    
    setupEventListeners: () => {
        document.getElementById('confirmSelection').onclick = Game.confirmSelection;
        document.getElementById('endTurnBtn').onclick = Game.endTurn;
        document.getElementById('restartBtn').onclick = Game.restart;
    },
    
    renderBoard: () => {
        const container = document.getElementById('gameBoard');
        container.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                const terrainType = Game.terrain[row][col];
                cell.className = `cell ${terrainType}`;
                
                const terrain = TERRAINS[terrainType];
                if (terrain.symbol) {
                    const label = document.createElement('span');
                    label.className = 'terrain-label';
                    label.textContent = terrain.symbol;
                    cell.appendChild(label);
                }
                
                const piece = Game.board[row][col];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece player${piece.player}`;
                    pieceEl.textContent = piece.symbol;
                    cell.appendChild(pieceEl);
                }
                
                const cellKey = `${row},${col}`;
                if (Game.moveRangeCells.includes(cellKey)) {
                    cell.classList.add('move-range');
                }
                if (Game.attackRangeCells.includes(cellKey)) {
                    cell.classList.add('attack-range');
                }
                if (Game.skillRangeCells.includes(cellKey)) {
                    cell.classList.add('attack-range');
                }
                if (Game.selectedPiece && Game.selectedPiece.row === row && Game.selectedPiece.col === col) {
                    cell.classList.add('selected');
                }
                
                cell.onclick = () => Game.handleCellClick(row, col);
                container.appendChild(cell);
            }
        }
        
        document.getElementById('turnIndicator').className = `turn-indicator player${Game.currentPlayer}`;
        document.getElementById('turnIndicator').textContent = `玩家${Game.currentPlayer} 回合`;
    },
    
    handleCellClick: (row, col) => {
        if (Game.gamePhase !== 'playing') return;
        
        const clickedPiece = Game.board[row][col];
        const cellKey = `${row},${col}`;
        
        if (Game.activeSkill) {
            if (Game.skillRangeCells.includes(cellKey)) {
                Game.executeSkill(row, col);
            }
            Game.activeSkill = null;
            Game.skillRangeCells = [];
            Game.renderBoard();
            Game.renderSkillButtons();
            return;
        }
        
        if (Game.moveRangeCells.includes(cellKey) && !clickedPiece) {
            Game.movePiece(Game.selectedPiece, row, col);
            return;
        }
        
        if (Game.attackRangeCells.includes(cellKey) && clickedPiece) {
            Game.attack(Game.selectedPiece, clickedPiece);
            return;
        }
        
        if (clickedPiece && clickedPiece.player === Game.currentPlayer) {
            Game.selectPiece(clickedPiece);
        } else {
            Game.clearSelection();
        }
    },
    
    selectPiece: (piece) => {
        Game.selectedPiece = piece;
        Game.moveRangeCells = [];
        Game.attackRangeCells = [];
        
        if (!piece.hasMoved) {
            const moveCells = RangeSystem.getCellsInRange(piece.row, piece.col, piece.moveRange, Game.board);
            Game.moveRangeCells = moveCells.filter(key => {
                const [r, c] = key.split(',').map(Number);
                const terrain = TERRAINS[Game.terrain[r][c]];
                return terrain.passable && !Game.board[r][c];
            });
        }
        
        if (!piece.hasAttacked) {
            const attackCells = RangeSystem.getCellsInRange(piece.row, piece.col, piece.attackRange, Game.board);
            Game.attackRangeCells = attackCells.filter(key => {
                const [r, c] = key.split(',').map(Number);
                const target = Game.board[r][c];
                return target && target.player !== piece.player;
            });
        }
        
        Game.renderBoard();
        Game.renderPieceInfo();
        Game.renderSkillButtons();
    },
    
    clearSelection: () => {
        Game.selectedPiece = null;
        Game.moveRangeCells = [];
        Game.attackRangeCells = [];
        Game.activeSkill = null;
        Game.skillRangeCells = [];
        Game.renderBoard();
        Game.renderPieceInfo();
        Game.renderSkillButtons();
    },
    
    movePiece: (piece, toRow, toCol) => {
        Effect.movePiece(piece, toRow, toCol);
        piece.hasMoved = true;
        Game.addLog(`${piece.name} 移动到 (${toRow},${toCol})`);
        
        piece.energy = Math.min(piece.maxEnergy, piece.energy + 10);
        
        Game.selectPiece(piece);
    },
    
    attack: (attacker, defender) => {
        const terrain = TERRAINS[Game.terrain[defender.row][defender.col]];
        const defenseBonus = terrain.defense;
        const effectiveDefense = defender.defense + defenseBonus;
        
        const damage = Math.max(1, Math.floor(attacker.attack * (1 - effectiveDefense / 100)));
        
        let finalDamage = damage;
        defender.skills.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (skill.type === 'passive' && skill.trigger === 'onDamage') {
                finalDamage = skill.content(defender, finalDamage);
            }
        });
        
        defender.hp -= finalDamage;
        attacker.hasAttacked = true;
        
        Game.addLog(`${attacker.name} 攻击 ${defender.name}，造成 ${finalDamage} 点伤害！`);
        
        if (defender.hp <= 0) {
            defender.hp = 0;
            Game.board[defender.row][defender.col] = null;
            Game.pieces = Game.pieces.filter(p => p !== defender);
            Game.addLog(`${defender.name} 被击败了！`);
            Game.checkWinCondition();
        }
        
        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 15);
        
        Game.selectPiece(attacker);
    },
    
    renderPieceInfo: () => {
        const container = document.getElementById('pieceInfo');
        if (!Game.selectedPiece) {
            container.innerHTML = '<p style="color: var(--text-light);">选择一个武将查看信息</p>';
            return;
        }
        
        const p = Game.selectedPiece;
        container.innerHTML = `
            <div class="piece-symbol">${p.symbol}</div>
            <div class="piece-name">${p.name}</div>
            <div class="stat-bar">
                <div class="stat-label">
                    <span>❤️ 生命</span>
                    <span>${p.hp}/${p.maxHp}</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill health-fill" style="width: ${(p.hp/p.maxHp)*100}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-label">
                    <span>⚡ 能量</span>
                    <span>${p.energy}/${p.maxEnergy}</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill energy-fill" style="width: ${(p.energy/p.maxEnergy)*100}%"></div>
                </div>
            </div>
            <div class="piece-stats">
                <span>⚔️ ${p.attack}</span>
                <span>🛡️ ${p.defense}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;">
                ${p.hasMoved ? '✓ 已移动' : '○ 可移动'} | ${p.hasAttacked ? '✓ 已攻击' : '○ 可攻击'}
            </div>
        `;
    },
    
    renderSkillButtons: () => {
        const container = document.getElementById('skillButtons');
        container.innerHTML = '';
        
        if (!Game.selectedPiece) {
            container.innerHTML = '<p style="color: var(--text-light);">选择武将查看技能</p>';
            return;
        }
        
        Game.selectedPiece.skills.forEach(skillId => {
            const skill = SKILLS[skillId];
            const btn = document.createElement('button');
            btn.className = 'skill-btn';
            
            if (skill.type === 'passive') {
                btn.classList.add('passive');
                btn.innerHTML = `<div class="skill-name">${skill.name} (被动)</div><div class="skill-desc">${skill.description}</div>`;
                btn.disabled = true;
            } else {
                const canUse = Game.selectedPiece.energy >= skill.energyCost;
                if (Game.activeSkill === skillId) {
                    btn.classList.add('active');
                } else if (!canUse) {
                    btn.classList.add('disabled');
                }
                btn.innerHTML = `<div class="skill-name">${skill.name} (${skill.energyCost}能量)</div><div class="skill-desc">${skill.description}</div>`;
                btn.disabled = !canUse;
                btn.onclick = () => Game.activateSkill(skillId);
            }
            
            container.appendChild(btn);
        });
    },
    
    activateSkill: (skillId) => {
        if (Game.activeSkill === skillId) {
            Game.activeSkill = null;
            Game.skillRangeCells = [];
        } else {
            const skill = SKILLS[skillId];
            Game.activeSkill = skillId;
            Game.skillRangeCells = RangeSystem.getCellsInRange(
                Game.selectedPiece.row, 
                Game.selectedPiece.col, 
                skill.range, 
                Game.board
            );
        }
        Game.renderBoard();
        Game.renderSkillButtons();
    },
    
    executeSkill: (row, col) => {
        const skill = SKILLS[Game.activeSkill];
        const target = Game.board[row][col];
        
        if (skill.filter(Game.selectedPiece, target, row, col)) {
            Game.selectedPiece.energy -= skill.energyCost;
            skill.content(Game.selectedPiece, target, row, col);
            Game.checkWinCondition();
        } else {
            Game.addLog('无法对该目标使用此技能！');
        }
    },
    
    endTurn: () => {
        Game.clearSelection();
        
        Game.pieces.filter(p => p.player === Game.currentPlayer).forEach(piece => {
            piece.skills.forEach(skillId => {
                const skill = SKILLS[skillId];
                if (skill.type === 'passive' && skill.trigger === 'onTurnStart') {
                    if (!skill.filter || skill.filter(piece)) {
                        skill.content(piece);
                    }
                }
            });
        });
        
        Game.currentPlayer = Game.currentPlayer === 1 ? 2 : 1;
        
        Game.pieces.filter(p => p.player === Game.currentPlayer).forEach(piece => {
            piece.hasMoved = false;
            piece.hasAttacked = false;
        });
        
        Game.addLog(`玩家${Game.currentPlayer} 回合开始`);
        Game.renderBoard();
    },
    
    checkWinCondition: () => {
        const player1Alive = Game.pieces.some(p => p.player === 1 && !p.isSummon);
        const player2Alive = Game.pieces.some(p => p.player === 2 && !p.isSummon);
        
        if (!player1Alive) {
            Game.showWinner(2);
        } else if (!player2Alive) {
            Game.showWinner(1);
        }
    },
    
    showWinner: (player) => {
        Game.gamePhase = 'ended';
        Game.addLog(`🎉 玩家${player} 获胜！`);
        setTimeout(() => {
            alert(`🎉 玩家${player} 获胜！`);
        }, 100);
    },
    
    addLog: (message) => {
        const time = new Date().toLocaleTimeString();
        Game.logs.unshift(`[${time}] ${message}`);
        if (Game.logs.length > 50) Game.logs.pop();
        
        const container = document.getElementById('gameLog');
        container.innerHTML = Game.logs.map(log => `<div class="log-entry">${log}</div>`).join('');
    },
    
    restart: () => {
        Game.board = [];
        Game.pieces = [];
        Game.currentPlayer = 1;
        Game.selectedPiece = null;
        Game.moveRangeCells = [];
        Game.attackRangeCells = [];
        Game.activeSkill = null;
        Game.skillRangeCells = [];
        Game.gamePhase = 'selection';
        Game.player1Pieces = [];
        Game.player2Pieces = [];
        Game.selectingPlayer = 1;
        Game.selectedGenerals = [];
        Game.logs = [];
        
        document.getElementById('selectionModal').style.display = 'flex';
        Game.init();
    }
};

const AI = {
    makeMove: () => {
        if (Game.currentPlayer !== 2) return;
        
        const aiPieces = Game.pieces.filter(p => p.player === 2 && !p.hasAttacked);
        if (aiPieces.length === 0) {
            Game.endTurn();
            return;
        }
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        aiPieces.forEach(piece => {
            const attackCells = RangeSystem.getCellsInRange(piece.row, piece.col, piece.attackRange, Game.board);
            attackCells.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                const target = Game.board[r][c];
                if (target && target.player === 1) {
                    const score = target.hp;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { type: 'attack', piece, target };
                    }
                }
            });
        });
        
        if (bestMove && bestMove.type === 'attack') {
            Game.selectPiece(bestMove.piece);
            setTimeout(() => {
                Game.attack(bestMove.piece, bestMove.target);
                setTimeout(AI.makeMove, 500);
            }, 300);
            return;
        }
        
        const movablePieces = Game.pieces.filter(p => p.player === 2 && !p.hasMoved);
        if (movablePieces.length > 0) {
            const piece = movablePieces[Math.floor(Math.random() * movablePieces.length)];
            const moveCells = RangeSystem.getCellsInRange(piece.row, piece.col, piece.moveRange, Game.board);
            const validMoves = moveCells.filter(key => {
                const [r, c] = key.split(',').map(Number);
                return TERRAINS[Game.terrain[r][c]].passable && !Game.board[r][c];
            });
            
            if (validMoves.length > 0) {
                const moveKey = validMoves[Math.floor(Math.random() * validMoves.length)];
                const [r, c] = moveKey.split(',').map(Number);
                Game.selectPiece(piece);
                setTimeout(() => {
                    Game.movePiece(piece, r, c);
                    setTimeout(AI.makeMove, 500);
                }, 300);
                return;
            }
        }
        
        setTimeout(() => Game.endTurn(), 500);
    }
};

document.addEventListener('DOMContentLoaded', Game.init);
