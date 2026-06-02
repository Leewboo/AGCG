class Renderer {
    constructor(canvas, state) {
        this.c = canvas;
        this.ctx = canvas.getContext('2d');
        this.s = state;
        this.cell = 60;
        this.ox = 0;
        this.oy = 0;
    }

    resize(w, h) {
        this.c.width = w;
        this.c.height = h;
        const n = this.s.board ? this.s.board.size : 8;
        this.cell = Math.min(w / (n + 2), h / (n + 3));
        this.ox = (w - n * this.cell) / 2;
        this.oy = (h - n * this.cell) / 2 + 20;
    }

    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
    }

    text(t, x, y, size, color, align) {
        this.ctx.font = size + 'px sans-serif';
        this.ctx.textAlign = align || 'center';
        this.ctx.fillStyle = color;
        this.ctx.fillText(t, x, y);
    }

    rect(x, y, w, h, fill, stroke) {
        if (fill) {
            this.ctx.fillStyle = fill;
            this.ctx.fillRect(x, y, w, h);
        }
        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, w, h);
        }
    }

    circle(x, y, r, fill, stroke) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        if (fill) {
            this.ctx.fillStyle = fill;
            this.ctx.fill();
        }
        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    menu() {
        this.clear();
        const cx = this.c.width / 2;
        const cy = this.c.height / 2;
        this.text('全将战棋', cx, cy - 80, 40, '#fff');
        this.text('世界策略对弈', cx, cy - 45, 16, '#888');

        const btns = ['双人对战', '人机对战'];
        btns.forEach((b, i) => {
            const y = cy + i * 55;
            this.rect(cx - 80, y - 20, 160, 40, '#222', '#444');
            this.text(b, cx, y + 7, 16, '#fff');
        });
    }

    select() {
        this.clear();
        const cx = this.c.width / 2;
        const p = this.s.selectingPlayer;
        const sel = this.s.players[p].selectedGenerals;

        this.text((p === 1 ? '红方' : '蓝方') + '选将', cx, 40, 24, '#fff');
        this.text(sel.length + '/5', cx, 70, 16, '#888');

        const gens = window.GAME_DATA.GENERALS;
        const cw = this.c.width < 500 ? 70 : 100;
        const ch = this.c.height < 600 ? 80 : 120;
        const gap = 10;
        const cols = Math.floor((this.c.width - 20) / (cw + gap));
        const sx = (this.c.width - cols * (cw + gap) + gap) / 2;
        const sy = 100;

        gens.forEach((g, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = sx + c * (cw + gap);
            const y = sy + r * (ch + gap);
            const picked = sel.find(s => s.id === g.id);

            this.rect(x, y, cw, ch, picked ? '#333' : '#1a1a1a', picked ? '#666' : '#333');
            this.text(g.icon, x + cw / 2, y + ch / 2 - 5, cw * 0.4, '#fff');
            this.text(g.name, x + cw / 2, y + ch - 15, 12, '#aaa');
        });

        if (sel.length === 5) {
            this.rect(cx - 60, this.c.height - 60, 120, 36, '#222', '#555');
            this.text('确认', cx, this.c.height - 37, 16, '#fff');
        }
    }

    deploy() {
        this.clear();
        this.board();
        this.units();

        const cx = this.c.width / 2;
        const p = this.s.currentPlayer;
        const d = this.s.players[p].deployedUnits.length;
        this.text('布阵 ' + (p === 1 ? '红方' : '蓝方') + ' ' + d + '/5', cx, 30, 18, '#fff');
    }

    battle() {
        this.clear();
        this.board();
        this.highlights();
        this.units();

        const cx = this.c.width / 2;
        this.text('第' + this.s.turn + '回合 ' + (this.s.currentPlayer === 1 ? '红方' : '蓝方'), cx, 25, 14, '#888');

        if (this.s.selectedUnit) {
            const u = this.s.selectedUnit;
            const px = 10;
            let py = this.c.height - 100;
            this.text(u.name + ' HP:' + u.hp + '/' + u.maxHp + ' SP:' + u.sp, px, py, 12, '#aaa', 'left');

            u.skills.forEach((sk, i) => {
                py += 18;
                const can = u.sp >= sk.spCost && !u.hasUsedSkill;
                this.text(sk.name + '(' + sk.spCost + ')', px, py, 11, can ? '#fff' : '#444', 'left');
            });
        }

        const logs = this.s.actionLog.slice(-5);
        logs.forEach((l, i) => {
            this.text(l.message, this.c.width - 10, this.c.height - 20 - i * 14, 10, '#555', 'right');
        });
    }

    over() {
        this.clear();
        const cx = this.c.width / 2;
        const cy = this.c.height / 2;
        this.text((this.s.winner === 1 ? '红方' : '蓝方') + ' 胜利', cx, cy, 36, this.s.winner === 1 ? '#c44' : '#48c');
        this.rect(cx - 60, cy + 30, 120, 36, '#222', '#444');
        this.text('再来一局', cx, cy + 53, 16, '#fff');
    }

    board() {
        if (!this.s.board) return;
        const n = this.s.board.size;
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                const t = this.s.getTile(x, y);
                const px = this.ox + x * this.cell;
                const py = this.oy + y * this.cell;
                const colors = { GRASS: '#1a1a1a', MOUNTAIN: '#2a2a2a', RIVER: '#1a202a', CITY: '#2a1a1a' };
                this.rect(px, py, this.cell, this.cell, colors[t.terrain] || '#1a1a1a', '#222');
            }
        }
    }

    highlights() {
        const colors = {
            moveableTiles: 'rgba(100,200,100,0.15)',
            attackableTiles: 'rgba(200,100,100,0.15)',
            skillTargetTiles: 'rgba(100,100,200,0.15)'
        };
        for (const key of ['moveableTiles', 'attackableTiles', 'skillTargetTiles']) {
            for (const t of this.s[key]) {
                this.rect(this.ox + t.x * this.cell, this.oy + t.y * this.cell, this.cell, this.cell, colors[key]);
            }
        }
    }

    units() {
        for (const u of this.s.units) {
            if (u.isDead) continue;
            const px = this.ox + u.pos.x * this.cell;
            const py = this.oy + u.pos.y * this.cell;
            const cx = px + this.cell / 2;
            const cy = py + this.cell / 2;
            const r = this.cell / 2 - 4;
            const sel = this.s.selectedUnit && this.s.selectedUnit.id === u.id;

            if (sel) {
                this.circle(cx, cy, r + 3, '#fff');
            }
            this.circle(cx, cy, r, u.player === 1 ? '#c44' : '#48c');
            this.text(u.name[0], cx, cy + 4, this.cell * 0.5, '#fff');

            const bw = this.cell - 6;
            const bh = 3;
            const bx = px + 3;
            const by = py + this.cell - 6;
            this.rect(bx, by, bw, bh, '#333');
            this.rect(bx, by, bw * (u.hp / u.maxHp), bh, u.hp > u.maxHp * 0.3 ? '#4a4' : '#a44');
        }
    }

    render() {
        switch (this.s.viewState) {
            case 'MENU': this.menu(); break;
            case 'SELECT_P1':
            case 'SELECT_P2': this.select(); break;
            case 'DEPLOY': this.deploy(); break;
            case 'BATTLE': this.battle(); break;
            case 'GAME_OVER': this.over(); break;
        }
    }
}

window.Renderer = Renderer;
