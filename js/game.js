// ================================
// 游戏逻辑
// ================================
const Game = {
    state: {
        mode: 'pvp',
        currentPlayer: 1,
        turn: 1,
        selectedUnit: null,
        currentSkill: null,
        skillPhase: null,
        skillTarget: null,
        highlights: [],
        logs: [],
        units: [],
        players: {
            1: { generals: [], deployed: [], toDeploy: null },
            2: { generals: [], deployed: [], toDeploy: null }
        }
    },

    init() {
        console.log('[Game] init called');
        this.state._modules = { Range: window.Range, Effect: window.Effect };
        this.bindEvents();
        this.showScreen('menu');
        console.log('[Game] init done');
    },

    showScreen(screenId) {
        console.log('[Game] showScreen called with:', screenId);
        const screens = document.querySelectorAll('.screen');
        console.log('[Game] All screens found:', screens);
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(`${screenId}-screen`);
        console.log('[Game] Target screen:', targetScreen);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },

    bindEvents() {
        console.log('[Game] bindEvents called');
        const pvpBtn = document.getElementById('pvp-btn');
        const pveBtn = document.getElementById('pve-btn');
        const customBtn = document.getElementById('custom-btn');
        console.log('[Game] Buttons found:', { pvpBtn, pveBtn, customBtn });

        if (pvpBtn) {
            pvpBtn.addEventListener('click', () => {
                console.log('[Game] pvp-btn clicked');
                this.state.mode = 'pvp';
                this.startSelect();
            });
        }
        if (pveBtn) {
            pveBtn.addEventListener('click', () => {
                console.log('[Game] pve-btn clicked');
                this.state.mode = 'pve';
                this.startSelect();
            });
        }
        if (customBtn) customBtn.addEventListener('click', () => alert('DIY武将功能即将开放！'));
        const confirmSelect = document.getElementById('confirm-select');
        const endTurn = document.getElementById('end-turn');
        const restartBtn = document.getElementById('restart-btn');
        const closeDetail = document.getElementById('close-detail');
        const detailPanel = document.getElementById('detail-panel');
        if (confirmSelect) confirmSelect.addEventListener('click', () => this.confirmSelect());
        if (endTurn) endTurn.addEventListener('click', () => this.endTurn());
        if (restartBtn) restartBtn.addEventListener('click', () => this.resetGame());
        if (closeDetail) closeDetail.addEventListener('click', () => this.hideDetail());
        if (detailPanel) {
            detailPanel.addEventListener('click', (e) => {
                if (e.target.id === 'detail-panel') this.hideDetail();
            });
        }
        const wSlider = document.getElementById('cell-width');
        const hSlider = document.getElementById('cell-height');
        if (wSlider) {
            wSlider.oninput = (e) => {
                const val = e.target.value;
                document.getElementById('cell-width-val').textContent = val;
                document.documentElement.style.setProperty('--cell-w', val + 'px');
            };
        }
        if (hSlider) {
            hSlider.oninput = (e) => {
                const val = e.target.value;
                document.getElementById('cell-height-val').textContent = val;
                document.documentElement.style.setProperty('--cell-h', val + 'px');
            };
        }
    },

    startSelect() {
        console.log('[Game] startSelect called, mode:', this.state.mode);
        this.state.currentPlayer = 1;
        this.state.players[1].generals = [];
        this.state.players[2].generals = [];
        this.renderSelect();
        this.showScreen('select');
    },

    renderSelect() {
        console.log('[Game] renderSelect called');
        console.log('[Game] GENERALS length:', window.GENERALS.length);
        const title = document.getElementById('select-title');
        const count = document.getElementById('select-count');
        const list = document.getElementById('generals-list');
        const confirm = document.getElementById('confirm-select');
        console.log('[Game] Elements found:', { title, count, list, confirm });

        title.textContent = `${this.state.currentPlayer === 1 ? '红方' : '蓝方'} 选将`;
        const selected = this.state.players[this.state.currentPlayer].generals;
        count.textContent = `${selected.length}/5`;
        confirm.disabled = selected.length < 5;

        list.innerHTML = window.GENERALS.map(g => {
            const isSelected = selected.find(s => s.id === g.id);
            const isOpponentSelected = this.state.players[this.state.currentPlayer === 1 ? 2 : 1].generals.find(s => s.id === g.id);
            return `
                <div class="general-card ${isSelected ? 'selected' : ''}" data-id="${g.id}" style="opacity: ${isOpponentSelected ? '0.2' : '1'}">
                    <span class="info-btn" data-id="${g.id}">i</span>
                    <div class="general-icon">${g.name[0]}</div>
                    <div class="general-name">${g.name}</div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.general-card').forEach(card => {
            card.onclick = (e) => {
                if (e.target.classList.contains('info-btn')) return;
                const id = e.currentTarget.dataset.id;
                const opponentSelected = this.state.players[this.state.currentPlayer === 1 ? 2 : 1].generals.find(s => s.id === id);
                if (opponentSelected) return;
                const generals = this.state.players[this.state.currentPlayer].generals;
                const idx = generals.findIndex(gg => gg.id === id);
                if (idx >= 0) generals.splice(idx, 1);
                else if (generals.length < 5) generals.push({ ...window.GENERALS.find(gg => gg.id === id) });
                this.renderSelect();
            };
        });

        list.querySelectorAll('.info-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                const g = window.GENERALS.find(gg => gg.id === id);
                if (g) {
                    const moveRangeStr = Array.isArray(g.moveRange) ? g.moveRange.join(', ') : g.moveRange;
                    const attackRangeStr = Array.isArray(g.attackRange) ? g.attackRange.join(', ') : g.attackRange;
                    const skillsDesc = g.skills.map(s => `${s.name}(${s.type === 'passive' ? '被动' : '主动'}): ${s.desc}`).join('\n');
                    alert(`${g.name}\nHP: ${g.hp} | 攻击: ${g.atk} | 防御: ${g.def}\n移动范围: ${moveRangeStr}\n攻击范围: ${attackRangeStr}\n\n技能:\n${skillsDesc}`);
                }
            };
        });
    },

    confirmSelect() {
        if (this.state.currentPlayer === 1) {
            this.state.currentPlayer = 2;
            if (this.state.mode === 'pve') {
                const available = window.GENERALS.filter(g => !this.state.players[1].generals.find(p => p.id === g.id));
                for (let i = 0; i < 5; i++) {
                    const idx = Math.floor(Math.random() * available.length);
                    this.state.players[2].generals.push({ ...available[idx] });
                    available.splice(idx, 1);
                }
                this.startDeploy();
            } else {
                this.renderSelect();
            }
        } else {
            this.startDeploy();
        }
    },

    startDeploy() {
        this.state.currentPlayer = 1;
        this.state.players[1].deployed = [];
        this.state.players[2].deployed = [];
        this.state.units = [];
        this.state.players[1].toDeploy = null;
        this.state.players[2].toDeploy = null;
        this.renderDeploy();
        this.showScreen('deploy');
    },

    renderDeploy() {
        const title = document.getElementById('deploy-title');
        const count = document.getElementById('deploy-count');
        const board = document.getElementById('deploy-board');
        const list = document.getElementById('deploy-list');

        const player = this.state.currentPlayer;
        const generals = this.state.players[player].generals;
        const deployed = this.state.players[player].deployed;

        title.textContent = `${player === 1 ? '红方' : '蓝方'} 布阵`;
        count.textContent = `${deployed.length}/5`;

        board.innerHTML = '';
        for (let y = 0; y < window.BOARD_SIZE; y++) {
            for (let x = 0; x < window.BOARD_SIZE; x++) {
                const terrainId = window.TERRAIN[y][x];
                const terrain = window.TERRAIN_NAMES[terrainId];
                const terrainLabel = window.TERRAIN_LABELS[terrainId];
                const unit = this.getUnit(x, y);

                let cellClass = `cell ${terrain}`;
                if (player === 1 && y >= window.BOARD_SIZE - 3) cellClass += ' deploy-zone-p1';
                if (player === 2 && y <= 2) cellClass += ' deploy-zone-p2';

                const cell = document.createElement('div');
                cell.className = cellClass;
                cell.dataset.x = x;
                cell.dataset.y = y;

                let cellHtml = '';
                if (x === 0) cellHtml += `<span class="cell-label top-left">${y}</span>`;
                if (y === window.BOARD_SIZE - 1) cellHtml += `<span class="cell-label bottom-left">${x}</span>`;
                if (terrainLabel) cellHtml += `<span class="terrain-label" style="font-size:24px;opacity:0.7">${terrainLabel}</span>`;
                if (unit) cellHtml += this.renderUnit(unit);
                cell.innerHTML = cellHtml;

                cell.onclick = () => this.handleDeployClick(x, y);
                board.appendChild(cell);
            }
        }

        list.innerHTML = generals.map((g, idx) => {
            const isDeployed = deployed.find(d => d.generalId === g.id);
            const isActive = this.state.players[player].toDeploy === idx && !isDeployed;
            return `<div class="mini-general ${isActive ? 'active' : ''} ${isDeployed ? 'deployed' : ''}" data-idx="${idx}">${g.name}</div>`;
        }).join('');

        list.querySelectorAll('.mini-general').forEach(el => {
            el.onclick = (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                const g = generals[idx];
                const isDeployed = deployed.find(d => d.generalId === g.id);
                if (!isDeployed) {
                    this.state.players[player].toDeploy = idx;
                    this.renderDeploy();
                }
            };
        });
    },

    handleDeployClick(x, y) {
        const player = this.state.currentPlayer;
        if (player === 1 && y < window.BOARD_SIZE - 3) return;
        if (player === 2 && y > 2) return;
        if (this.getUnit(x, y)) return;

        const generals = this.state.players[player].generals;
        const deployed = this.state.players[player].deployed;

        let generalIdx = this.state.players[player].toDeploy;
        if (generalIdx === null) {
            for (let i = 0; i < 5; i++) {
                if (!deployed.find(d => d.generalId === generals[i]?.id)) {
                    generalIdx = i;
                    break;
                }
            }
        }
        if (generalIdx === null || generalIdx === -1) return;
        if (deployed.find(d => d.generalId === generals[generalIdx]?.id)) return;

        const general = generals[generalIdx];
        if (!general) return;

        const unit = {
            id: Date.now() + Math.random(),
            generalId: general.id,
            generalData: general,
            name: general.name,
            player: player,
            x, y,
            hp: general.hp,
            maxHp: general.hp,
            atk: general.atk,
            def: general.def,
            moveRange: general.moveRange || '+3',
            attackRange: general.attackRange || '+1',
            skills: general.skills ? [...general.skills] : [],
            dead: false,
            moved: false,
            attacked: false
        };
        this.state.units.push(unit);
        deployed.push({ generalId: general.id, unitId: unit.id });
        this.state.players[player].toDeploy = null;

        if (deployed.length === 5) {
            if (player === 1) {
                this.state.currentPlayer = 2;
                if (this.state.mode === 'pve') {
                    this.deployAI();
                } else {
                    this.renderDeploy();
                }
            } else {
                this.startBattle();
            }
        } else {
            this.renderDeploy();
        }
    },

    deployAI() {
        const available = [];
        for (let y = 0; y <= 2; y++) {
            for (let x = 0; x < window.BOARD_SIZE; x++) {
                if (!this.getUnit(x, y)) available.push({ x, y });
            }
        }
        this.state.players[2].generals.forEach((g, i) => {
            const posIdx = Math.floor(Math.random() * available.length);
            const pos = available[posIdx];
            available.splice(posIdx, 1);
            const unit = {
                id: Date.now() + i + Math.random(),
                generalId: g.id,
                generalData: g,
                name: g.name,
                player: 2,
                x: pos.x, y: pos.y,
                hp: g.hp,
                maxHp: g.hp,
                atk: g.atk,
                def: g.def,
                moveRange: g.moveRange || '+3',
                attackRange: g.attackRange || '+1',
                skills: g.skills ? [...g.skills] : [],
                dead: false,
                moved: false,
                attacked: false
            };
            this.state.units.push(unit);
            this.state.players[2].deployed.push({ generalId: g.id, unitId: unit.id });
        });
        this.startBattle();
    },

    startBattle() {
        this.state.currentPlayer = 1;
        this.state.turn = 1;
        this.state.selectedUnit = null;
        this.state.currentSkill = null;
        this.state.skillPhase = null;
        this.state.skillTarget = null;
        this.state.highlights = [];
        this.state.logs = ['战斗开始'];
        this.renderBattle();
        this.showScreen('battle');
    },

    renderBattle() {
        const info = document.getElementById('turn-info');
        const board = document.getElementById('battle-board');
        const log = document.getElementById('log-panel');

        if (info) info.textContent = `第${this.state.turn}回合 ${this.state.currentPlayer === 1 ? '红方' : '蓝方'}`;

        if (board) {
            board.innerHTML = '';
            for (let y = 0; y < window.BOARD_SIZE; y++) {
                for (let x = 0; x < window.BOARD_SIZE; x++) {
                    const terrainId = window.TERRAIN[y][x];
                    const terrain = window.TERRAIN_NAMES[terrainId];
                    const terrainLabel = window.TERRAIN_LABELS[terrainId];
                    const unit = this.getUnit(x, y);
                    const hl = this.state.highlights.find(h => h.x === x && h.y === y);

                    let cellClass = `cell ${terrain}`;
                    if (hl) cellClass += ` highlight-${hl.type}`;

                    const cell = document.createElement('div');
                    cell.className = cellClass;
                    cell.dataset.x = x;
                    cell.dataset.y = y;

                    let cellHtml = '';
                    if (x === 0) cellHtml += `<span class="cell-label top-left">${y}</span>`;
                    if (y === window.BOARD_SIZE - 1) cellHtml += `<span class="cell-label bottom-left">${x}</span>`;
                    if (terrainLabel) cellHtml += `<span class="terrain-label" style="font-size:24px;opacity:0.7">${terrainLabel}</span>`;
                    if (unit) cellHtml += this.renderUnit(unit);
                    cell.innerHTML = cellHtml;

                    cell.onclick = () => this.handleBattleClick(x, y);
                    board.appendChild(cell);
                }
            }
        }

        this.renderPlayerBars();

        if (log) log.innerHTML = this.state.logs.slice(-8).map(l => `<div class="log-entry">${l}</div>`).join('');
    },

    renderUnit(unit) {
        const hpPercent = (unit.hp / unit.maxHp * 100).toFixed(0);
        const isSelected = this.state.selectedUnit && this.state.selectedUnit.id === unit.id;
        return `
            <div class="unit p${unit.player} ${isSelected ? 'selected' : ''} ${unit.dead ? 'dead' : ''}">
                <div class="unit-icon">${unit.name}</div>
                <div class="unit-hp">
                    <div class="unit-hp-fill" style="width: ${hpPercent}%"></div>
                </div>
            </div>
        `;
    },

    renderPlayerBars() {
        const p1Bar = document.getElementById('player1-generals');
        const p2Bar = document.getElementById('player2-generals');
        if (!p1Bar || !p2Bar) return;

        const renderBar = (player, container) => {
            const units = this.state.units.filter(u => u.player === player && !u.dead && u.generalId);
            container.innerHTML = units.map(u => {
                const hpPercent = (u.hp / u.maxHp * 100).toFixed(0);
                return `
                    <div class="bar-general ${u.dead ? 'dead' : ''} p${player}" data-unit-id="${u.id}">
                        <span class="bar-general-name">${u.name}</span>
                        <div class="bar-general-hp">
                            <div class="bar-general-hp-fill" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

            container.querySelectorAll('.bar-general').forEach(el => {
                el.onclick = (e) => {
                    const unitId = e.currentTarget.dataset.unitId;
                    const unit = this.state.units.find(u => u.id == unitId);
                    if (unit && !unit.dead && unit.player === this.state.currentPlayer) {
                        this.state.selectedUnit = unit;
                        this.state.currentSkill = null;
                        this.state.skillPhase = null;
                        this.state.skillTarget = null;
                        this.showMoves(unit);
                        this.renderBattle();
                    }
                };
            });
        };

        renderBar(1, p1Bar);
        renderBar(2, p2Bar);
    },

    showDetail(unit) {
        const panel = document.getElementById('detail-panel');
        const nameEl = document.getElementById('detail-name');
        const statsEl = document.getElementById('detail-stats');
        const skillsEl = document.getElementById('detail-skills');

        nameEl.textContent = unit.name;
        const moveRangeStr = Array.isArray(unit.moveRange) ? unit.moveRange.join(', ') : unit.moveRange;
        const attackRangeStr = Array.isArray(unit.attackRange) ? unit.attackRange.join(', ') : unit.attackRange;
        statsEl.innerHTML = `HP: ${unit.hp}/${unit.maxHp} | 攻击: ${unit.atk} | 防御: ${unit.def}\n移动范围: ${moveRangeStr}\n攻击范围: ${attackRangeStr}`;

        const skills = unit.skills || [];
        skillsEl.innerHTML = skills.map(s => `
            <div class="skill-item">
                <div class="skill-name">${s.name} (${s.type === 'passive' ? '被动' : '主动'})</div>
                <div class="skill-desc">${s.desc}</div>
            </div>
        `).join('') || '<div>无技能</div>';

        panel.classList.remove('hidden');
    },

    hideDetail() {
        document.getElementById('detail-panel').classList.add('hidden');
    },

    getUnit(x, y) {
        return this.state.units.find(u => u.x === x && u.y === y);
    },

    showMoves(unit) {
        this.state.highlights = [];
        const blockedSet = new Set();
        this.state.units.forEach(u => {
            if (!u.dead) blockedSet.add(`${u.x},${u.y}`);
        });

        if (!unit.moved) {
            const moveRange = window.Range.parse(unit.moveRange, unit.x, unit.y, window.BLOCKING_TERRAIN_MOVE, window.TERRAIN);
            moveRange.forEach(p => {
                if (!this.getUnit(p.x, p.y)) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'move' });
                }
            });
        }

        if (!unit.attacked) {
            const attackRange = window.Range.parse(unit.attackRange, unit.x, unit.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
            attackRange.forEach(p => {
                const target = this.getUnit(p.x, p.y);
                if (target && target.player !== unit.player) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'attack' });
                }
            });
        }
    },

    handleBattleClick(x, y) {
        const unit = this.getUnit(x, y);
        const hlMove = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'move');
        const hlAttack = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'attack');

        if (hlMove && this.state.selectedUnit) {
            const mover = this.state.selectedUnit;
            mover.x = x;
            mover.y = y;
            mover.moved = true;
            this.clearHighlights();
            this.state.logs.push(`${mover.name} 移动`);
            this.showMoves(mover);
            this.renderBattle();
            return;
        }

        if (hlAttack && this.state.selectedUnit && unit && unit.player !== this.state.selectedUnit.player) {
            const attacker = this.state.selectedUnit;
            const result = window.Effect.damage(attacker, unit, attacker.atk);
            this.state.logs.push(`${attacker.name} 攻击 ${unit.name} -${result.damage}`);
            this.showFloatingText(unit.x, unit.y, `-${result.damage}`, 'damage');
            if (unit.dead) {
                this.state.logs.push(`${unit.name} 阵亡`);
            }
            attacker.attacked = true;
            this.clearHighlights();
            this.showMoves(attacker);
            this.checkWin();
            this.renderBattle();
            return;
        }

        if (unit && unit.player === this.state.currentPlayer) {
            this.state.selectedUnit = unit;
            this.state.currentSkill = null;
            this.state.skillPhase = null;
            this.state.skillTarget = null;
            this.showMoves(unit);
            this.renderBattle();
            return;
        }

        this.state.selectedUnit = null;
        this.clearHighlights();
        this.renderBattle();
    },

    showFloatingText(x, y, text, type) {
        const cell = document.querySelector(`#battle-board .cell[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;
        const el = document.createElement('div');
        el.className = `float-text ${type}`;
        el.textContent = text;
        cell.appendChild(el);
        setTimeout(() => el.remove(), 800);
    },

    clearHighlights() {
        this.state.highlights = [];
    },

    endTurn() {
        this.state.units.forEach(u => {
            u.moved = false;
            u.attacked = false;
            u.usedSkill = false;
        });

        this.state.selectedUnit = null;
        this.clearHighlights();

        if (this.state.currentPlayer === 2) {
            this.state.turn++;
            this.state.currentPlayer = 1;
            this.state.logs.push(`第${this.state.turn}回合 红方`);
        } else {
            this.state.currentPlayer = 2;
            this.state.logs.push('蓝方回合');
        }

        if (this.state.mode === 'pve' && this.state.currentPlayer === 2) {
            this.aiTurn();
        } else {
            this.renderBattle();
        }
    },

    aiTurn() {
        const aiUnits = this.state.units.filter(u => u.player === 2 && !u.dead);
        aiUnits.forEach(unit => {
            const enemies = this.state.units.filter(e => e.player === 1 && !e.dead);
            if (enemies.length === 0) return;
            let target = enemies[0];
            let minDist = 999;
            enemies.forEach(e => {
                const dist = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
                if (dist < minDist) { minDist = dist; target = e; }
            });

            if (!unit.moved && minDist > 1) {
                const dx = Math.sign(target.x - unit.x);
                const dy = Math.sign(target.y - unit.y);
                const nx = unit.x + (dx !== 0 ? dx : 0);
                const ny = unit.y + (dy !== 0 ? dy : 0);
                if (nx >= 0 && nx < window.BOARD_SIZE && ny >= 0 && ny < window.BOARD_SIZE && !this.getUnit(nx, ny)) {
                    unit.x = nx; unit.y = ny; unit.moved = true;
                }
            }

            const newDist = Math.abs(target.x - unit.x) + Math.abs(target.y - unit.y);
            if (newDist <= 1 && !unit.attacked) {
                const result = window.Effect.damage(unit, target, unit.atk);
                this.state.logs.push(`${unit.name} 攻击 ${target.name} -${result.damage}`);
                if (target.dead) {
                    this.state.logs.push(`${target.name} 阵亡`);
                }
                unit.attacked = true;
            }
        });
        this.checkWin();

        setTimeout(() => {
            this.state.units.forEach(u => {
                u.moved = false; u.attacked = false;
            });
            this.state.turn++;
            this.state.currentPlayer = 1;
            this.state.logs.push(`第${this.state.turn}回合 红方`);
            this.renderBattle();
        }, 300);
    },

    checkWin() {
        const p1Alive = this.state.units.filter(u => u.player === 1 && !u.dead && u.generalId).length;
        const p2Alive = this.state.units.filter(u => u.player === 2 && !u.dead && u.generalId).length;
        if (p1Alive === 0) this.endGame(2);
        else if (p2Alive === 0) this.endGame(1);
    },

    endGame(winner) {
        document.getElementById('winner-text').textContent = `${winner === 1 ? '红方' : '蓝方'} 胜利！`;
        this.showScreen('gameover');
    },

    resetGame() {
        this.state = {
            mode: 'pvp',
            currentPlayer: 1,
            turn: 1,
            selectedUnit: null,
            currentSkill: null,
            skillPhase: null,
            skillTarget: null,
            highlights: [],
            logs: [],
            units: [],
            players: {
                1: { generals: [], deployed: [], toDeploy: null },
                2: { generals: [], deployed: [], toDeploy: null }
            }
        };
        this.showScreen('menu');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
