class UI {
    constructor(canvas, state, board, renderer, combat, game) {
        this.c = canvas;
        this.s = state;
        this.b = board;
        this.r = renderer;
        this.combat = combat;
        this.g = game;
        this.setup();
    }

    setup() {
        this.c.addEventListener('click', e => this.click(e));
        this.c.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            this.click({ clientX: t.clientX, clientY: t.clientY });
        }, { passive: false });
    }

    pos(e) {
        const rect = this.c.getBoundingClientRect();
        const sx = this.c.width / rect.width;
        const sy = this.c.height / rect.height;
        return {
            x: (e.clientX - rect.left) * sx,
            y: (e.clientY - rect.top) * sy
        };
    }

    toBoard(p) {
        return {
            x: Math.floor((p.x - this.r.ox) / this.r.cell),
            y: Math.floor((p.y - this.r.oy) / this.r.cell)
        };
    }

    inRect(p, x, y, w, h) {
        return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
    }

    click(e) {
        const p = this.pos(e);
        switch (this.s.viewState) {
            case 'MENU': this.menuClick(p); break;
            case 'SELECT_P1':
            case 'SELECT_P2': this.selectClick(p); break;
            case 'DEPLOY': this.deployClick(p); break;
            case 'BATTLE': this.battleClick(p); break;
            case 'GAME_OVER': this.overClick(p); break;
        }
    }

    menuClick(p) {
        const cx = this.c.width / 2;
        const cy = this.c.height / 2;
        if (this.inRect(p, cx - 80, cy - 20, 160, 40)) {
            this.s.setGameMode('pvp');
            this.s.startNewGame();
        } else if (this.inRect(p, cx - 80, cy + 35, 160, 40)) {
            this.s.setGameMode('pve');
            this.s.startNewGame();
        }
    }

    selectClick(p) {
        const cx = this.c.width / 2;
        const sel = this.s.players[this.s.selectingPlayer].selectedGenerals;
        const gens = window.GAME_DATA.GENERALS;
        const cw = this.c.width < 500 ? 70 : 100;
        const ch = this.c.height < 600 ? 80 : 120;
        const gap = 10;
        const cols = Math.floor((this.c.width - 20) / (cw + gap));
        const sx = (this.c.width - cols * (cw + gap) + gap) / 2;
        const sy = 100;

        for (let i = 0; i < gens.length; i++) {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = sx + c * (cw + gap);
            const y = sy + r * (ch + gap);
            if (this.inRect(p, x, y, cw, ch)) {
                const g = gens[i];
                if (this.s.selectGeneral(this.s.selectingPlayer, g)) {
                    if (this.s.selectingPlayer === 1 && this.s.players[1].selectedGenerals.length === 5) {
                        this.s.switchSelectPlayer();
                    } else if (this.s.selectingPlayer === 2 && this.s.players[2].selectedGenerals.length === 5) {
                        this.s.switchSelectPlayer();
                    }
                }
                return;
            }
        }

        if (sel.length === 5 && this.inRect(p, cx - 60, this.c.height - 60, 120, 36)) {
            this.startDeploy();
        }
    }

    startDeploy() {
        this.s.initBoard(8);
        this.s.currentPlayer = 1;
        this.s.viewState = 'DEPLOY';
        this.s.players[1].deployedUnits = [];
        this.s.players[2].deployedUnits = [];
        this.g.resize();
    }

    deployClick(p) {
        const bp = this.toBoard(p);
        if (bp.x < 0 || bp.x >= 8 || bp.y < 0 || bp.y >= 8) return;
        if (this.s.getUnitAt(bp.x, bp.y)) return;

        const gens = this.s.players[this.s.currentPlayer].selectedGenerals;
        const dep = this.s.players[this.s.currentPlayer].deployedUnits;

        for (const g of gens) {
            if (!dep.find(d => d.generalId === g.id)) {
                this.s.createUnit(g, this.s.currentPlayer, bp.x, bp.y);
                dep.push({ generalId: g.id });

                if (dep.length === 5) {
                    if (this.s.currentPlayer === 1) {
                        this.s.currentPlayer = 2;
                    } else {
                        this.startBattle();
                    }
                }
                return;
            }
        }
    }

    startBattle() {
        this.s.viewState = 'BATTLE';
        this.s.currentPlayer = 1;
        this.s.turn = 1;
        this.s.addLog('战斗开始');
    }

    battleClick(p) {
        const bp = this.toBoard(p);
        if (bp.x >= 0 && bp.x < 8 && bp.y >= 0 && bp.y < 8) {
            const u = this.s.getUnitAt(bp.x, bp.y);

            if (this.s.moveableTiles.find(t => t.x === bp.x && t.y === bp.y)) {
                this.move(bp.x, bp.y);
                return;
            }
            if (this.s.attackableTiles.find(t => t.x === bp.x && t.y === bp.y)) {
                this.attack(bp.x, bp.y);
                return;
            }
            if (this.s.skillTargetTiles.find(t => t.x === bp.x && t.y === bp.y)) {
                this.useSkill(bp.x, bp.y);
                return;
            }

            if (u && u.player === this.s.currentPlayer) {
                this.s.selectUnit(u);
                this.s.moveableTiles = [];
                this.s.attackableTiles = [];
                this.s.skillTargetTiles = [];
                this.s.currentSkill = null;
            } else {
                this.s.clearSelection();
            }
        } else {
            this.uiClick(p);
        }
    }

    uiClick(p) {
        if (!this.s.selectedUnit) return;
        const u = this.s.selectedUnit;

        // 技能按钮 (左下角)
        let py = this.c.height - 100;
        for (const sk of u.skills) {
            if (this.inRect(p, 10, py - 12, 120, 18)) {
                if (u.sp >= sk.spCost && !u.hasUsedSkill) {
                    this.s.currentSkill = sk;
                    const ss = new SkillSystem(this.s, this.b);
                    this.s.skillTargetTiles = ss.getSkillPreview(u, sk);
                    this.s.moveableTiles = [];
                    this.s.attackableTiles = [];
                }
                return;
            }
            py += 18;
        }

        // 结束回合按钮 (右下角)
        if (this.inRect(p, this.c.width - 100, this.c.height - 40, 90, 30)) {
            this.endTurn();
        }
    }

    move(x, y) {
        this.s.moveUnit(this.s.selectedUnit, x, y);
        this.s.moveableTiles = [];
        this.s.addLog(this.s.selectedUnit.name + ' 移动');
    }

    attack(x, y) {
        const t = this.s.getUnitAt(x, y);
        if (!t) return;
        this.combat.executeAttack(this.s.selectedUnit, t);
        this.s.selectedUnit.hasAttacked = true;
        this.s.attackableTiles = [];
        this.s.checkWinCondition();
    }

    useSkill(x, y) {
        const t = this.s.getUnitAt(x, y);
        if (!t || !this.s.currentSkill) return;
        const ss = new SkillSystem(this.s, this.b);
        const r = ss.useSkill(this.s.selectedUnit, this.s.currentSkill, [{ unitId: t.id }]);
        if (r.success) {
            this.s.selectedUnit.hasUsedSkill = true;
        }
        this.s.currentSkill = null;
        this.s.skillTargetTiles = [];
        this.s.checkWinCondition();
    }

    endTurn() {
        this.s.addLog((this.s.currentPlayer === 1 ? '红方' : '蓝方') + ' 结束回合');
        this.s.switchPlayer();
        this.s.clearSelection();

        if (this.s.gameMode === 'pve' && this.s.currentPlayer === 2) {
            this.aiTurn();
        }
    }

    async aiTurn() {
        const ai = new AI(this.s, this.b);
        await ai.executeTurn();
        this.s.switchPlayer();
        this.s.clearSelection();
    }

    overClick(p) {
        const cx = this.c.width / 2;
        const cy = this.c.height / 2;
        if (this.inRect(p, cx - 60, cy + 30, 120, 36)) {
            this.s.reset();
        }
    }
}

window.UI = UI;
