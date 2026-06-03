const state = {
    view: 'menu',
    mode: null,
    player: 1,
    turn: 1,
    board: null,
    units: [],
    selected: null,
    selectedGeneral: null,
    players: { 1: { generals: [], deployed: [] }, 2: { generals: [], deployed: [] } },
    highlights: [],
    currentSkill: null,
    logs: []
};

function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function log(msg) {
    state.logs.push(msg);
    const el = document.getElementById('log');
    if (el) {
        el.innerHTML = state.logs.slice(-5).map(m => `<div class="entry">${m}</div>`).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initEvents();
});

function initEvents() {
    // 菜单
    const menuBtns = document.querySelectorAll('#menu .btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.mode = btn.dataset.mode;
            state.player = 1;
            state.players[1].generals = [];
            state.players[2].generals = [];
            renderSelect();
            show('select');
        });
    });

    // 选将确认
    const confirmBtn = document.getElementById('select-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (state.player === 1 && state.players[2].generals.length === 0) {
                state.player = 2;
                renderSelect();
            } else {
                initBoard();
                state.player = 1;
                renderDeploy();
                show('deploy');
            }
        });
    }

    // 结束回合
    const endBtn = document.getElementById('end-turn');
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            state.units.forEach(u => { u.moved = false; u.attacked = false; u.usedSkill = false; u.sp = Math.min(u.maxSp, u.sp + 20); });
            state.selected = null;
            state.highlights = [];
            state.currentSkill = null;
            if (state.player === 2) {
                state.player = 1;
                state.turn++;
            } else {
                state.player = 2;
                if (state.mode === 'pve') {
                    aiTurn();
                }
            }
            log((state.player === 1 ? '红方' : '蓝方') + '回合');
            renderBattle();
        });
    }

    // 重新开始
    const restartBtn = document.getElementById('restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            state.view = 'menu';
            state.mode = null;
            state.player = 1;
            state.turn = 1;
            state.board = null;
            state.units = [];
            state.selected = null;
            state.selectedGeneral = null;
            state.players = { 1: { generals: [], deployed: [] }, 2: { generals: [], deployed: [] } };
            state.highlights = [];
            state.currentSkill = null;
            state.logs = [];
            show('menu');
        });
    }
}

function renderSelect() {
    const list = document.getElementById('general-list');
    const title = document.getElementById('select-title');
    const count = document.getElementById('select-count');
    const confirm = document.getElementById('select-confirm');

    if (!list || !title || !count || !confirm) return;

    title.textContent = (state.player === 1 ? '红方' : '蓝方') + '选将';
    const sel = state.players[state.player].generals;
    count.textContent = sel.length + '/5';
    confirm.disabled = sel.length < 5;

    list.innerHTML = window.GAME_DATA.GENERALS.map(g => {
        const picked = sel.find(s => s.id === g.id);
        return `<div class="card ${picked ? 'selected' : ''}" data-id="${g.id}">
            <div class="icon">${g.icon}</div>
            <div class="name">${g.name}</div>
        </div>`;
    }).join('');

    list.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const g = window.GAME_DATA.GENERALS.find(x => x.id === id);
            const arr = state.players[state.player].generals;
            const idx = arr.findIndex(x => x.id === id);
            if (idx >= 0) {
                arr.splice(idx, 1);
            } else if (arr.length < 5) {
                arr.push({...g});
            }
            renderSelect();
        });
    });
}

function initBoard() {
    state.board = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            let t = 'grass';
            const r = Math.random();
            if (r < 0.1) t = 'mountain';
            else if (r < 0.15) t = 'river';
            else if (r < 0.2) t = 'city';
            state.board.push({ x, y, terrain: t, unit: null });
        }
    }
    state.units = [];
}

function getCell(x, y) {
    return state.board.find(c => c.x === x && c.y === y);
}

function getUnit(x, y) {
    return state.units.find(u => u.x === x && u.y === y && !u.dead);
}

function renderDeploy() {
    const board = document.getElementById('board');
    const title = document.getElementById('deploy-title');
    const panel = document.getElementById('deploy-list');

    if (!board || !title || !panel) return;

    title.textContent = (state.player === 1 ? '红方' : '蓝方') + '布阵 ' + state.players[state.player].deployed.length + '/5';

    board.innerHTML = state.board.map(c => {
        const u = getUnit(c.x, c.y);
        return `<div class="cell ${c.terrain}" data-x="${c.x}" data-y="${c.y}">
            ${u ? renderUnit(u) : ''}
        </div>`;
    }).join('');

    board.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            if (getUnit(x, y)) return;

            const gens = state.players[state.player].generals;
            const dep = state.players[state.player].deployed;
            for (const g of gens) {
                if (!dep.find(d => d.id === g.id)) {
                    const unit = {
                        id: Date.now() + Math.random(),
                        generalId: g.id,
                        name: g.name,
                        icon: g.icon,
                        player: state.player,
                        x, y,
                        hp: g.hp, maxHp: g.hp,
                        atk: g.atk, def: g.def,
                        mov: g.mov,
                        sp: g.sp, maxSp: g.sp,
                        skills: g.skills.map(s => ({...window.GAME_DATA.SKILLS[s]})),
                        dead: false,
                        moved: false, attacked: false, usedSkill: false
                    };
                    state.units.push(unit);
                    dep.push({ id: g.id });

                    if (dep.length === 5) {
                        if (state.player === 1) {
                            state.player = 2;
                            renderDeploy();
                        } else {
                            startBattle();
                        }
                    } else {
                        renderDeploy();
                    }
                    return;
                }
            }
        });
    });

    const gens = state.players[state.player].generals;
    const dep = state.players[state.player].deployed;
    panel.innerHTML = gens.map(g => {
        const done = dep.find(d => d.id === g.id);
        return `<div class="mini-card ${done ? '' : 'active'}">${g.icon} ${g.name}</div>`;
    }).join('');
}

function renderUnit(u) {
    const hpPct = (u.hp / u.maxHp * 100).toFixed(0);
    return `<div class="unit p${u.player} ${state.selected && state.selected.id === u.id ? 'selected' : ''}">
        ${u.name[0]}
        <div class="hp-bar"><div class="fill" style="width:${hpPct}%"></div></div>
    </div>`;
}

function startBattle() {
    state.view = 'battle';
    state.player = 1;
    state.turn = 1;
    state.selected = null;
    state.currentSkill = null;
    state.highlights = [];
    log('战斗开始');
    renderBattle();
    show('battle');
}

function renderBattle() {
    const board = document.getElementById('battle-board');
    const info = document.getElementById('turn-info');
    const panel = document.getElementById('unit-panel');

    if (!board || !info || !panel) return;

    info.textContent = `第${state.turn}回合 ${state.player === 1 ? '红方' : '蓝方'}`;

    board.innerHTML = state.board.map(c => {
        const u = getUnit(c.x, c.y);
        const hl = state.highlights.find(h => h.x === c.x && h.y === c.y);
        let cls = c.terrain;
        if (hl) cls += ' highlight-' + hl.type;
        return `<div class="cell ${cls}" data-x="${c.x}" data-y="${c.y}">
            ${u ? renderUnit(u) : ''}
        </div>`;
    }).join('');

    board.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            handleCellClick(x, y);
        });
    });

    if (state.selected) {
        const u = state.selected;
        panel.innerHTML = `
            <div><strong>${u.icon} ${u.name}</strong></div>
            <div>HP: ${u.hp}/${u.maxHp} SP: ${u.sp}/${u.maxSp}</div>
            ${u.skills.map(s => `<button class="skill-btn" data-skill="${s.id}">${s.name}(${s.spCost})</button>`).join('')}
        `;
        panel.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sid = btn.dataset.skill;
                const sk = u.skills.find(s => s.id === sid);
                if (u.sp >= sk.spCost && !u.usedSkill) {
                    selectSkill(sk);
                }
            });
        });
    } else {
        panel.innerHTML = '';
    }
}

function handleCellClick(x, y) {
    const u = getUnit(x, y);

    // 移动
    const moveHl = state.highlights.find(h => h.x === x && h.y === y && h.type === 'move');
    if (moveHl && state.selected) {
        state.selected.x = x;
        state.selected.y = y;
        state.selected.moved = true;
        state.highlights = [];
        log(`${state.selected.name} 移动`);
        renderBattle();
        return;
    }

    // 攻击
    const atkHl = state.highlights.find(h => h.x === x && h.y === y && h.type === 'attack');
    if (atkHl && state.selected && u && u.player !== state.selected.player) {
        const dmg = Math.max(1, Math.floor(state.selected.atk - u.def / 2));
        u.hp -= dmg;
        if (u.hp <= 0) {
            u.dead = true;
            u.hp = 0;
            log(`${state.selected.name} 击杀 ${u.name}`);
        } else {
            log(`${state.selected.name} 攻击 ${u.name} 造成${dmg}伤害`);
        }
        state.selected.attacked = true;
        state.highlights = [];
        checkWin();
        renderBattle();
        return;
    }

    // 技能
    const skHl = state.highlights.find(h => h.x === x && h.y === y && h.type === 'skill');
    if (skHl && state.selected && state.currentSkill && u) {
        const sk = state.currentSkill;
        state.selected.sp -= sk.spCost;
        const dmg = Math.max(1, Math.floor(sk.damage));
        u.hp -= dmg;
        if (u.hp <= 0) {
            u.dead = true;
            u.hp = 0;
            log(`${state.selected.name} 用${sk.name}击杀${u.name}`);
        } else {
            log(`${state.selected.name} 使用${sk.name}对${u.name}造成${dmg}伤害`);
        }
        state.selected.usedSkill = true;
        state.currentSkill = null;
        state.highlights = [];
        checkWin();
        renderBattle();
        return;
    }

    // 选中单位
    if (u && u.player === state.player) {
        state.selected = u;
        state.highlights = [];
        state.currentSkill = null;
        // 显示可移动范围
        if (!u.moved) {
            for (let dy = -u.mov; dy <= u.mov; dy++) {
                for (let dx = -u.mov; dx <= u.mov; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= u.mov && (dx !== 0 || dy !== 0)) {
                        const nx = u.x + dx, ny = u.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && !getUnit(nx, ny)) {
                            state.highlights.push({ x: nx, y: ny, type: 'move' });
                        }
                    }
                }
            }
        }
        // 显示可攻击范围
        if (!u.attacked) {
            const range = u.skills.length > 0 ? window.GAME_DATA.SKILLS[u.skills[0].id]?.rangeValue || 1 : 1;
            for (let dy = -range; dy <= range; dy++) {
                for (let dx = -range; dx <= range; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= range && (dx !== 0 || dy !== 0)) {
                        const nx = u.x + dx, ny = u.y + dy;
                        const target = getUnit(nx, ny);
                        if (target && target.player !== u.player) {
                            state.highlights.push({ x: nx, y: ny, type: 'attack' });
                        }
                    }
                }
            }
        }
        renderBattle();
        return;
    }

    // 取消选中
    state.selected = null;
    state.highlights = [];
    state.currentSkill = null;
    renderBattle();
}

function selectSkill(sk) {
    if (!state.selected) return;
    state.currentSkill = sk;
    state.highlights = [];
    const u = state.selected;
    for (let dy = -sk.rangeValue; dy <= sk.rangeValue; dy++) {
        for (let dx = -sk.rangeValue; dx <= sk.rangeValue; dx++) {
            if (Math.abs(dx) + Math.abs(dy) <= sk.rangeValue) {
                const nx = u.x + dx, ny = u.y + dy;
                const target = getUnit(nx, ny);
                if (target && target.player !== u.player) {
                    state.highlights.push({ x: nx, y: ny, type: 'skill' });
                }
            }
        }
    }
    renderBattle();
}

function checkWin() {
    const p1 = state.units.filter(u => u.player === 1 && !u.dead);
    const p2 = state.units.filter(u => u.player === 2 && !u.dead);
    if (p1.length === 0) {
        document.getElementById('winner-text').textContent = '蓝方 胜利';
        show('gameover');
    } else if (p2.length === 0) {
        document.getElementById('winner-text').textContent = '红方 胜利';
        show('gameover');
    }
}

function aiTurn() {
    const units = state.units.filter(u => u.player === 2 && !u.dead);
    units.forEach(u => {
        const enemies = state.units.filter(e => e.player === 1 && !e.dead);
        if (enemies.length === 0) return;
        let target = enemies[0];
        let minDist = 999;
        enemies.forEach(e => {
            const d = Math.abs(e.x - u.x) + Math.abs(e.y - u.y);
            if (d < minDist) { minDist = d; target = e; }
        });

        if (!u.moved && minDist > 1) {
            const dx = Math.sign(target.x - u.x);
            const dy = Math.sign(target.y - u.y);
            const nx = u.x + (dx !== 0 ? dx : 0);
            const ny = u.y + (dy !== 0 ? dy : 0);
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && !getUnit(nx, ny)) {
                u.x = nx; u.y = ny; u.moved = true;
            }
        }

        const dist = Math.abs(target.x - u.x) + Math.abs(target.y - u.y);
        if (dist <= 1 && !u.attacked) {
            const dmg = Math.max(1, Math.floor(u.atk - target.def / 2));
            target.hp -= dmg;
            if (target.hp <= 0) { target.dead = true; target.hp = 0; log(`AI ${u.name} 击杀 ${target.name}`); }
            else { log(`AI ${u.name} 攻击 ${target.name} 造成${dmg}伤害`); }
            u.attacked = true;
        }
    });
    checkWin();
    setTimeout(() => {
        state.units.forEach(u => { u.moved = false; u.attacked = false; u.usedSkill = false; u.sp = Math.min(u.maxSp, u.sp + 20); });
        state.player = 1;
        state.turn++;
        log('红方回合');
        renderBattle();
    }, 500);
}
