
// ================================
// 范围系统定义
// ================================
const Range = {
    plus(n, x, y) {
        const result = [];
        for (let i = 1; i <= n; i++) {
            result.push({ x: x + i, y });
            result.push({ x: x - i, y });
            result.push({ x, y: y + i });
            result.push({ x, y: y - i });
        }
        return result.filter(p => p.x >= 0 && p.x < 10 && p.y >= 0 && p.y < 10);
    },
    x(n, x, y) {
        const result = [];
        for (let i = 1; i <= n; i++) {
            result.push({ x: x + i, y: y + i });
            result.push({ x: x - i, y: y + i });
            result.push({ x: x + i, y: y - i });
            result.push({ x: x - i, y: y - i });
        }
        return result.filter(p => p.x >= 0 && p.x < 10 && p.y >= 0 && p.y < 10);
    },
    r(n, x, y) {
        const result = [];
        for (let dy = -n; dy <= n; dy++) {
            for (let dx = -n; dx <= n; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (Math.abs(dx) + Math.abs(dy) <= n) {
                    result.push({ x: x + dx, y: y + dy });
                }
            }
        }
        return result.filter(p => p.x >= 0 && p.x < 10 && p.y >= 0 && p.y < 10);
    },
    parse(rangeInput, x, y) {
        const ranges = Array.isArray(rangeInput) ? rangeInput : [rangeInput];
        const result = [];
        const seen = new Set();
        for (const rangeStr of ranges) {
            const match = String(rangeStr).match(/^([+xr])(\d+)$/);
            if (!match) continue;
            const type = match[1];
            const n = parseInt(match[2]);
            let pts = [];
            if (type === '+') pts = this.plus(n, x, y);
            else if (type === 'x') pts = this.x(n, x, y);
            else if (type === 'r') pts = this.r(n, x, y);
            for (const p of pts) {
                const key = `${p.x},${p.y}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(p);
                }
            }
        }
        return result;
    }
};

// ================================
// 效果系统定义
// ================================
const Effect = {
    damage(attacker, target, damage) {
        const realDamage = Math.max(1, Math.floor(damage - target.def * 0.3));
        target.hp -= realDamage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
        }
        return { damage: realDamage, type: 'damage' };
    },
    heal(healer, target, amount) {
        const healAmount = Math.min(amount, target.maxHp - target.hp);
        target.hp += healAmount;
        return { heal: healAmount, type: 'heal' };
    },
    buffAtk(user, target, amount, turns = 3) {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat: 'atk', value: amount, turns });
        target.atk += amount;
        return { buff: 'atk', value: amount, turns, type: 'buff' };
    },
    buffDef(user, target, amount, turns = 3) {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat: 'def', value: amount, turns });
        target.def += amount;
        return { buff: 'def', value: amount, turns, type: 'buff' };
    },
    summon(summoner, summonData, x, y, gameState) {
        const unit = {
            id: Date.now() + Math.random(),
            name: summonData.name,
            player: summoner.player,
            x, y,
            hp: summonData.hp,
            maxHp: summonData.hp,
            atk: summonData.atk,
            def: summonData.def,
            mov: summonData.mov,
            moveRange: '+' + summonData.mov,
            attackRange: '+1',
            sp: 100,
            maxSp: 100,
            skills: [],
            dead: false,
            moved: false,
            attacked: false,
            usedSkill: false,
            isSummon: true
        };
        gameState.units.push(unit);
        return { unit, type: 'summon' };
    }
};

// ================================
// 游戏数据
// ================================
const TERRAIN = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 3, 0, 0, 0, 0, 3, 0, 0],
    [2, 0, 0, 1, 0, 0, 1, 0, 0, 2],
    [2, 0, 4, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 4, 0, 2],
    [2, 0, 0, 1, 0, 0, 1, 0, 0, 2],
    [0, 0, 3, 0, 0, 0, 0, 3, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const TERRAIN_NAMES = { 0: 'grass', 1: 'mountain', 2: 'river', 3: 'city', 4: 'swamp' };
const TERRAIN_LABELS = { 0: '', 1: '山', 2: '～', 3: '城', 4: '沼' };
const SUMMONS = {
    soldier: { name: '士兵', hp: 40, atk: 8, def: 5, mov: 2 },
    archer: { name: '弓手', hp: 30, atk: 12, def: 3, mov: 2 },
    wall: { name: '盾墙', hp: 80, atk: 0, def: 20, mov: 0 }
};
const GENERALS = [
    {
        id: 'guanyu', name: '关羽', hp: 100, atk: 25, def: 15, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [
            { id: 'dragon', name: '青龙偃月', type: 'active', category: 'normal', range: '+2', spCost: 30, content(a,t) { return Effect.damage(a,t,35); }, desc: '十字2格，造成35伤害' },
            { id: 'warrior', name: '武圣', type: 'passive', category: 'special', content(a) { a.atk = Math.floor(a.atk * 1.1); }, desc: '攻击力+10%' }
        ]
    },
    {
        id: 'zhugeliang', name: '诸葛亮', hp: 70, atk: 20, def: 10, mov: 2,
        moveRange: '+2', attackRange: '+2',
        skills: [
            { id: 'fire', name: '火烧赤壁', type: 'active', category: 'normal', range: 'r2', spCost: 35, content(a,t) { return Effect.damage(a,t,28); }, desc: '圆形2格，造成28伤害' },
            { id: 'summonArcher', name: '借东风', type: 'active', category: 'summon', range: '+1', spCost: 40, summon: 'archer', content(a,pos,gs) { return Effect.summon(a,SUMMONS.archer,pos.x,pos.y,gs); }, desc: '召唤弓手' }
        ]
    },
    {
        id: 'zhaoyun', name: '赵云', hp: 85, atk: 22, def: 12, mov: 4,
        moveRange: '+4', attackRange: ['+1','x1'],
        skills: [{ id: 'spear', name: '龙胆枪', type: 'active', category: 'normal', range: '+3', spCost: 25, content(a,t) { return Effect.damage(a,t,30); }, desc: '十字3格，30伤害' }]
    },
    {
        id: 'zhangfei', name: '张飞', hp: 110, atk: 28, def: 18, mov: 2,
        moveRange: '+2', attackRange: '+1',
        skills: [{ id: 'roar', name: '狮吼功', type: 'active', category: 'normal', range: 'r1', spCost: 35, content(a,t) { return Effect.damage(a,t,40); }, desc: '周围1格，40伤害' }]
    },
    {
        id: 'huangzhong', name: '黄忠', hp: 75, atk: 26, def: 8, mov: 2,
        moveRange: '+2', attackRange: '+3',
        skills: [{ id: 'arrow', name: '百步穿杨', type: 'active', category: 'normal', range: '+4', spCost: 30, content(a,t) { return Effect.damage(a,t,32); }, desc: '十字4格，32伤害' }]
    },
    {
        id: 'machao', name: '马超', hp: 90, atk: 24, def: 10, mov: 4,
        moveRange: '+4', attackRange: '+1',
        skills: [{ id: 'charge', name: '铁骑冲锋', type: 'active', category: 'normal', range: '+3', spCost: 28, content(a,t) { return Effect.damage(a,t,33); }, desc: '十字3格，33伤害' }]
    },
    {
        id: 'caocao', name: '曹操', hp: 95, atk: 22, def: 14, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [
            { id: 'strategy', name: '奸雄之计', type: 'active', category: 'normal', range: 'r2', spCost: 30, content(a,t) { return Effect.damage(a,t,25); }, desc: '圆形2格，25伤害' },
            { id: 'ambition', name: '挟天子', type: 'active', category: 'special', range: 'r1', spCost: 35, content(a,t) { const d = Effect.damage(a,t,20); Effect.heal(a,a,15); return { ...d, heal: 15 }; }, desc: '吸血：20伤害 +15治疗' }
        ]
    },
    {
        id: 'caoren', name: '曹仁', hp: 105, atk: 18, def: 22, mov: 2,
        moveRange: '+2', attackRange: '+1',
        skills: [
            { id: 'defend', name: '铜墙铁壁', type: 'active', category: 'normal', range: '+1', spCost: 20, content(a,t) { Effect.buffDef(a,a,10,2); return Effect.damage(a,t,20); }, desc: '自身防御+10，攻击' },
            { id: 'summonWall', name: '筑城', type: 'active', category: 'summon', range: '+1', spCost: 45, summon: 'wall', content(a,pos,gs) { return Effect.summon(a,SUMMONS.wall,pos.x,pos.y,gs); }, desc: '召唤盾墙' }
        ]
    },
    {
        id: 'sunce', name: '孙策', hp: 88, atk: 25, def: 11, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [{ id: 'assault', name: '霸王突袭', type: 'active', category: 'normal', range: '+2', spCost: 30, content(a,t) { return Effect.damage(a,t,35); }, desc: '十字2格，35伤害' }]
    },
    {
        id: 'sunshangxiang', name: '孙尚香', hp: 72, atk: 23, def: 9, mov: 3,
        moveRange: '+3', attackRange: ['+2','x2'],
        skills: [
            { id: 'bow', name: '枭姬弓', type: 'active', category: 'normal', range: '+3', spCost: 25, content(a,t) { return Effect.damage(a,t,28); }, desc: '十字3格，28伤害' },
            { id: 'summonSoldier', name: '练兵', type: 'active', category: 'summon', range: '+1', spCost: 25, summon: 'soldier', content(a,pos,gs) { return Effect.summon(a,SUMMONS.soldier,pos.x,pos.y,gs); }, desc: '召唤士兵' }
        ]
    }
];

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
        document.getElementById('custom-btn').onclick = () => alert('DIY武将功能即将开放！');
        document.getElementById('confirm-select').onclick = () => this.confirmSelect();
        document.getElementById('end-turn').onclick = () => this.endTurn();
        document.getElementById('restart-btn').onclick = () => this.resetGame();
        document.getElementById('close-detail').onclick = () => this.hideDetail();
        document.getElementById('detail-panel').onclick = (e) => {
            if (e.target.id === 'detail-panel') this.hideDetail();
        };
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

        list.innerHTML = GENERALS.map(g => {
            const isSelected = selected.find(s => s.id === g.id);
            const isOpponentSelected = this.state.players[this.state.currentPlayer === 1 ? 2 : 1].generals.find(s => s.id === g.id);
            return `
                <div class="general-card ${isSelected ? 'selected' : ''}" data-id="${g.id}" style="opacity: ${isOpponentSelected ? '0.2' : '1'}">
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
                const idx = generals.findIndex(gg => gg.id === id);
                if (idx >= 0) generals.splice(idx, 1);
                else if (generals.length < 5) generals.push({ ...GENERALS.find(gg => gg.id === id) });
                this.renderSelect();
            };
        });
    },

    confirmSelect() {
        if (this.state.currentPlayer === 1) {
            this.state.currentPlayer = 2;
            if (this.state.mode === 'pve') {
                const available = GENERALS.filter(g => !this.state.players[1].generals.find(p => p.id === g.id));
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
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const terrainId = TERRAIN[y][x];
                const terrain = TERRAIN_NAMES[terrainId];
                const terrainLabel = TERRAIN_LABELS[terrainId];
                const unit = this.getUnit(x, y);

                let cellClass = `cell ${terrain}`;
                if (player === 1 && y >= 7) cellClass += ' deploy-zone-p1';
                if (player === 2 && y <= 2) cellClass += ' deploy-zone-p2';

                const cell = document.createElement('div');
                cell.className = cellClass;
                cell.dataset.x = x;
                cell.dataset.y = y;

                let cellHtml = '';
                if (x === 0) cellHtml += `<span class="cell-label top-left">${y}</span>`;
                if (y === 9) cellHtml += `<span class="cell-label bottom-left">${x}</span>`;
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
        if (player === 1 && y < 7) return;
        if (player === 2 && y > 2) return;
        if (this.getUnit(x, y)) return;

        const generals = this.state.players[player].generals;
        const deployed = this.state.players[player].deployed;
        
        // 首先使用用户选中的，如果没有选中就自动找第一个未部署的
        let generalIdx = this.state.players[player].toDeploy;
        if (generalIdx === null) {
            for (let i = 0; i < 5; i++) {
                if (!deployed.find(d => d.generalId === generals[i].id)) {
                    generalIdx = i;
                    break;
                }
            }
        }
        // 如果没有可部署的武将，直接返回
        if (generalIdx === null || generalIdx === -1) return;
        
        // 确保选中的武将还没有被部署
        if (deployed.find(d => d.generalId === generals[generalIdx].id)) {
            return;
        }
        
        const general = generals[generalIdx];

        const unit = {
            id: Date.now() + Math.random(),
            generalId: general.id,
            generalData: general,
            name: general.name,
            player: player,
            x, y,
            hp: general.hp, maxHp: general.hp,
            atk: general.atk, def: general.def, mov: general.mov,
            moveRange: general.moveRange || '+' + general.mov,
            attackRange: general.attackRange || '+1',
            sp: 100, maxSp: 100,
            skills: general.skills ? [...general.skills] : [],
            dead: false, moved: false, attacked: false, usedSkill: false
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
                generalId: g.id,
                generalData: g,
                name: g.name,
                player: 2,
                x: pos.x, y: pos.y,
                hp: g.hp, maxHp: g.hp,
                atk: g.atk, def: g.def, mov: g.mov,
                moveRange: g.moveRange || '+' + g.mov,
                attackRange: g.attackRange || '+1',
                sp: 100, maxSp: 100,
                skills: g.skills ? [...g.skills] : [],
                dead: false, moved: false, attacked: false, usedSkill: false
            };
            this.state.units.push(unit);
            this.state.players[2].deployed.push({ generalId: g.id, unitId: unit.id });
        });
        this.startBattle();
    },

    startBattle() {
        this.state.units.forEach(u => {
            if (u.skills) {
                u.skills.filter(s => s.type === 'passive').forEach(s => {
                    if (s.content) s.content(u, this.state);
                });
            }
        });
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
        const panel = document.getElementById('panel');
        const log = document.getElementById('log-panel');

        if (info) info.textContent = `第${this.state.turn}回合 ${this.state.currentPlayer === 1 ? '红方' : '蓝方'}`;

        if (board) {
            board.innerHTML = '';
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    const terrainId = TERRAIN[y][x];
                    const terrain = TERRAIN_NAMES[terrainId];
                    const terrainLabel = TERRAIN_LABELS[terrainId];
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
                    if (y === 9) cellHtml += `<span class="cell-label bottom-left">${x}</span>`;
                    if (terrainLabel) cellHtml += `<span class="terrain-label" style="font-size:24px;opacity:0.7">${terrainLabel}</span>`;
                    if (unit) cellHtml += this.renderUnit(unit);
                    cell.innerHTML = cellHtml;

                    cell.onclick = () => this.handleBattleClick(x, y);
                    board.appendChild(cell);
                }
            }
        }

        this.renderPlayerBars();
        this.renderSelectedInfo();

        if (panel) {
            if (this.state.selectedUnit) {
                const u = this.state.selectedUnit;
                const activeSkills = u.skills ? u.skills.filter(s => s.type === 'active') : [];
                panel.innerHTML = `
                    <div class="detail-name">${u.name}</div>
                    <div class="detail-stats">
                        HP: ${u.hp}/${u.maxHp} | SP: ${u.sp}/${u.maxSp}<br>
                        攻: ${u.atk} | 防: ${u.def} | 移: ${u.mov}
                    </div>
                    ${activeSkills.map(s => {
                        const canUse = u.sp >= s.spCost && !u.usedSkill;
                        return `<button class="skill-btn" data-skill="${s.id}" ${!canUse ? 'disabled' : ''}>${s.name}(${s.spCost}) - ${s.desc}</button>`;
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
        }

        if (log) log.innerHTML = this.state.logs.slice(-8).map(l => `<div class="log-entry">${l}</div>`).join('');
    },

    renderSelectedInfo() {
        const container = document.getElementById('selected-info');
        if (!container) return;
        const u = this.state.selectedUnit;
        if (!u) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        const hpPercent = (u.hp / u.maxHp * 100).toFixed(0);
        const skills = u.skills || [];
        const activeSkills = skills.filter(s => s.type === 'active');
        const passiveSkills = skills.filter(s => s.type === 'passive');
        container.innerHTML = `
            <div class="sel-info-left">
                <span class="sel-info-name p${u.player}">${u.name}</span>
                <div class="sel-info-hp"><div class="sel-info-hp-fill" style="width:${hpPercent}%"></div></div>
                <span class="sel-info-stat">HP:${u.hp}/${u.maxHp}</span>
                <span class="sel-info-stat">SP:${u.sp}/${u.maxSp}</span>
                <span class="sel-info-stat">攻:${u.atk}</span>
                <span class="sel-info-stat">防:${u.def}</span>
                <span class="sel-info-stat">移:${u.mov}</span>
            </div>
            <div class="sel-info-skills">
                ${activeSkills.map(s => {
                    const canUse = u.sp >= s.spCost && !u.usedSkill;
                    return `<button class="sel-skill-btn ${!canUse ? 'disabled' : ''}" data-skill="${s.id}">${s.name}(${s.spCost})</button>`;
                }).join('')}
                ${passiveSkills.map(s => `<span class="sel-passive">${s.name}</span>`).join('')}
            </div>
        `;
        container.querySelectorAll('.sel-skill-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const sid = e.currentTarget.dataset.skill;
                const skill = u.skills.find(s => s.id === sid);
                if (skill && u.sp >= skill.spCost && !u.usedSkill) this.selectSkill(skill);
            };
        });
    },

    renderPlayerBars() {
        const p1Bar = document.getElementById('player1-generals');
        const p2Bar = document.getElementById('player2-generals');
        if (!p1Bar || !p2Bar) return;

        const renderBar = (player, container) => {
            const units = this.state.units.filter(u => u.player === player && u.generalId);
            container.innerHTML = units.map(u => {
                const hpPercent = (u.hp / u.maxHp * 100).toFixed(0);
                return `
                    <div class="bar-general ${u.dead ? 'dead' : ''} p${player}" data-unit-id="${u.id}">
                        <span class="bar-general-name">${u.name}</span>
                        <div class="bar-general-hp">
                            <div class="bar-general-hp-fill" style="width: ${hpPercent}%"></div>
                        </div>
                        <span class="bar-general-info" data-unit-id="${u.id}">i</span>
                    </div>
                `;
            }).join('');

            container.querySelectorAll('.bar-general-info').forEach(el => {
                el.onclick = (e) => {
                    e.stopPropagation();
                    const unitId = e.currentTarget.dataset.unitId;
                    const unit = this.state.units.find(u => u.id == unitId);
                    if (unit) this.showDetail(unit);
                };
            });

            container.querySelectorAll('.bar-general').forEach(el => {
                el.onclick = (e) => {
                    const unitId = e.currentTarget.dataset.unitId;
                    const unit = this.state.units.find(u => u.id == unitId);
                    if (unit && !unit.dead && unit.player === this.state.currentPlayer) {
                        this.state.selectedUnit = unit;
                        this.state.currentSkill = null;
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
        statsEl.innerHTML = `
            HP: ${unit.hp}/${unit.maxHp}<br>
            SP: ${unit.sp}/${unit.maxSp}<br>
            攻击: ${unit.atk}<br>
            防御: ${unit.def}<br>
            移动: ${unit.mov}
        `;

        const skills = unit.skills || [];
        skillsEl.innerHTML = skills.map(s => `
            <div class="skill-item">
                <div class="skill-name">${s.name} ${s.type === 'passive' ? '(被动)' : ''} - ${s.spCost ? `SP:${s.spCost}` : ''}</div>
                <div class="skill-desc">${s.desc}</div>
            </div>
        `).join('') || '<div>无技能</div>';

        panel.classList.remove('hidden');
    },

    hideDetail() {
        document.getElementById('detail-panel').classList.add('hidden');
    },

    renderUnit(unit) {
        const hpPercent = (unit.hp / unit.maxHp * 100).toFixed(0);
        const isSelected = this.state.selectedUnit && this.state.selectedUnit.id === unit.id;
        return `
            <div class="unit p${unit.player} ${isSelected ? 'selected' : ''}">
                <div class="unit-icon">${unit.name}</div>
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
            const damage = Math.max(1, Math.floor(this.state.selectedUnit.atk - unit.def * 0.3));
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

        if (hlSkill && this.state.selectedUnit && this.state.currentSkill) {
            const skill = this.state.currentSkill;
            this.state.selectedUnit.sp -= skill.spCost;
            if (skill.category === 'summon') {
                if (!this.getUnit(x, y)) {
                    skill.content(this.state.selectedUnit, { x, y }, this.state);
                    this.state.logs.push(`${this.state.selectedUnit.name} 召唤 ${SUMMONS[skill.summon].name}`);
                }
            } else if (unit && unit.player !== this.state.selectedUnit.player) {
                const result = skill.content(this.state.selectedUnit, unit, this.state);
                if (result.type === 'damage') {
                    if (unit.dead) this.state.logs.push(`${this.state.selectedUnit.name} 击杀 ${unit.name}`);
                    else this.state.logs.push(`${this.state.selectedUnit.name} ${skill.name} ${unit.name} -${result.damage}`);
                } else if (result.heal) {
                    this.state.logs.push(`${this.state.selectedUnit.name} ${skill.name} 治疗${result.heal}`);
                } else if (result.type === 'summon') {
                    this.state.logs.push(`${this.state.selectedUnit.name} 召唤 ${result.unit.name}`);
                }
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
        const range = Range.parse(skill.range, u.x, u.y);
        if (skill.category === 'summon') {
            range.forEach(p => {
                if (!this.getUnit(p.x, p.y)) this.state.highlights.push({ x: p.x, y: p.y, type: 'skill' });
            });
        } else {
            range.forEach(p => {
                const target = this.getUnit(p.x, p.y);
                if (target && target.player !== u.player) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'skill' });
                }
            });
        }
        this.renderBattle();
    },

    showMoves(unit) {
        this.state.highlights = [];
        if (!unit.moved) {
            const moveRange = Range.parse(unit.moveRange || '+' + unit.mov, unit.x, unit.y);
            moveRange.forEach(p => {
                if (!this.getUnit(p.x, p.y)) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'move' });
                }
            });
        }
        if (!unit.attacked) {
            const attackRange = Range.parse(unit.attackRange || '+1', unit.x, unit.y);
            attackRange.forEach(p => {
                const target = this.getUnit(p.x, p.y);
                if (target && target.player !== unit.player) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'attack' });
                }
            });
        }
    },

    clearHighlights() {
        this.state.highlights = [];
    },

    endTurn() {
        this.state.units.forEach(u => {
            u.moved = false; u.attacked = false; u.usedSkill = false;
            u.sp = Math.min(u.maxSp, u.sp + 20);
            if (u.buffs) {
                const newBuffs = [];
                u.buffs.forEach(b => {
                    b.turns--;
                    if (b.turns > 0) newBuffs.push(b);
                    else u[b.stat] -= b.value;
                });
                u.buffs = newBuffs;
            }
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
                }
            }

            const newDist = Math.abs(target.x - unit.x) + Math.abs(target.y - unit.y);
            if (newDist <= 1 && !unit.attacked) {
                const damage = Math.max(1, Math.floor(unit.atk - target.def * 0.3));
                target.hp -= damage;
                if (target.hp <= 0) { target.dead = true; target.hp = 0; }
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
            highlights: [],
            logs: [],
            units: [],
            players: {
                1: { generals: [], deployed: [], toDeploy: null },
                2: { generals: [], deployed: [], toDeploy: null }
            }
        };
        this.showScreen('menu');
    },

    getUnit(x, y) {
        return this.state.units.find(u => u.x === x && u.y === y && !u.dead);
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
