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
        this.state._modules = { Range: window.Range, Effect: window.Effect };
        this.bindEvents();
        this.showScreen('menu');
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(`${screenId}-screen`);
        if (el) el.classList.add('active');
    },

    bindEvents() {
        const pvpBtn = document.getElementById('pvp-btn');
        const pveBtn = document.getElementById('pve-btn');
        const customBtn = document.getElementById('custom-btn');
        if (pvpBtn) pvpBtn.onclick = () => { this.state.mode = 'pvp'; this.startSelect(); };
        if (pveBtn) pveBtn.onclick = () => { this.state.mode = 'pve'; this.startSelect(); };
        if (customBtn) customBtn.onclick = () => alert('DIY武将功能即将开放！');
        const confirmSelect = document.getElementById('confirm-select');
        const endTurn = document.getElementById('end-turn');
        const restartBtn = document.getElementById('restart-btn');
        const closeDetail = document.getElementById('close-detail');
        const detailPanel = document.getElementById('detail-panel');
        if (confirmSelect) confirmSelect.onclick = () => this.confirmSelect();
        if (endTurn) endTurn.onclick = () => this.endTurn();
        if (restartBtn) restartBtn.onclick = () => this.resetGame();
        if (closeDetail) closeDetail.onclick = () => this.hideDetail();
        if (detailPanel) {
            detailPanel.onclick = (e) => { if (e.target.id === 'detail-panel') this.hideDetail(); };
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
                const terrainId = window.TERRAIN[y] ? window.TERRAIN[y][x] : 0;
                const terrain = window.TERRAIN_NAMES[terrainId] || 'grass';
                const terrainLabel = window.TERRAIN_LABELS[terrainId] || '';
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
            mov: general.mov,
            moveRange: general.moveRange || '+3',
            attackRange: general.attackRange || '+1',
            energy: 0,
            skills: general.skills ? general.skills.map(s => ({ ...s })) : [],
            dead: false,
            moved: false,
            attacked: false,
            usedSkill: false
        };
        unit.skills.forEach(sk => {
            if (sk.type === 'passive' && sk.content) sk.content(unit, null, this.state);
        });
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
                mov: g.mov,
                moveRange: g.moveRange || '+3',
                attackRange: g.attackRange || '+1',
                energy: 0,
                skills: g.skills ? g.skills.map(s => ({ ...s })) : [],
                dead: false,
                moved: false,
                attacked: false,
                usedSkill: false
            };
            unit.skills.forEach(sk => {
                if (sk.type === 'passive' && sk.content) sk.content(unit, null, this.state);
            });
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
        this.state.logs = ['战斗开始', '=== 第1回合开始 ===', '红方行动'];
        this.renderBattle();
        this.showScreen('battle');
    },

    renderBattle() {
        const info = document.getElementById('turn-info');
        const board = document.getElementById('battle-board');
        const log = document.getElementById('log-panel');
        if (info) info.textContent = `第${this.state.turn}回合 - ${this.state.currentPlayer === 1 ? '红方' : '蓝方'}行动`;
        if (board) {
            board.innerHTML = '';
            for (let y = 0; y < window.BOARD_SIZE; y++) {
                for (let x = 0; x < window.BOARD_SIZE; x++) {
                    const terrainId = window.TERRAIN[y] ? window.TERRAIN[y][x] : 0;
                    const terrain = window.TERRAIN_NAMES[terrainId] || 'grass';
                    const terrainLabel = window.TERRAIN_LABELS[terrainId] || '';
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
        const buffs = (unit.buffs || []).length + (unit.debuffs || []).length;
        return `
            <div class="unit p${unit.player} ${isSelected ? 'selected' : ''} ${unit.dead ? 'dead' : ''}">
                <div class="unit-icon">${unit.name[0]}</div>
                <div class="unit-hp">
                    <div class="unit-hp-fill" style="width: ${hpPercent}%"></div>
                </div>
                ${buffs > 0 ? `<div class="unit-status-count">${buffs}</div>` : ''}
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
                        ${u.energy ? `<span class="bar-general-energy">${u.energy}</span>` : ''}
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
        statsEl.innerHTML = `HP: ${unit.hp}/${unit.maxHp} | 攻击: ${unit.atk} | 防御: ${unit.def}<br>移动范围: ${moveRangeStr}<br>攻击范围: ${attackRangeStr}`;
        const skills = unit.skills || [];
        skillsEl.innerHTML = skills.map(s => {
            const isCharge = s.energyCost > 0;
            const canUse = (!isCharge || unit.energy >= s.energyCost) && !unit.usedSkill;
            return `
                <div class="skill-item">
                    <div class="skill-name">${s.name} (${s.type === 'passive' ? '被动' : '主动'})</div>
                    <div class="skill-desc">${s.desc}</div>
                    ${s.type === 'active' ? `<button class="skill-use-btn" data-skill-id="${s.id}" ${!canUse ? 'disabled' : ''} style="${!canUse ? 'opacity:0.5' : ''}">使用</button>` : ''}
                </div>
            `;
        }).join('') || '<div>无技能</div>';
        skillsEl.querySelectorAll('.skill-use-btn').forEach(btn => {
            btn.onclick = () => {
                const skillId = btn.dataset.skillId;
                const skill = unit.skills.find(s => s.id === skillId);
                if (skill) {
                    this.state.currentSkill = skill;
                    this.state.skillPhase = 'targeting';
                    this.showSkillTargeting(unit, skill);
                    this.renderBattle();
                    this.hideDetail();
                }
            };
        });
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
        this.state.units.forEach(u => { if (!u.dead) blockedSet.add(`${u.x},${u.y}`); });
        const { Range } = this.state._modules || {};
        if (!Range) return;
        if (!unit.moved && !unit.stunned) {
            const moveRange = Range.parse(unit.moveRange, unit.x, unit.y, window.BLOCKING_TERRAIN_MOVE, window.TERRAIN);
            moveRange.forEach(p => {
                if (!this.getUnit(p.x, p.y)) this.state.highlights.push({ x: p.x, y: p.y, type: 'move' });
            });
        }
        if (!unit.attacked && !unit.stunned) {
            const attackRange = Range.parse(unit.attackRange, unit.x, unit.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
            attackRange.forEach(p => {
                const target = this.getUnit(p.x, p.y);
                if (target && target.player !== unit.player) this.state.highlights.push({ x: p.x, y: p.y, type: 'attack' });
            });
        }
        if (!unit.usedSkill && !unit.silenced) {
            const skills = unit.skills.filter(s => s.type === 'active');
            skills.forEach(sk => {
                if (sk.energyCost && unit.energy < sk.energyCost) return;
                try {
                    const skillRange = Range.parse(sk.range || sk.step1Range || '+1', unit.x, unit.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
                    skillRange.forEach(p => {
                        const target = this.getUnit(p.x, p.y);
                        if (target && target.player !== unit.player) {
                            const exists = this.state.highlights.find(h => h.x === p.x && h.y === p.y);
                            if (!exists) this.state.highlights.push({ x: p.x, y: p.y, type: 'skill' });
                        }
                    });
                } catch (e) { }
            });
        }
    },

    showSkillTargeting(unit, skill) {
        this.state.highlights = [];
        const { Range } = this.state._modules || {};
        if (!Range) return;
        if (skill.step1 === 'selectEnemy' || skill.type === 'active') {
            const rng = Range.parse(skill.step1Range || skill.range || '+1', unit.x, unit.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
            rng.forEach(p => {
                const target = this.getUnit(p.x, p.y);
                if (target && target.player !== unit.player) this.state.highlights.push({ x: p.x, y: p.y, type: 'skill' });
            });
        } else if (skill.step1 === 'selectLanding') {
            const rng = Range.parse(skill.step1Range || skill.range || '+1', unit.x, unit.y, window.BLOCKING_TERRAIN_MOVE, window.TERRAIN);
            rng.forEach(p => {
                if (!this.getUnit(p.x, p.y)) this.state.highlights.push({ x: p.x, y: p.y, type: 'skill' });
            });
        }
    },

    handleBattleClick(x, y) {
        const unit = this.getUnit(x, y);
        const hlMove = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'move');
        const hlAttack = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'attack');
        const hlSkill = this.state.highlights.find(h => h.x === x && h.y === y && h.type === 'skill');
        if (hlMove && this.state.selectedUnit) {
            const mover = this.state.selectedUnit;
            mover.x = x;
            mover.y = y;
            mover.moved = true;
            this.chargeEnergy(mover, 'afterMove');
            
            // 触发移动后事件钩子
            const moveHookResult = window.Effect.trigger(mover, 'afterMove', this.state);
            if (moveHookResult.results.length > 0) {
                moveHookResult.results.forEach(result => {
                    if (result && result.showText) {
                        this.showFloatingText(mover.x, mover.y, result.showText, 'heal');
                    }
                });
            }
            
            this.clearHighlights();
            this.state.logs.push(`${mover.name} 移动`);
            this.showMoves(mover);
            this.renderBattle();
            return;
        }
        if (hlAttack && this.state.selectedUnit && unit && unit.player !== this.state.selectedUnit.player) {
            const attacker = this.state.selectedUnit;
            const result = window.Effect.damage(attacker, unit, attacker.atk);
            if (result.type === 'dodge') this.state.logs.push(`${unit.name} 闪避了攻击！`);
            else {
                this.state.logs.push(`${attacker.name} 攻击 ${unit.name} -${result.damage}`);
                if (result.counter) this.state.logs.push(`${unit.name} 反击 ${attacker.name} -${result.counter}`);
                if (unit.dead) {
                    this.state.logs.push(`${unit.name} 阵亡`);
                    
                    // 触发击杀事件钩子
                    const killHookResult = window.Effect.trigger(attacker, 'afterKill', unit, this.state);
                    let extraActionGranted = false;
                    killHookResult.results.forEach(result => {
                        if (result) {
                            if (result.extraAction) {
                                extraActionGranted = true;
                            }
                            if (result.logText) {
                                this.state.logs.push(result.logText);
                            }
                            if (result.showText) {
                                this.showFloatingText(attacker.x, attacker.y, result.showText, 'heal');
                            }
                        }
                    });
                    
                    if (extraActionGranted || (attacker._passive_changsheng && !attacker.extraActionGranted)) {
                        attacker.extraActionGranted = true;
                        window.Effect.grantExtraAction(attacker);
                    }
                }
            }
            attacker.attacked = true;
            this.chargeEnergy(attacker, 'afterAttack');
            this.chargeEnergy(attacker, 'afterAction');
            
            // 触发攻击后事件钩子
            const attackHookResult = window.Effect.trigger(attacker, 'afterAttack', this.state);
            if (attackHookResult.results.length > 0) {
                attackHookResult.results.forEach(result => {
                    if (result && result.showText) {
                        this.showFloatingText(attacker.x, attacker.y, result.showText, 'heal');
                    }
                });
            }
            
            this.showFloatingText(unit.x, unit.y, result.type === 'dodge' ? '闪避' : `-${result.damage}`, result.type === 'dodge' ? 'heal' : 'damage');
            if (result.counter) setTimeout(() => this.showFloatingText(attacker.x, attacker.y, `-${result.counter}`, 'damage'), 200);
            this.clearHighlights();
            this.showMoves(attacker);
            this.checkWin();
            this.renderBattle();
            return;
        }
        if (hlSkill && this.state.selectedUnit && this.state.currentSkill) {
            this.selectSkillTarget(x, y);
            return;
        }
        if (unit && unit.player === this.state.currentPlayer) {
            this.state.selectedUnit = unit;
            this.state.currentSkill = null;
            this.state.skillPhase = null;
            this.state.skillTarget = null;
            this.showMoves(unit);
            this.renderBattle();
            if (unit.generalData) setTimeout(() => this.showDetail(unit), 0);
            return;
        }
        this.state.selectedUnit = null;
        this.clearHighlights();
        this.renderBattle();
    },

    selectSkillTarget(x, y) {
        const unit = this.state.selectedUnit;
        const skill = this.state.currentSkill;
        const target = this.getUnit(x, y);
        if (skill.step1 === 'selectEnemy' && (!target || target.player === unit.player)) return;
        if (skill.step2 && (skill.step2 === 'selectLanding' || skill.step2 === 'selectPosition')) {
            this.state.skillPhase = 'step2';
            this.state.skillTarget = skill.step1 === 'selectEnemy' ? target : { x, y };
            this.showStep2Highlights(unit, skill, this.state.skillTarget);
            this.renderBattle();
        } else {
            this.executeSkill(unit, skill, skill.step1 === 'selectEnemy' ? target : { x, y });
        }
    },

    showStep2Highlights(unit, skill, step1Target) {
        this.state.highlights = [];
        const { Range } = this.state._modules || {};
        if (!Range) return;
        const center = step1Target.x !== undefined ? step1Target : step1Target;
        if (skill.step2 === 'selectLanding') {
            const rng = Range.parse(skill.step2Range || 'r2', center.x, center.y);
            rng.forEach(p => {
                if (!this.getUnit(p.x, p.y)) this.state.highlights.push({ x: p.x, y: p.y, type: 'skill' });
            });
        }
    },

    executeSkill(unit, skill, target, extraArg) {
        if (skill.energyCost) unit.energy -= skill.energyCost;
        unit.usedSkill = true;
        const result = skill.content(unit, target, this.state, extraArg);
        
        if (result.type === 'danyong') {
            if (result.move) this.state.logs.push(`${unit.name} 突进至 (${result.move.x},${result.move.y})`);
            this.state.logs.push(`${unit.name} 胆勇 ${target.name} -${result.damage}`);
            if (target.dead) {
                this.state.logs.push(`${target.name} 阵亡`);
                
                // 触发击杀事件钩子
                const killHookResult = window.Effect.trigger(unit, 'afterKill', target, this.state);
                let extraActionGranted = false;
                killHookResult.results.forEach(result => {
                    if (result) {
                        if (result.extraAction) {
                            extraActionGranted = true;
                        }
                        if (result.logText) {
                            this.state.logs.push(result.logText);
                        }
                        if (result.showText) {
                            this.showFloatingText(unit.x, unit.y, result.showText, 'heal');
                        }
                    }
                });
                
                if (extraActionGranted || (unit._passive_changsheng && !unit.extraActionGranted)) {
                    unit.extraActionGranted = true;
                    window.Effect.grantExtraAction(unit);
                }
            }
            this.showFloatingText(target.x, target.y, `-${result.damage}`, 'damage');
        } else if (result.type === 'tuci') {
            if (result.move) this.state.logs.push(`${unit.name} 突进至 (${result.move.x},${result.move.y})`);
            this.state.logs.push(`${unit.name} 突刺 ${target.name} -${result.damage}`);
            if (target.dead) {
                this.state.logs.push(`${target.name} 阵亡`);
                
                // 触发击杀事件钩子
                const killHookResult = window.Effect.trigger(unit, 'afterKill', target, this.state);
                let extraActionGranted = false;
                killHookResult.results.forEach(result => {
                    if (result) {
                        if (result.extraAction) {
                            extraActionGranted = true;
                        }
                        if (result.logText) {
                            this.state.logs.push(result.logText);
                        }
                        if (result.showText) {
                            this.showFloatingText(unit.x, unit.y, result.showText, 'heal');
                        }
                    }
                });
                
                if (extraActionGranted || (unit._passive_changsheng && !unit.extraActionGranted)) {
                    unit.extraActionGranted = true;
                    window.Effect.grantExtraAction(unit);
                }
            }
            this.showFloatingText(target.x, target.y, `-${result.damage}`, 'damage');
        } else if (result.type === 'shuiyan') {
            const log = result.riverBonus ? `${unit.name} 水淹七军 ${target.name} -${result.damage}（河流加成）并减速！` : `${unit.name} 水淹七军 ${target.name} -${result.damage} 并减速！`;
            this.state.logs.push(log);
            if (target.dead) {
                this.state.logs.push(`${target.name} 阵亡`);
            }
            this.showFloatingText(target.x, target.y, `-${result.damage}`, 'damage');
        } else if (result.type === 'damage') {
            this.state.logs.push(`${unit.name} 使用 ${skill.name} 攻击 ${target.name} -${result.damage}`);
            if (target.dead) {
                this.state.logs.push(`${target.name} 阵亡`);
            }
            this.showFloatingText(target.x, target.y, `-${result.damage}`, 'damage');
        } else if (result.type === 'heal') {
            this.state.logs.push(`${unit.name} 使用 ${skill.name} 治疗 ${target.name} +${result.heal}`);
            this.showFloatingText(target.x, target.y, `+${result.heal}`, 'heal');
        } else if (result.type === 'summon') {
            this.state.logs.push(`${unit.name} 使用 ${skill.name} 召唤了 ${result.unit.name}`);
        } else if (result.type === 'buff') {
            this.state.logs.push(`${unit.name} 使用 ${skill.name} 强化了 ${target.name}`);
        } else if (result.type === 'aoe') {
            this.state.logs.push(`${unit.name} 使用 ${skill.name} 范围攻击！`);
            result.targets?.forEach(t => {
                this.showFloatingText(t.x || target.x, t.y || target.y, `-${t.damage}`, 'damage');
                if (t.dead) this.state.logs.push(`${t.name} 阵亡`);
            });
        }
        this.chargeEnergy(unit, 'afterAction');
        this.state.currentSkill = null;
        this.state.skillPhase = null;
        this.state.skillTarget = null;
        this.clearHighlights();
        this.checkWin();
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

    chargeEnergy(unit, trigger) {
        unit.skills.forEach(sk => {
            if (sk.chargeTrigger === trigger && sk.energyCost > 0) {
                unit.energy = Math.min(unit.energy + 1, 99);
            }
        });
    },

    endTurn() {
        // 一方操作完成，切换到另一方
        if (this.state.currentPlayer === 1) {
            // 红方操作完成，切换到蓝方
            this.state.currentPlayer = 2;
            this.state.logs.push('蓝方行动');
        } else {
            // 蓝方操作完成，回合+1，切换到红方（新回合开始）
            this.state.turn++;
            this.state.currentPlayer = 1;
            this.state.logs.push(`=== 第${this.state.turn}回合开始===`);
            this.state.logs.push('红方行动');
        }
        
        // 触发所有存活单位的回合开始事件钩子
        this.state.units.forEach(u => {
            if (!u.dead) {
                window.Effect.trigger(u, 'onTurnStart', this.state);
            }
        });
        
        // 重置状态
        this.state.units.forEach(u => {
            if (u.poisoned && !u.dead) {
                const poisonDmg = Math.floor(u.poisoned / 2);
                u.hp -= poisonDmg;
                this.state.logs.push(`${u.name} 受到中毒伤害 -${poisonDmg}`);
                if (u.hp <= 0) { u.hp = 0; u.dead = true; this.state.logs.push(`${u.name} 阵亡`); }
            }
            if (u.extraActionGranted) u.extraActionGranted = false;
            u.moved = false;
            u.attacked = false;
            u.usedSkill = false;
            u.stunned = false;
            u.silenced = false;
            u.confused = false;
            if (u.buffs) {
                u.buffs = u.buffs.filter(b => {
                    b.turns--;
                    if (b.turns <= 0) {
                        if (b.stat === 'atk') u.atk -= b.value;
                        if (b.stat === 'def') u.def -= b.value;
                        return false;
                    }
                    return true;
                });
            }
            if (u.debuffs) {
                u.debuffs = u.debuffs.filter(d => {
                    d.turns--;
                    if (d.turns <= 0) {
                        if (d.type === 'slow' && d.originalMov) u.mov = d.originalMov;
                        if (d.type === 'shredDef' && d.originalDef) u.def = d.originalDef;
                        return false;
                    }
                    return true;
                });
            }
        });
        this.state.selectedUnit = null;
        this.clearHighlights();
        
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
                if (target.dead) this.state.logs.push(`${target.name} 阵亡`);
                unit.attacked = true;
            }
        });
        this.checkWin();
        setTimeout(() => {
            this.state.units.forEach(u => {
                u.moved = false; u.attacked = false; u.usedSkill = false;
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
