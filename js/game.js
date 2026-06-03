const Game = {
    state: {
        mode: 'pvp',
        screen: 'menu',
        currentPlayer: 1,
        turn: 1,
        selectedUnit: null,
        currentSkill: null,
        highlights: [],
        logs: [],
        units: [],
        players: {
            1: { generals: [], deployed: [], toDeploy: null },
            2: { generals: [], deployed: [], toDeploy: null }
        }
    },

    init() {
        this.bindEvents();
        this.showScreen('menu');
    },

    showScreen(screenId) {
        this.state.screen = screenId;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenId}-screen`).classList.add('active');
    },

    bindEvents() {
        document.getElementById('pvp-btn').onclick = () => {
            this.state.mode = 'pvp';
            this.startSelect();
        };
        document.getElementById('pve-btn').onclick = () => {
            this.state.mode = 'pve';
            this.startSelect();
        };
        document.getElementById('custom-btn').onclick = () => {
            alert('DIY武将功能即将开放！');
        };
        document.getElementById('confirm-select').onclick = () => this.confirmSelect();
        document.getElementById('end-turn').onclick = () => this.endTurn();
        document.getElementById('restart-btn').onclick = () => this.resetGame();
    },

    startSelect() {
        this.state.currentPlayer = 1;
        this.state.players[1].generals = [];
        this.state.players[2].generals = [];
        this.renderSelect();
        this.showScreen('select');
    },

    renderSelect() {
        const title = document.getElementById('select-title');
        const count = document.getElementById('select-count');
        const list = document.getElementById('generals-list');
        const confirm = document.getElementById('confirm-select');

        title.textContent = `${this.state.currentPlayer === 1 ? '红方' : '蓝方'} 选将`;
        const selected = this.state.players[this.state.currentPlayer].generals;
        count.textContent = `${selected.length}/5`;
        confirm.disabled = selected.length < 5;

        list.innerHTML = GAME_DATA.GENERALS.map(g => {
            const isSelected = selected.find(s => s.id === g.id);
            const isOpponentSelected = this.state.players[this.state.currentPlayer === 1 ? 2 : 1].generals.find(s => s.id === g.id);
            return `
                <div class="general-card ${isSelected ? 'selected' : ''}" 
                     data-id="${g.id}"
                     style="opacity: ${isOpponentSelected ? '0.2' : '1'}">
                    <div class="general-icon">${g.name[0]}</div>
                    <div class="general-name">${g.name}</div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.general-card').forEach(card => {
            card.onclick = (e) => {
                const id = e.currentTarget.dataset.id;
                const opponentSelected = this.state.players[this.state.currentPlayer === 1 ? 2 : 1].generals.find(s => s.id === id);
                if (opponentSelected) return;
                const generals = this.state.players[this.state.currentPlayer].generals;
                const idx = generals.findIndex(g => g.id === id);
                if (idx >= 0) generals.splice(idx, 1);
                else if (generals.length < 5) generals.push({ ...GAME_DATA.GENERALS.find(g => g.id === id) });
                this.renderSelect();
            };
        });
    },

    confirmSelect() {
        if (this.state.currentPlayer === 1) {
            this.state.currentPlayer = 2;
            if (this.state.mode === 'pve') this.selectAI();
            else this.renderSelect();
        } else {
            this.startDeploy();
        }
    },

    selectAI() {
        const available = GAME_DATA.GENERALS.filter(g => !this.state.players[1].generals.find(p => p.id === g.id));
        for (let i = 0; i < 5; i++) {
            const idx = Math.floor(Math.random() * available.length);
            this.state.players[2].generals.push({ ...available[idx] });
            available.splice(idx, 1);
        }
        this.startDeploy();
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
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const terrainId = GAME_DATA.TERRAIN[y][x];
                const terrain = GAME_DATA.TERRAIN_NAMES[terrainId];
                const terrainLabel = GAME_DATA.TERRAIN_LABELS[terrainId];
                const unit = this.getUnit(x, y);

                let cellClass = `cell ${terrain}`;
                if (player === 1 && y >= 7) cellClass += ' deploy-zone-p1';
                if (player === 2 && y <= 2) cellClass += ' deploy-zone-p2';

                const cell = document.createElement('div');
                cell.className = cellClass;
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (x === 0) {
                    const label = document.createElement('span');
                    label.className = 'cell-label top-left';
                    label.textContent = y;
                    cell.appendChild(label);
                }
                if (y === 9) {
                    const label = document.createElement('span');
                    label.className = 'cell-label bottom-left';
                    label.textContent = x;
                    cell.appendChild(label);
                }
                if (terrainLabel) {
                    const label = document.createElement('span');
                    label.className = 'terrain-label';
                    label.textContent = terrainLabel;
                    cell.appendChild(label);
                }
                if (unit) cell.innerHTML += this.renderUnit(unit);
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
        if (player === 1 && y < 7) return;
        if (player === 2 && y > 2) return;
        if (this.getUnit(x, y)) return;

        const generals = this.state.players[player].generals;
        const deployed = this.state.players[player].deployed;

        if (this.state.players[player].toDeploy === null) {
            for (let i = 0; i < 5; i++) {
                if (!deployed.find(d => d.generalId === generals[i].id)) {
                    this.state.players[player].toDeploy = i;
                    break;
                }
            }
            if (this.state.players[player].toDeploy === null) return;
        }

        const general = generals[this.state.players[player].toDeploy];
        if (deployed.find(d => d.generalId === general.id)) return;

        const unit = {
            id: Date.now() + Math.random(),
            generalId: general.id,
            name: general.name,
            player: player,
            x, y,
            hp: general.hp, maxHp: general.hp,
            atk: general.atk, def: general.def, mov: general.mov,
            sp: 100, maxSp: 100,
            skills: general.skills.map(s => ({ ...GAME_DATA.SKILLS[s] })),
            dead: false, moved: false, attacked: false, usedSkill: false
        };
        this.state.units.push(unit);
        deployed.push({ generalId: general.id, unitId: unit.id });
        this.state.players[player].toDeploy = null;

        if (deployed.length === 5) {
            if (player === 1) {
                this.state.currentPlayer = 2;
                if (this.state.mode === 'pve') this.deployAI();
                else this.renderDeploy();
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
            for (let x = 0; x < 10; x++) {
                if (!this.getUnit(x, y)) available.push({ x, y });
            }
        }
        this.state.players[2].generals.forEach((g, i) => {
            const posIdx = Math.floor(Math.random() * available.length);
            const pos = available[posIdx];
            available.splice(posIdx, 1);
            const unit = {
                id: Date.now() + i + Math.random(),
                generalId: g.id, name: g.name, player: 2,
                x: pos.x, y: pos.y,
                hp: g.hp, maxHp: g.hp, atk: g.atk, def: g.def, mov: g.mov,
                sp: 100, maxSp: 100,
                skills: g.skills.map(s => ({ ...GAME_DATA.SKILLS[s] })),
                dead: false, moved: false, attacked: false, usedSkill: false
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
        this.state.highlights = [];
        this.state.logs = ['战斗开始'];
        this.renderBattle();
        this.showScreen('battle');
    },

    renderBattle() {
        const info = document.getElementById('turn-info');
        const board = document.getElementById('battle-board');
        const panel = document.getElementById('unit-panel');
        const log = document.getElementById('log-panel');

        info.textContent = `第${this.state.turn}回合 ${this.state.currentPlayer === 1 ? '红方' : '蓝方'}`;

        board.innerHTML = '';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const terrainId = GAME_DATA.TERRAIN[y][x];
                const terrain = GAME_DATA.TERRAIN_NAMES[terrainId];
                const terrainLabel = GAME_DATA.TERRAIN_LABELS[terrainId];
                const unit = this.getUnit(x, y);
                const hl = this.state.highlights.find(h => h.x === x && h.y === y);

                let cellClass = `cell ${terrain}`;
                if (hl) cellClass += ` highlight-${hl.type}`;

                const cell = document.createElement('div');
                cell.className = cellClass;
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (x === 0) {
                    const label = document.createElement('span');
                    label.className = 'cell-label top-left';
                    label.textContent = y;
                    cell.appendChild(label);
                }
                if (y === 9) {
                    const label = document.createElement('span');
                    label.className = 'cell-label bottom-left';
                    label.textContent = x;
                    cell.appendChild(label);
                }
                if (terrainLabel) {
                    const label = document.createElement('span');
                    label.className = 'terrain-label';
                    label.textContent = terrainLabel;
                    cell.appendChild(label);
                }
                if (unit) cell.innerHTML += this.renderUnit(unit);
                cell.onclick = () => this.handleBattleClick(x, y);
                board.appendChild(cell);
            }
        }

        if (this.state.selectedUnit) {
            const u = this.state.selectedUnit;
            panel.innerHTML = `
                <div class="panel-name">${u.name}</div>
                <div class="panel-stats">
                    HP: ${u.hp}/${u.maxHp} | SP: ${u.sp}/${u.maxSp}<br>
                    攻: ${u.atk} | 防: ${u.def} | 移: ${u.mov}
                </div>
                ${u.skills.map(s => {
                    const canUse = u.sp >= s.spCost && !u.usedSkill;
                    return `<button class="skill-btn" data-skill="${s.id}" ${!canUse ? 'disabled' : ''}>${s.name}(${s.spCost})</button>`;
                }).join('')}
            `;
            panel.querySelectorAll('.skill-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const sid = e.currentTarget.dataset.skill;
                    const skill = u.skills.find(s => s.id === sid);
                    if (u.sp >= skill.spCost && !u.usedSkill) this.selectSkill(skill);
                };
            });
        } else {
            panel.innerHTML = '';
        }

        log.innerHTML = this.state.logs.slice(-8).map(l => `<div class="log-entry">${l}</div>`).join('');
    },

    renderUnit(unit) {
        const hpPercent = (unit.hp / unit.maxHp * 100).toFixed(0);
        const isSelected = this.state.selectedUnit && this.state.selectedUnit.id === unit.id;
        return `
            <div class="unit p${unit.player} ${isSelected ? 'selected' : ''}">
                <div class="unit-icon">${unit.name[0]}</div>
                <div class="unit-name">${unit.name}</div>
                <div class="unit-hp">
                    <div class="unit-hp-fill" style="width: ${hpPercent}%"></div>
                </div>
            </div>
        `;
    },

    handleBattleClick(x, y) {
        const unit = this.getUnit(x, y);
        const hlMove = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'move');
        const hlAttack = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'attack');
        const hlSkill = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'skill');

        if (hlMove && this.state.selectedUnit) {
            this.state.selectedUnit.x = x;
            this.state.selectedUnit.y = y;
            this.state.selectedUnit.moved = true;
            this.clearHighlights();
            this.state.logs.push(`${this.state.selectedUnit.name} 移动`);
            this.renderBattle();
            return;
        }

        if (hlAttack && this.state.selectedUnit && unit && unit.player !== this.state.selectedUnit.player) {
            const damage = Math.max(1, Math.floor(this.state.selectedUnit.atk - unit.def / 2));
            unit.hp -= damage;
            if (unit.hp <= 0) {
                unit.dead = true;
                unit.hp = 0;
                this.state.logs.push(`${this.state.selectedUnit.name} 击杀 ${unit.name}`);
            } else {
                this.state.logs.push(`${this.state.selectedUnit.name} 攻击 ${unit.name} -${damage}`);
            }
            this.state.selectedUnit.attacked = true;
            this.clearHighlights();
            this.checkWin();
            this.renderBattle();
            return;
        }

        if (hlSkill && this.state.selectedUnit && this.state.currentSkill && unit && unit.player !== this.state.selectedUnit.player) {
            const skill = this.state.currentSkill;
            this.state.selectedUnit.sp -= skill.spCost;
            const damage = Math.max(1, Math.floor(skill.damage));
            unit.hp -= damage;
            if (unit.hp <= 0) {
                unit.dead = true;
                unit.hp = 0;
                this.state.logs.push(`${this.state.selectedUnit.name} ${skill.name} 击杀 ${unit.name}`);
            } else {
                this.state.logs.push(`${this.state.selectedUnit.name} ${skill.name} -${damage}`);
            }
            this.state.selectedUnit.usedSkill = true;
            this.state.currentSkill = null;
            this.clearHighlights();
            this.checkWin();
            this.renderBattle();
            return;
        }

        if (unit && unit.player === this.state.currentPlayer) {
            this.state.selectedUnit = unit;
            this.state.currentSkill = null;
            this.showMoves(unit);
            this.renderBattle();
            return;
        }

        this.state.selectedUnit = null;
        this.state.currentSkill = null;
        this.clearHighlights();
        this.renderBattle();
    },

    selectSkill(skill) {
        if (!this.state.selectedUnit) return;
        this.state.currentSkill = skill;
        this.state.highlights = [];
        const u = this.state.selectedUnit;
        const range = skill.rangeValue;

        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                let inRange = skill.range === 'cross'
                    ? (Math.abs(dx) + Math.abs(dy) <= range && (dx !== 0 || dy !== 0))
                    : (Math.abs(dx) + Math.abs(dy) <= range && (dx !== 0 || dy !== 0));
                if (!inRange) continue;
                const nx = u.x + dx, ny = u.y + dy;
                const target = this.getUnit(nx, ny);
                if (target && target.player !== u.player) {
                    this.state.highlights.push({ x: nx, y: ny, type: 'skill' });
                }
            }
        }
        this.renderBattle();
    },

    showMoves(unit) {
        this.state.highlights = [];
        if (!unit.moved) {
            for (let dy = -unit.mov; dy <= unit.mov; dy++) {
                for (let dx = -unit.mov; dx <= unit.mov; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= unit.mov && (dx !== 0 || dy !== 0)) {
                        const nx = unit.x + dx, ny = unit.y + dy;
                        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && !this.getUnit(nx, ny)) {
                            this.state.highlights.push({ x: nx, y: ny, type: 'move' });
                        }
                    }
                }
            }
        }
        if (!unit.attacked) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
                        const nx = unit.x + dx, ny = unit.y + dy;
                        const target = this.getUnit(nx, ny);
                        if (target && target.player !== unit.player) {
                            this.state.highlights.push({ x: nx, y: ny, type: 'attack' });
                        }
                    }
                }
            }
        }
    },

    clearHighlights() {
        this.state.highlights = [];
    },

    endTurn() {
        this.state.units.forEach(u => {
            u.moved = false; u.attacked = false; u.usedSkill = false;
            u.sp = Math.min(u.maxSp, u.sp + 20);
        });
        this.state.selectedUnit = null;
        this.state.currentSkill = null;
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
            setTimeout(() => this.aiTurn(), 500);
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
                if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && !this.getUnit(nx, ny)) {
                    unit.x = nx; unit.y = ny; unit.moved = true;
                    this.state.logs.push(`${unit.name} 移动`);
                }
            }

            const newDist = Math.abs(target.x - unit.x) + Math.abs(target.y - unit.y);
            if (newDist <= 1 && !unit.attacked) {
                const damage = Math.max(1, Math.floor(unit.atk - target.def / 2));
                target.hp -= damage;
                if (target.hp <= 0) { target.dead = true; target.hp = 0; this.state.logs.push(`AI ${unit.name} 击杀 ${target.name}`); }
                else this.state.logs.push(`AI ${unit.name} 攻击 ${target.name} -${damage}`);
                unit.attacked = true;
            }
        });
        this.checkWin();

        setTimeout(() => {
            this.state.units.forEach(u => {
                u.moved = false; u.attacked = false; u.usedSkill = false;
                u.sp = Math.min(u.maxSp, u.sp + 20);
            });
            this.state.turn++;
            this.state.currentPlayer = 1;
            this.state.logs.push(`第${this.state.turn}回合 红方`);
            this.renderBattle();
        }, 300);
    },

    checkWin() {
        const p1Alive = this.state.units.filter(u => u.player === 1 && !u.dead).length;
        const p2Alive = this.state.units.filter(u => u.player === 2 && !u.dead).length;
        if (p1Alive === 0) this.endGame(2);
        else if (p2Alive === 0) this.endGame(1);
    },

    endGame(winner) {
        document.getElementById('winner-text').textContent = `${winner === 1 ? '红方' : '蓝方'} 胜利！`;
        this.showScreen('gameover');
    },

    resetGame() {
        this.state = {
            mode: 'pvp', screen: 'menu', currentPlayer: 1, turn: 1,
            selectedUnit: null, currentSkill: null, highlights: [], logs: [], units: [],
            players: { 1: { generals: [], deployed: [], toDeploy: null }, 2: { generals: [], deployed: [], toDeploy: null } }
        };
        this.showScreen('menu');
    },

    getUnit(x, y) {
        return this.state.units.find(u => u.x === x && u.y === y && !u.dead);
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
