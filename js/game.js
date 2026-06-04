
// ================================
// 范围系统定义
// ================================
const Range = {
    // 带阻断的十字范围：遇到任何单位停止延伸（用于移动）
    plusBlocked(n, x, y, blockedSet) {
        const result = [];
        const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
        for (const dir of dirs) {
            for (let i = 1; i <= n; i++) {
                const px = x + dir.dx * i;
                const py = y + dir.dy * i;
                if (px < 0 || px >= BOARD_SIZE || py < 0 || py >= BOARD_SIZE) break;
                result.push({ x: px, y: py });
                if (blockedSet.has(`${px},${py}`)) break; // 被阻断
            }
        }
        return result;
    },
    // 带阻断的斜角范围
    xBlocked(n, x, y, blockedSet) {
        const result = [];
        const dirs = [{dx:1,dy:1},{dx:-1,dy:1},{dx:1,dy:-1},{dx:-1,dy:-1}];
        for (const dir of dirs) {
            for (let i = 1; i <= n; i++) {
                const px = x + dir.dx * i;
                const py = y + dir.dy * i;
                if (px < 0 || px >= BOARD_SIZE || py < 0 || py >= BOARD_SIZE) break;
                result.push({ x: px, y: py });
                if (blockedSet.has(`${px},${py}`)) break;
            }
        }
        return result;
    },
    // 带阻断的圆形/菱形范围（逐层BFS，被阻挡的格子不继续延伸）
    rBlocked(n, x, y, blockedSet) {
        const result = [];
        const visited = new Set();
        visited.add(`${x},${y}`);
        let frontier = [{x, y, d:0}];
        while (frontier.length > 0) {
            const next = [];
            for (const cur of frontier) {
                if (cur.d >= n) continue;
                const neighs = [
                    {x: cur.x+1, y: cur.y}, {x: cur.x-1, y: cur.y},
                    {x: cur.x, y: cur.y+1}, {x: cur.x, y: cur.y-1}
                ];
                for (const nb of neighs) {
                    const key = `${nb.x},${nb.y}`;
                    if (nb.x < 0 || nb.x >= BOARD_SIZE || nb.y < 0 || nb.y >= BOARD_SIZE) continue;
                    if (visited.has(key)) continue;
                    visited.add(key);
                    result.push({ x: nb.x, y: nb.y });
                    // 只有空格子才能继续延伸；被阻挡的格子算在范围内，但不继续扩散
                    if (!blockedSet.has(key)) {
                        next.push({x: nb.x, y: nb.y, d: cur.d + 1});
                    }
                }
            }
            frontier = next;
        }
        // 移除起点
        return result.filter(p => !(p.x === x && p.y === y));
    },
    // 原始无阻断范围（保留给需要全范围的场景，如技能AOE）
    plus(n, x, y) {
        const result = [];
        for (let i = 1; i <= n; i++) {
            result.push({ x: x + i, y });
            result.push({ x: x - i, y });
            result.push({ x, y: y + i });
            result.push({ x, y: y - i });
        }
        return result.filter(p => p.x >= 0 && p.x < BOARD_SIZE && p.y >= 0 && p.y < BOARD_SIZE);
    },
    x(n, x, y) {
        const result = [];
        for (let i = 1; i <= n; i++) {
            result.push({ x: x + i, y: y + i });
            result.push({ x: x - i, y: y + i });
            result.push({ x: x + i, y: y - i });
            result.push({ x: x - i, y: y - i });
        }
        return result.filter(p => p.x >= 0 && p.x < BOARD_SIZE && p.y >= 0 && p.y < BOARD_SIZE);
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
        return result.filter(p => p.x >= 0 && p.x < BOARD_SIZE && p.y >= 0 && p.y < BOARD_SIZE);
    },
    // 阻断版解析：用于移动和攻击范围
    parseBlocked(rangeInput, x, y, blockedSet) {
        const ranges = Array.isArray(rangeInput) ? rangeInput : [rangeInput];
        const result = [];
        const seen = new Set();
        for (const rangeStr of ranges) {
            const match = String(rangeStr).match(/^([+xr])(\d+)$/);
            if (!match) continue;
            const type = match[1];
            const n = parseInt(match[2]);
            let pts = [];
            if (type === '+') pts = this.plusBlocked(n, x, y, blockedSet);
            else if (type === 'x') pts = this.xBlocked(n, x, y, blockedSet);
            else if (type === 'r') pts = this.rBlocked(n, x, y, blockedSet);
            for (const p of pts) {
                const key = `${p.x},${p.y}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(p);
                }
            }
        }
        return result;
    },
    // 无阻断版解析：用于技能全范围
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
        // 闪避判定
        if (target.dodgeRate && Math.random() < target.dodgeRate) {
            return { damage: 0, type: 'dodge' };
        }
        const realDamage = Math.max(1, Math.floor(damage - target.def * 0.3));
        target.hp -= realDamage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
        }
        // 反击判定
        let counter = null;
        if (target.counterRate && !target.dead && Math.random() < target.counterRate) {
            const counterDmg = Math.max(1, Math.floor(target.atk * 0.5 - attacker.def * 0.3));
            attacker.hp -= counterDmg;
            if (attacker.hp <= 0) { attacker.hp = 0; attacker.dead = true; }
            counter = counterDmg;
        }
        return { damage: realDamage, type: 'damage', counter };
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
    },
    // AOE范围伤害：对目标及周围n格所有敌人造成伤害
    aoeDamage(attacker, target, damage, range, gameState) {
        const targets = gameState.units.filter(u => !u.dead && u.player !== attacker.player &&
            Math.abs(u.x - target.x) + Math.abs(u.y - target.y) <= range);
        let total = 0;
        const details = [];
        targets.forEach(enemy => {
            const r = this.damage(attacker, enemy, damage);
            total += r.damage;
            details.push({ name: enemy.name, ...r });
        });
        return { damage: total, type: 'aoe', targets: details };
    },
    // 穿透伤害：沿方向对路径上所有敌人造成伤害
    pierceDamage(attacker, target, damage, gameState) {
        const dx = Math.sign(target.x - attacker.x);
        const dy = Math.sign(target.y - attacker.y);
        let total = 0;
        const details = [];
        for (let i = 1; i <= BOARD_SIZE; i++) {
            const tx = attacker.x + dx * i, ty = attacker.y + dy * i;
            if (tx < 0 || tx >= BOARD_SIZE || ty < 0 || ty >= BOARD_SIZE) break;
            const hit = gameState.units.find(u => u.x === tx && u.y === ty && !u.dead && u.player !== attacker.player);
            if (hit) {
                const r = this.damage(attacker, hit, damage);
                total += r.damage;
                details.push({ name: hit.name, ...r });
            }
        }
        return { damage: total, type: 'pierce', targets: details };
    },
    // 中毒：每回合造成伤害
    poison(attacker, target, damage, turns = 3) {
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({ type: 'poison', damage, turns });
        return { type: 'poison', damage, turns };
    },
    // 眩晕：跳过回合
    stun(attacker, target, turns = 1) {
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({ type: 'stun', turns });
        target.stunned = turns;
        return { type: 'stun', turns };
    },
    // 减速：降低移动力
    slow(attacker, target, amount, turns = 2) {
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({ type: 'slow', amount, turns, originalMov: target.mov });
        target.mov = Math.max(1, target.mov - amount);
        return { type: 'slow', amount, turns };
    },
    // 设置反击率
    setCounterRate(target, rate) {
        target.counterRate = rate;
        return { type: 'counterRate', rate };
    },
    // 设置闪避率
    setDodgeRate(target, rate) {
        target.dodgeRate = rate;
        return { type: 'dodgeRate', rate };
    },
    // 破甲：降低目标防御（可叠加，回合结束恢复）
    shredDef(attacker, target, amount, turns = 1) {
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({ type: 'shredDef', value: amount, turns, originalDef: target.def });
        target.def = Math.max(0, target.def - amount);
        return { type: 'shredDef', value: amount, turns };
    },
    // 燃烧：持续伤害Debuff
    burn(attacker, target, damage, turns = 2) {
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({ type: 'burn', damage, turns });
        return { type: 'burn', damage, turns };
    },
    // 混乱：下回合强制攻击最近友军
    confuse(attacker, target, turns = 1) {
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({ type: 'confuse', turns });
        target.confused = turns;
        return { type: 'confuse', turns };
    },
    // 突刺：造成伤害后使用者退回原位（content中由调用方处理位移，这里仅返回标记）
    lungeDamage(attacker, target, damage, fromX, fromY) {
        const r = this.damage(attacker, target, damage);
        return { ...r, type: 'lunge', fromX, fromY };
    },
    // 斩杀再动：若击杀目标则标记再动
    executeDamage(attacker, target, damage) {
        const r = this.damage(attacker, target, damage);
        return { ...r, type: 'execute', extraTurn: target.dead };
    },
    // 狙击：目标血量越低伤害越高
    snipeDamage(attacker, target, baseDamage) {
        const missingHpRate = 1 - (target.hp / target.maxHp);
        const bonus = Math.floor(missingHpRate * 5) * 5; // 每缺20%血+5伤害
        const total = baseDamage + bonus;
        return this.damage(attacker, target, total);
    },
    // 背水：自身血量越低伤害越高
    desperateDamage(attacker, target, baseDamage) {
        const missingHpRate = 1 - (attacker.hp / attacker.maxHp);
        const bonus = Math.floor(missingHpRate * 4) * 5; // 每缺25%血+5伤害
        const total = baseDamage + bonus;
        return this.damage(attacker, target, total);
    },
    // 连射：连续射击多次
    multiShot(attacker, target, times, damagePerShot) {
        const details = [];
        let total = 0;
        for (let i = 0; i < times; i++) {
            const r = this.damage(attacker, target, damagePerShot);
            total += r.damage;
            details.push(r);
            if (target.dead) break;
        }
        return { damage: total, type: 'multishot', hits: details.length, details };
    }
};

// ================================
// 游戏数据
// ================================
const BOARD_SIZE = 12;
const TERRAIN = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0],
    [2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2],
    [2, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 2],
    [0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0],
    [2, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 2],
    [2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2],
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
            { id: 'shred', name: '破甲斩', type: 'active', category: 'normal', range: '+2', spCost: 30, content(a,t) { const d = Effect.damage(a,t,25); Effect.shredDef(a,t,Math.floor(t.def*0.5),1); return {...d, msg:'破甲'}; }, desc: '十字2格，造成25伤害并降低目标50%防御1回合' },
            { id: 'warrior', name: '武圣', type: 'passive', category: 'special', content(a) { Effect.setCounterRate(a, 0.3); }, desc: '30%概率反击' }
        ]
    },
    {
        id: 'zhugeliang', name: '诸葛亮', hp: 70, atk: 20, def: 10, mov: 2,
        moveRange: '+2', attackRange: '+2',
        skills: [
            { id: 'fire', name: '火攻', type: 'active', category: 'normal', range: 'r2', spCost: 40, content(a,t) { const d = Effect.damage(a,t,18); Effect.burn(a,t,15,2); return {...d, msg:'燃烧'}; }, desc: '圆形2格，造成18伤害并附加燃烧（每回合15伤害，2回合）' },
            { id: 'summonArcher', name: '借东风', type: 'active', category: 'summon', range: '+1', spCost: 40, summon: 'archer', content(a,pos,gs) { return Effect.summon(a,SUMMONS.archer,pos.x,pos.y,gs); }, desc: '召唤弓手' }
        ]
    },
    {
        id: 'zhaoyun', name: '赵云', hp: 85, atk: 22, def: 12, mov: 4,
        moveRange: '+4', attackRange: ['+1','x1'],
        skills: [
            { id: 'lunge', name: '龙胆突刺', type: 'active', category: 'normal', range: '+3', spCost: 25, content(a,t,gs) { const ox=a.x, oy=a.y; const d=Effect.damage(a,t,28); a.x=t.x; a.y=t.y; gs.logs.push(`${a.name} 突进`); return {...d, type:'lunge', fromX:ox, fromY:oy}; }, desc: '十字3格，突进到目标位置造成28伤害（可穿越敌人）' },
            { id: 'dodge', name: '七进七出', type: 'passive', category: 'special', content(a) { Effect.setDodgeRate(a, 0.25); }, desc: '25%概率闪避攻击' }
        ]
    },
    {
        id: 'zhangfei', name: '张飞', hp: 110, atk: 28, def: 18, mov: 2,
        moveRange: '+2', attackRange: '+1',
        skills: [
            { id: 'roar', name: '震慑', type: 'active', category: 'normal', range: 'r1', spCost: 35, content(a,t) { const d=Effect.damage(a,t,30); Effect.stun(a,t,1); return {...d, msg:'眩晕'}; }, desc: '周围1格，造成30伤害并眩晕1回合' },
            { id: 'stun', name: '震天怒吼', type: 'active', category: 'special', range: '+1', spCost: 30, content(a,t) { Effect.stun(a,t,1); return Effect.damage(a,t,15); }, desc: '眩晕1回合并造成15伤害' }
        ]
    },
    {
        id: 'huangzhong', name: '黄忠', hp: 75, atk: 26, def: 8, mov: 2,
        moveRange: '+2', attackRange: '+3',
        skills: [{ id: 'snipe', name: '狙击', type: 'active', category: 'normal', range: '+4', spCost: 35, content(a,t) { return Effect.snipeDamage(a,t,22); }, desc: '十字4格，目标血量越低伤害越高（每缺20%血+5伤害）' }]
    },
    {
        id: 'machao', name: '马超', hp: 90, atk: 24, def: 10, mov: 4,
        moveRange: '+4', attackRange: '+1',
        skills: [
            { id: 'charge', name: '冲锋', type: 'active', category: 'normal', range: '+3', spCost: 28, content(a,t,gs) { const d=Effect.executeDamage(a,t,28); if(d.extraTurn){ a.moved=false; a.attacked=false; gs.logs.push(`${a.name} 斩杀再动`); } return d; }, desc: '十字3格，造成28伤害，若击杀目标则再次行动' },
            { id: 'slow', name: '践踏', type: 'active', category: 'special', range: 'r1', spCost: 25, content(a,t) { Effect.slow(a,t,1,2); return Effect.damage(a,t,15); }, desc: '减速1移动力2回合并造成15伤害' }
        ]
    },
    {
        id: 'caocao', name: '曹操', hp: 95, atk: 22, def: 14, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [
            { id: 'confuse', name: '离间', type: 'active', category: 'normal', range: 'r2', spCost: 30, content(a,t) { const d=Effect.damage(a,t,18); Effect.confuse(a,t,1); return {...d, msg:'混乱'}; }, desc: '圆形2格，造成18伤害并混乱1回合（攻击最近友军）' },
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
        skills: [
            { id: 'desperate', name: '背水', type: 'active', category: 'normal', range: '+2', spCost: 30, content(a,t) { return Effect.desperateDamage(a,t,25); }, desc: '十字2格，自身血量越低伤害越高（每缺25%血+5伤害）' },
            { id: 'poison', name: '淬毒刃', type: 'active', category: 'special', range: '+1', spCost: 25, content(a,t) { Effect.poison(a,t,8,3); return Effect.damage(a,t,15); }, desc: '中毒每回合8伤害3回合并造成15伤害' }
        ]
    },
    {
        id: 'sunshangxiang', name: '孙尚香', hp: 72, atk: 23, def: 9, mov: 3,
        moveRange: '+3', attackRange: ['+2','x2'],
        skills: [
            { id: 'multishot', name: '连珠', type: 'active', category: 'normal', range: '+3', spCost: 25, content(a,t) { return Effect.multiShot(a,t,2,Math.floor(a.atk*0.6)); }, desc: '十字3格，连续射击2次（每次60%攻击）' },
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
                else if (generals.length < 5) generals.push({ ...GENERALS.find(gg => gg.id === id) });
                this.renderSelect();
            };
        });

        list.querySelectorAll('.info-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                const g = GENERALS.find(gg => gg.id === id);
                if (g) {
                    const moveRangeStr = Array.isArray(g.moveRange) ? g.moveRange.join(', ') : g.moveRange;
                    const attackRangeStr = Array.isArray(g.attackRange) ? g.attackRange.join(', ') : g.attackRange;
                    const skillsDesc = g.skills.map(s => `${s.name}(${s.type === 'passive' ? '被动' : '主动'}${s.spCost ? ` SP:${s.spCost}` : ''}): ${s.desc}`).join('\n');
                    alert(`${g.name}\nHP: ${g.hp} | 攻: ${g.atk} | 防: ${g.def} | 移: ${g.mov}\n移动范围: ${moveRangeStr}\n攻击范围: ${attackRangeStr}\n\n技能:\n${skillsDesc}`);
                }
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
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const terrainId = TERRAIN[y][x];
                const terrain = TERRAIN_NAMES[terrainId];
                const terrainLabel = TERRAIN_LABELS[terrainId];
                const unit = this.getUnit(x, y);

                let cellClass = `cell ${terrain}`;
                if (player === 1 && y >= BOARD_SIZE - 3) cellClass += ' deploy-zone-p1';
                if (player === 2 && y <= 2) cellClass += ' deploy-zone-p2';

                const cell = document.createElement('div');
                cell.className = cellClass;
                cell.dataset.x = x;
                cell.dataset.y = y;

                let cellHtml = '';
                if (x === 0) cellHtml += `<span class="cell-label top-left">${y}</span>`;
                if (y === BOARD_SIZE - 1) cellHtml += `<span class="cell-label bottom-left">${x}</span>`;
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
        if (player === 1 && y < BOARD_SIZE - 3) return;
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
            for (let x = 0; x < BOARD_SIZE; x++) {
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
        const log = document.getElementById('log-panel');

        if (info) info.textContent = `第${this.state.turn}回合 ${this.state.currentPlayer === 1 ? '红方' : '蓝方'}`;

        if (board) {
            board.innerHTML = '';
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
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
                    if (y === BOARD_SIZE - 1) cellHtml += `<span class="cell-label bottom-left">${x}</span>`;
                    if (terrainLabel) cellHtml += `<span class="terrain-label" style="font-size:24px;opacity:0.7">${terrainLabel}</span>`;
                    if (unit) cellHtml += this.renderUnit(unit);
                    cell.innerHTML = cellHtml;

                    cell.onclick = () => this.handleBattleClick(x, y);
                    board.appendChild(cell);
                }
            }
        }

        this.renderPlayerBars();
        this.renderSelectedSkills();

        if (log) log.innerHTML = this.state.logs.slice(-8).map(l => `<div class="log-entry">${l}</div>`).join('');
    },

    renderSelectedSkills() {
        const container = document.getElementById('selected-info');
        if (!container) return;
        const u = this.state.selectedUnit;
        if (!u) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        const skills = u.skills || [];
        const activeSkills = skills.filter(s => s.type === 'active');
        const passiveSkills = skills.filter(s => s.type === 'passive');
        container.innerHTML = `
            <div class="sel-info-skills">
                ${activeSkills.map(s => {
                    const canUse = u.sp >= s.spCost && !u.usedSkill;
                    return `
                        <div class="sel-skill-wrap">
                            <button class="sel-skill-btn ${canUse ? 'available' : 'unavailable'}" data-skill="${s.id}">${s.name}(${s.spCost})</button>
                            <span class="sel-skill-info" data-skill="${s.id}">i</span>
                        </div>
                    `;
                }).join('')}
                ${passiveSkills.map(s => `
                    <div class="sel-skill-wrap">
                        <span class="sel-passive">${s.name}</span>
                        <span class="sel-skill-info" data-skill="${s.id}">i</span>
                    </div>
                `).join('')}
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
        container.querySelectorAll('.sel-skill-info').forEach(el => {
            el.onclick = (e) => {
                e.stopPropagation();
                const sid = e.currentTarget.dataset.skill;
                const skill = u.skills.find(s => s.id === sid);
                if (skill) alert(`${skill.name}\n类型: ${skill.type === 'passive' ? '被动' : '主动'}\n范围: ${skill.range || '-'}\nSP: ${skill.spCost || 0}\n${skill.desc}`);
            };
        });
    },

    renderPlayerBars() {
        const p1Bar = document.getElementById('player1-generals');
        const p2Bar = document.getElementById('player2-generals');
        if (!p1Bar || !p2Bar) return;

        const renderBar = (player, container) => {
            const units = this.state.units.filter(u => u.player === player && !u.dead);
            container.innerHTML = units.map(u => {
                const hpPercent = (u.hp / u.maxHp * 100).toFixed(0);
                const isSummon = u.isSummon ? ' summon' : '';
                return `
                    <div class="bar-general ${u.dead ? 'dead' : ''} p${player}${isSummon}" data-unit-id="${u.id}">
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

        const moveRangeStr = Array.isArray(unit.moveRange) ? unit.moveRange.join(', ') : unit.moveRange;
        const attackRangeStr = Array.isArray(unit.attackRange) ? unit.attackRange.join(', ') : unit.attackRange;

        let debuffHtml = '';
        if (unit.debuffs && unit.debuffs.length > 0) {
            debuffHtml = '<br>状态: ' + unit.debuffs.map(d => {
                if (d.type === 'poison') return `中毒(${d.turns}回合)`;
                if (d.type === 'stun') return `眩晕(${d.turns}回合)`;
                if (d.type === 'slow') return `减速(${d.turns}回合)`;
                return d.type;
            }).join(', ');
        }
        if (unit.stunned) debuffHtml += '<br>眩晕中，无法行动';
        if (unit.counterRate) debuffHtml += `<br>反击率: ${Math.floor(unit.counterRate * 100)}%`;
        if (unit.dodgeRate) debuffHtml += `<br>闪避率: ${Math.floor(unit.dodgeRate * 100)}%`;

        statsEl.innerHTML = `
            HP: ${unit.hp}/${unit.maxHp} | SP: ${unit.sp}/${unit.maxSp}<br>
            攻击: ${unit.atk} | 防御: ${unit.def} | 移动: ${unit.mov}<br>
            移动范围: ${moveRangeStr}<br>
            攻击范围: ${attackRangeStr}
            ${debuffHtml}
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

    // ================================
    // 特效系统
    // ================================
    showFloatingText(x, y, text, type) {
        const cell = document.querySelector(`#battle-board .cell[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;
        const el = document.createElement('div');
        el.className = `float-text ${type}`;
        el.textContent = text;
        cell.appendChild(el);
        setTimeout(() => el.remove(), 800);
    },

    showTurnBanner(text) {
        const banner = document.createElement('div');
        banner.className = 'turn-banner';
        banner.textContent = text;
        document.body.appendChild(banner);
        setTimeout(() => {
            banner.classList.add('fade-out');
            setTimeout(() => banner.remove(), 500);
        }, 800);
    },

    addLungeAnimation(attacker, target) {
        const cell = document.querySelector(`#battle-board .cell[data-x="${attacker.x}"][data-y="${attacker.y}"]`);
        if (!cell) return;
        const unitEl = cell.querySelector('.unit');
        if (!unitEl) return;
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
        unitEl.classList.add(`lunge-${dir}`);
        setTimeout(() => unitEl.classList.remove(`lunge-${dir}`), 200);
    },

    addHitAnimation(target) {
        const cell = document.querySelector(`#battle-board .cell[data-x="${target.x}"][data-y="${target.y}"]`);
        if (!cell) return;
        const unitEl = cell.querySelector('.unit');
        if (!unitEl) return;
        unitEl.classList.add('hit');
        setTimeout(() => unitEl.classList.remove('hit'), 300);
    },

    addDeathAnimation(unit) {
        const cell = document.querySelector(`#battle-board .cell[data-x="${unit.x}"][data-y="${unit.y}"]`);
        if (!cell) return;
        const unitEl = cell.querySelector('.unit');
        if (!unitEl) return;
        unitEl.classList.add('dying');
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
            const attacker = this.state.selectedUnit;
            const result = Effect.damage(attacker, unit, attacker.atk);
            this.addLungeAnimation(attacker, unit);
            if (result.type === 'dodge') {
                this.state.logs.push(`${unit.name} 闪避了攻击！`);
                this.showFloatingText(unit.x, unit.y, '闪避', 'dodge');
            } else {
                this.addHitAnimation(unit);
                this.showFloatingText(unit.x, unit.y, `-${result.damage}`, 'damage');
                if (unit.dead) {
                    this.state.logs.push(`${attacker.name} 击杀 ${unit.name}`);
                    this.addDeathAnimation(unit);
                } else {
                    this.state.logs.push(`${attacker.name} 攻击 ${unit.name} -${result.damage}`);
                }
            }
            if (result.counter) {
                this.state.logs.push(`${unit.name} 反击 -${result.counter}`);
                this.showFloatingText(attacker.x, attacker.y, `反击-${result.counter}`, 'counter');
                this.addHitAnimation(attacker);
            }
            attacker.attacked = true;
            this.clearHighlights();
            this.checkWin();
            this.renderBattle();
            return;
        }

        if (hlSkill && this.state.selectedUnit && this.state.currentSkill) {
            const skill = this.state.currentSkill;
            const attacker = this.state.selectedUnit;
            attacker.sp -= skill.spCost;
            if (skill.category === 'summon') {
                if (!this.getUnit(x, y)) {
                    skill.content(attacker, { x, y }, this.state);
                    this.state.logs.push(`${attacker.name} 召唤 ${SUMMONS[skill.summon].name}`);
                }
            } else if (unit && unit.player !== attacker.player) {
                const result = skill.content(attacker, unit, this.state);
                if (result.type === 'aoe') {
                    this.state.logs.push(`${attacker.name} ${skill.name} AOE伤害`);
                    result.targets.forEach(t => {
                        const tUnit = this.state.units.find(u => u.name === t.name && !u.dead);
                        if (tUnit) {
                            if (t.type === 'dodge') this.showFloatingText(tUnit.x, tUnit.y, '闪避', 'dodge');
                            else {
                                this.showFloatingText(tUnit.x, tUnit.y, `-${t.damage}`, 'damage');
                                this.addHitAnimation(tUnit);
                                if (tUnit.dead) this.addDeathAnimation(tUnit);
                            }
                        }
                        if (t.type === 'dodge') this.state.logs.push(`  ${t.name} 闪避`);
                        else this.state.logs.push(`  ${t.name} -${t.damage}`);
                    });
                } else if (result.type === 'pierce') {
                    this.state.logs.push(`${attacker.name} ${skill.name} 穿透攻击`);
                    result.targets.forEach(t => {
                        const tUnit = this.state.units.find(u => u.name === t.name && !u.dead);
                        if (tUnit) {
                            if (t.type === 'dodge') this.showFloatingText(tUnit.x, tUnit.y, '闪避', 'dodge');
                            else {
                                this.showFloatingText(tUnit.x, tUnit.y, `-${t.damage}`, 'damage');
                                this.addHitAnimation(tUnit);
                                if (tUnit.dead) this.addDeathAnimation(tUnit);
                            }
                        }
                        if (t.type === 'dodge') this.state.logs.push(`  ${t.name} 闪避`);
                        else this.state.logs.push(`  ${t.name} -${t.damage}`);
                    });
                } else if (result.type === 'damage') {
                    this.addHitAnimation(unit);
                    if (result.type === 'dodge') {
                        this.state.logs.push(`${unit.name} 闪避了！`);
                        this.showFloatingText(unit.x, unit.y, '闪避', 'dodge');
                    } else if (unit.dead) {
                        this.state.logs.push(`${attacker.name} 击杀 ${unit.name}`);
                        this.showFloatingText(unit.x, unit.y, `-${result.damage}`, 'damage');
                        this.addDeathAnimation(unit);
                    } else {
                        this.state.logs.push(`${attacker.name} ${skill.name} ${unit.name} -${result.damage}`);
                        this.showFloatingText(unit.x, unit.y, `-${result.damage}`, 'damage');
                    }
                } else if (result.type === 'poison') {
                    this.state.logs.push(`${attacker.name} 使 ${unit.name} 中毒`);
                    this.showFloatingText(unit.x, unit.y, '中毒', 'damage');
                } else if (result.type === 'stun') {
                    this.state.logs.push(`${attacker.name} 眩晕 ${unit.name}`);
                    this.showFloatingText(unit.x, unit.y, '眩晕', 'damage');
                } else if (result.type === 'slow') {
                    this.state.logs.push(`${attacker.name} 减速 ${unit.name}`);
                    this.showFloatingText(unit.x, unit.y, '减速', 'damage');
                } else if (result.heal) {
                    this.state.logs.push(`${attacker.name} ${skill.name} 治疗${result.heal}`);
                    this.showFloatingText(attacker.x, attacker.y, `+${result.heal}`, 'heal');
                } else if (result.type === 'summon') {
                    this.state.logs.push(`${attacker.name} 召唤 ${result.unit.name}`);
                }
            }
            attacker.usedSkill = true;
            this.state.currentSkill = null;
            this.clearHighlights();
            this.checkWin();
            this.renderBattle();
            return;
        }

        if (unit && unit.player === this.state.currentPlayer) {
            if (unit.stunned) {
                this.state.logs.push(`${unit.name} 处于眩晕状态，无法行动`);
                return;
            }
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
        // 构建所有存活单位的位置集合（用于范围阻断）
        const blockedSet = new Set();
        this.state.units.forEach(u => {
            if (!u.dead) blockedSet.add(`${u.x},${u.y}`);
        });
        if (!unit.moved) {
            // 移动范围：被任何单位阻断，且目标格必须为空
            const moveRange = Range.parseBlocked(unit.moveRange || '+' + unit.mov, unit.x, unit.y, blockedSet);
            moveRange.forEach(p => {
                if (!this.getUnit(p.x, p.y)) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'move' });
                }
            });
        }
        if (!unit.attacked) {
            // 攻击范围：被任何单位阻断（视线阻断），但阻挡格本身如果是敌人仍可攻击
            const attackRange = Range.parseBlocked(unit.attackRange || '+1', unit.x, unit.y, blockedSet);
            attackRange.forEach(p => {
                const target = this.getUnit(p.x, p.y);
                if (target && target.player !== unit.player) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'attack' });
                } else if (!target) {
                    this.state.highlights.push({ x: p.x, y: p.y, type: 'attack-range' });
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
            // Buff 结算
            if (u.buffs) {
                const newBuffs = [];
                u.buffs.forEach(b => {
                    b.turns--;
                    if (b.turns > 0) newBuffs.push(b);
                    else u[b.stat] -= b.value;
                });
                u.buffs = newBuffs;
            }
            // Debuff 结算
            if (u.debuffs) {
                const newDebuffs = [];
                u.debuffs.forEach(d => {
                    d.turns--;
                    if (!u.dead) {
                        if (d.type === 'poison') {
                            u.hp = Math.max(1, u.hp - d.damage);
                            this.state.logs.push(`${u.name} 中毒 -${d.damage}`);
                        }
                        if (d.type === 'burn') {
                            u.hp = Math.max(1, u.hp - d.damage);
                            this.state.logs.push(`${u.name} 燃烧 -${d.damage}`);
                        }
                    }
                    if (d.turns > 0) newDebuffs.push(d);
                    else {
                        // 减速恢复
                        if (d.type === 'slow') u.mov = d.originalMov || u.mov;
                        // 破甲恢复
                        if (d.type === 'shredDef') u.def = d.originalDef || u.def;
                        // 混乱解除
                        if (d.type === 'confuse') {
                            u.confused = 0;
                            this.state.logs.push(`${u.name} 混乱解除`);
                        }
                    }
                });
                u.debuffs = newDebuffs;
            }
            // 眩晕递减
            if (u.stunned && u.stunned > 0) {
                u.stunned--;
                if (u.stunned <= 0) {
                    u.stunned = 0;
                    this.state.logs.push(`${u.name} 眩晕解除`);
                }
            }
            // 混乱递减
            if (u.confused && u.confused > 0) {
                u.confused--;
                if (u.confused <= 0) u.confused = 0;
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
            setTimeout(() => this.aiTurn(), 1200);
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
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && !this.getUnit(nx, ny)) {
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
