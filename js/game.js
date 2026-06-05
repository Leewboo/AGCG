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
                    alert(`${g.name}`);
                }
            };
        });
    },

    confirmSelect() {
        if (this.state.currentPlayer === 1) {
            this.state.currentPlayer = 2;
            if (this.state.mode === 'pve') {
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
            name: general.name,
            player: player,
            x, y
        };
        this.state.units.push(unit);
        deployed.push({ generalId: general.id, unitId: unit.id });
        this.state.players[player].toDeploy = null;

        if (deployed.length === 5) {
            if (player === 1) {
                this.state.currentPlayer = 2;
                if (this.state.mode === 'pve') {
                    this.startBattle();
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
                    if (unit) {
                        cellHtml += `<div class="unit p${unit.player} ${this.state.selectedUnit?.id === unit.id ? 'selected' : ''}">
                            <div class="unit-icon">${unit.name}</div>
                        </div>`;
                    }
                    cell.innerHTML = cellHtml;

                    cell.onclick = () => this.handleBattleClick(x, y);
                    board.appendChild(cell);
                }
            }
        }

        if (log) log.innerHTML = this.state.logs.slice(-8).map(l => `<div class="log-entry">${l}</div>`).join('');
    },

    getUnit(x, y) {
        return this.state.units.find(u => u.x === x && u.y === y);
    },

    handleBattleClick(x, y) {
        const unit = this.getUnit(x, y);

        if (unit && unit.player === this.state.currentPlayer) {
            this.state.selectedUnit = unit;
            this.renderBattle();
            return;
        }

        this.state.selectedUnit = null;
        this.renderBattle();
    },

    showDetail(unit) {
        const panel = document.getElementById('detail-panel');
        const nameEl = document.getElementById('detail-name');
        const statsEl = document.getElementById('detail-stats');
        const skillsEl = document.getElementById('detail-skills');

        nameEl.textContent = unit.name;
        statsEl.textContent = '暂无数据';
        skillsEl.innerHTML = '';

        panel.classList.remove('hidden');
    },

    hideDetail() {
        document.getElementById('detail-panel').classList.add('hidden');
    },

    endTurn() {
        this.state.units.forEach(u => {
            u.moved = false;
            u.attacked = false;
            u.usedSkill = false;
        });

        this.state.selectedUnit = null;

        if (this.state.currentPlayer === 2) {
            this.state.turn++;
            this.state.currentPlayer = 1;
            this.state.logs.push(`第${this.state.turn}回合 红方`);
        } else {
            this.state.currentPlayer = 2;
            this.state.logs.push('蓝方回合');
        }

        this.checkWin();
        this.renderBattle();
    },

    checkWin() {
        const p1Alive = this.state.units.filter(u => u.player === 1 && u.generalId).length;
        const p2Alive = this.state.units.filter(u => u.player === 2 && u.generalId).length;
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
