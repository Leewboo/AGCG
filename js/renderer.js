// 全将战棋 - 渲染器

class Renderer {
    constructor(canvas, gameState, board) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = gameState;
        this.board = board;

        // 棋盘配置
        this.cellSize = 70;
        this.boardOffsetX = 0;
        this.boardOffsetY = 0;

        // 颜色配置
        this.colors = {
            boardBg: '#3d2914',
            tileGrass: '#4a7c3f',
            tileMountain: '#8b7355',
            tileRiver: '#4a90a4',
            tileCity: '#c9a227',
            tileBorder: '#2a1a0a',

            player1: '#c41e3a',      // 红色
            player2: '#1e5aa8',      // 蓝色
            selected: '#ffd700',    // 金色
            moveRange: 'rgba(100, 200, 100, 0.4)',
            attackRange: 'rgba(255, 100, 100, 0.4)',
            skillRange: 'rgba(100, 100, 255, 0.4)',

            textLight: '#f5f0e1',
            textDark: '#1a1a2e',

            hpBarBg: '#333',
            hpBarFill: '#4caf50',
            spBarFill: '#2196f3'
        };

        // 动画状态
        this.animations = [];
    }

    // 调整画布大小
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        // 计算棋盘偏移
        const boardSize = this.state.board ? this.state.board.size : 8;
        const boardPixelSize = boardSize * this.cellSize;
        this.boardOffsetX = (width - boardPixelSize) / 2;
        this.boardOffsetY = (height - boardPixelSize) / 2;
    }

    // 清空画布
    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 渲染棋盘
    renderBoard() {
        if (!this.state.board) return;

        const size = this.state.board.size;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                this.renderTile(x, y);
            }
        }
    }

    // 渲染单个格子
    renderTile(x, y) {
        const tile = this.state.getTile(x, y);
        const px = this.boardOffsetX + x * this.cellSize;
        const py = this.boardOffsetY + y * this.cellSize;

        // 背景
        this.ctx.fillStyle = this.getTerrainColor(tile.terrain);
        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);

        // 边框
        this.ctx.strokeStyle = this.colors.tileBorder;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);

        // 地形装饰
        this.renderTerrainDecor(tile, px, py);
    }

    // 获取地形颜色
    getTerrainColor(terrainId) {
        const terrain = window.GAME_DATA.TERRAIN_TYPES[terrainId];
        switch (terrainId) {
            case 'MOUNTAIN': return this.colors.tileMountain;
            case 'RIVER': return this.colors.tileRiver;
            case 'CITY': return this.colors.tileCity;
            default: return this.colors.tileGrass;
        }
    }

    // 渲染地形装饰
    renderTerrainDecor(tile, px, py) {
        const cx = px + this.cellSize / 2;
        const cy = py + this.cellSize / 2;

        this.ctx.font = '24px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        switch (tile.terrain) {
            case 'MOUNTAIN':
                this.ctx.fillText('⛰️', cx, cy);
                break;
            case 'RIVER':
                this.ctx.fillText('🌊', cx, cy);
                break;
            case 'CITY':
                this.ctx.fillText('🏰', cx, cy);
                break;
        }
    }

    // 渲染范围高亮
    renderRangeHighlights() {
        // 移动范围
        for (const tile of this.state.moveableTiles) {
            this.renderTileHighlight(tile.x, tile.y, this.colors.moveRange);
        }

        // 攻击范围
        for (const tile of this.state.attackableTiles) {
            this.renderTileHighlight(tile.x, tile.y, this.colors.attackRange);
        }

        // 技能范围
        for (const tile of this.state.skillTargetTiles) {
            this.renderTileHighlight(tile.x, tile.y, this.colors.skillRange);
        }
    }

    // 渲染格子高亮
    renderTileHighlight(x, y, color) {
        const px = this.boardOffsetX + x * this.cellSize;
        const py = this.boardOffsetY + y * this.cellSize;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
    }

    // 渲染单位
    renderUnits() {
        for (const unit of this.state.units) {
            if (!unit.isDead) {
                this.renderUnit(unit);
            }
        }
    }

    // 渲染单个单位
    renderUnit(unit) {
        const px = this.boardOffsetX + unit.pos.x * this.cellSize;
        const py = this.boardOffsetY + unit.pos.y * this.cellSize;
        const cx = px + this.cellSize / 2;
        const cy = py + this.cellSize / 2;

        // 判断是否选中
        const isSelected = this.state.selectedUnit && this.state.selectedUnit.id === unit.id;

        // 单位背景圆
        const radius = this.cellSize / 2 - 5;
        const bgColor = unit.player === 1 ? this.colors.player1 : this.colors.player2;

        // 选中光晕
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.selected;
            this.ctx.fill();
        }

        // 单位圆形背景
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = bgColor;
        this.ctx.fill();
        this.ctx.strokeStyle = isSelected ? this.colors.selected : '#fff';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.stroke();

        // 图标
        this.ctx.font = '28px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(unit.icon, cx, cy - 5);

        // 名称
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(unit.name, cx, cy + 18);

        // 生命条
        this.renderHPBar(unit, px, py);

        // 技能能量条
        this.renderSPBar(unit, px, py);
    }

    // 渲染生命条
    renderHPBar(unit, px, py) {
        const barWidth = this.cellSize - 10;
        const barHeight = 6;
        const x = px + 5;
        const y = py + this.cellSize - 12;

        // 背景
        this.ctx.fillStyle = this.colors.hpBarBg;
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // 填充
        const fillWidth = (unit.hp / unit.maxHp) * barWidth;
        this.ctx.fillStyle = this.colors.hpBarFill;
        this.ctx.fillRect(x, y, fillWidth, barHeight);

        // 边框
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }

    // 渲染技能能量条
    renderSPBar(unit, px, py) {
        const barWidth = this.cellSize - 10;
        const barHeight = 4;
        const x = px + 5;
        const y = py + this.cellSize - 18;

        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // 填充
        const fillWidth = (unit.sp / unit.maxSp) * barWidth;
        this.ctx.fillStyle = this.colors.spBarFill;
        this.ctx.fillRect(x, y, fillWidth, barHeight);
    }

    // 渲染主菜单
    renderMenu() {
        this.clear();

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 标题
        this.ctx.font = 'bold 48px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText('全将战棋', centerX, centerY - 150);

        // 副标题
        this.ctx.font = '20px sans-serif';
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('世界策略对弈', centerX, centerY - 110);

        // 菜单选项
        const menuItems = [
            { text: '双人对战', y: centerY - 20 },
            { text: '人机对战', y: centerY + 30 },
            { text: 'DIY武将', y: centerY + 80 }
        ];

        for (const item of menuItems) {
            this.renderMenuButton(centerX - 100, item.y - 20, 200, 45, item.text);
        }
    }

    // 渲染菜单按钮
    renderMenuButton(x, y, width, height, text) {
        // 按钮背景
        this.ctx.fillStyle = '#c9a227';
        this.ctx.fillRect(x, y, width, height);

        // 按钮文字
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    // 渲染选将界面
    renderSelectScreen() {
        this.clear();

        const centerX = this.canvas.width / 2;

        // 标题
        this.ctx.font = 'bold 32px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.textLight;
        const title = this.state.selectingPlayer === 1 ? '红方选将' : '蓝方选将';
        this.ctx.fillText(title, centerX, 50);

        // 已选数量
        const selected = this.state.players[this.state.selectingPlayer].selectedGenerals;
        this.ctx.font = '20px sans-serif';
        this.ctx.fillText(`已选择: ${selected.length}/5`, centerX, 90);

        // 武将列表
        const generals = window.GAME_DATA.GENERALS;
        const startX = 50;
        const startY = 130;
        const cardWidth = 140;
        const cardHeight = 180;
        const gap = 15;

        for (let i = 0; i < generals.length; i++) {
            const general = generals[i];
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = startX + col * (cardWidth + gap);
            const y = startY + row * (cardHeight + gap);

            const isSelected = selected.find(g => g.id === general.id);
            this.renderGeneralCard(x, y, cardWidth, cardHeight, general, isSelected);
        }

        // 确认按钮
        if (selected.length === 5) {
            this.renderMenuButton(centerX - 80, this.canvas.height - 80, 160, 50, '布阵阶段');
        }
    }

    // 渲染武将卡片
    renderGeneralCard(x, y, width, height, general, isSelected) {
        // 卡片背景
        this.ctx.fillStyle = isSelected ? '#c9a227' : '#2a2a3e';
        this.ctx.fillRect(x, y, width, height);

        // 边框
        this.ctx.strokeStyle = isSelected ? '#ffd700' : '#555';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.strokeRect(x, y, width, height);

        // 图标
        this.ctx.font = '48px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(general.icon, x + width / 2, y + 50);

        // 名称
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillStyle = isSelected ? '#000' : '#fff';
        this.ctx.fillText(general.name, x + width / 2, y + 85);

        // 属性
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'left';
        const attrs = [
            `HP:${general.hp}`,
            `ATK:${general.atk}`,
            `DEF:${general.def}`,
            `MOV:${general.mov}`
        ];
        attrs.forEach((attr, i) => {
            this.ctx.fillText(attr, x + 10, y + 110 + i * 18);
        });

        // 技能名
        if (general.skills.length > 0) {
            const skill = window.GAME_DATA.SKILLS[general.skills[0]];
            this.ctx.font = '11px sans-serif';
            this.ctx.fillStyle = '#aaa';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(skill.name, x + width / 2, y + height - 15);
        }
    }

    // 渲染布阵界面
    renderDeployScreen() {
        this.clear();

        // 渲染棋盘
        this.renderBoard();

        // 渲染已部署单位
        this.renderUnits();

        // 布阵提示
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText('布阵阶段', this.canvas.width / 2, 30);

        // 当前布阵玩家
        const currentDeploy = this.state.currentPlayer;
        const deployed = this.state.players[currentDeploy].deployedUnits.length;
        this.ctx.font = '18px sans-serif';
        this.ctx.fillText(`${currentDeploy === 1 ? '红方' : '蓝方'}布阵: ${deployed}/5`, this.canvas.width / 2, 60);

        // 显示待部署武将
        const generals = this.state.players[currentDeploy].selectedGenerals;
        this.renderDeployPanel(generals);
    }

    // 渲染布阵面板
    renderDeployPanel(generals) {
        const panelWidth = 200;
        const panelX = this.canvas.width - panelWidth - 20;
        const panelY = 100;
        const cardHeight = 50;
        const gap = 10;

        for (let i = 0; i < generals.length; i++) {
            const general = generals[i];
            const y = panelY + i * (cardHeight + gap);

            // 检查是否已部署
            const isDeployed = this.state.players[this.state.currentPlayer].deployedUnits.find(
                d => d.generalId === general.id
            );

            this.ctx.globalAlpha = isDeployed ? 0.3 : 1;

            // 卡片背景
            this.ctx.fillStyle = '#2a2a3e';
            this.ctx.fillRect(panelX, y, panelWidth, cardHeight);

            // 边框
            this.ctx.strokeStyle = '#555';
            this.ctx.strokeRect(panelX, y, panelWidth, cardHeight);

            // 图标和名称
            this.ctx.font = '24px serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(general.icon, panelX + 10, y + 30);
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(general.name, panelX + 45, y + 30);

            this.ctx.globalAlpha = 1;
        }
    }

    // 渲染对战界面
    renderBattleScreen() {
        this.clear();

        // 渲染棋盘
        this.renderBoard();

        // 渲染范围高亮
        this.renderRangeHighlights();

        // 渲染单位
        this.renderUnits();

        // 回合信息
        this.renderTurnInfo();

        // 操作面板
        this.renderActionPanel();

        // 日志
        this.renderLog();
    }

    // 渲染回合信息
    renderTurnInfo() {
        const x = this.canvas.width / 2;
        const y = 30;

        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText(this.state.getTurnText(), x, y);
    }

    // 渲染操作面板
    renderActionPanel() {
        const panelWidth = 180;
        const panelX = 20;
        const panelY = 80;
        const buttonHeight = 40;
        const gap = 10;

        // 选中单位信息
        if (this.state.selectedUnit) {
            const unit = this.state.selectedUnit;
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`${unit.icon} ${unit.name}`, panelX, panelY);
            this.ctx.font = '14px sans-serif';
            this.ctx.fillText(`HP: ${unit.hp}/${unit.maxHp}`, panelX, panelY + 20);
            this.ctx.fillText(`SP: ${unit.sp}/${unit.maxSp}`, panelX, panelY + 40);

            // 技能列表
            let skillY = panelY + 70;
            for (const skill of unit.skills) {
                const canUse = unit.sp >= skill.spCost && !unit.hasUsedSkill;
                this.ctx.fillStyle = canUse ? '#2a2a3e' : '#333';
                this.ctx.fillRect(panelX, skillY, panelWidth, buttonHeight);
                this.ctx.strokeStyle = canUse ? '#c9a227' : '#555';
                this.ctx.strokeRect(panelX, skillY, panelWidth, buttonHeight);

                this.ctx.font = '14px sans-serif';
                this.ctx.fillStyle = canUse ? '#fff' : '#666';
                this.ctx.fillText(`${skill.name} (${skill.spCost}SP)`, panelX + 10, skillY + 25);

                skillY += buttonHeight + gap;
            }

            // 操作按钮
            skillY += 20;

            // 移动/攻击/结束回合
            if (!unit.hasMoved) {
                this.ctx.fillStyle = '#4a7c3f';
                this.ctx.fillRect(panelX, skillY, panelWidth, buttonHeight);
                this.ctx.font = 'bold 16px sans-serif';
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText('移动', panelX + 70, skillY + 25);
                skillY += buttonHeight + gap;
            }

            if (!unit.hasAttacked) {
                this.ctx.fillStyle = '#c41e3a';
                this.ctx.fillRect(panelX, skillY, panelWidth, buttonHeight);
                this.ctx.font = 'bold 16px sans-serif';
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText('攻击', panelX + 70, skillY + 25);
                skillY += buttonHeight + gap;
            }
        }

        // 结束回合按钮
        const endY = this.canvas.height - 80;
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(panelX, endY, panelWidth, 50);
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('结束回合', panelX + 50, endY + 32);
    }

    // 渲染日志
    renderLog() {
        const logWidth = 250;
        const logX = this.canvas.width - logWidth - 20;
        const logY = this.canvas.height - 200;
        const logHeight = 180;

        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(logX, logY, logWidth, logHeight);

        // 边框
        this.ctx.strokeStyle = '#555';
        this.ctx.strokeRect(logX, logY, logWidth, logHeight);

        // 日志内容
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = '#ccc';
        this.ctx.textAlign = 'left';

        const logs = this.state.actionLog.slice(-10);
        logs.forEach((log, i) => {
            const y = logY + 20 + i * 16;
            if (y < logY + logHeight - 10) {
                this.ctx.fillText(log.message, logX + 10, y);
            }
        });
    }

    // 渲染游戏结束
    renderGameOver() {
        this.clear();

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 胜利信息
        this.ctx.font = 'bold 48px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.state.winner === 1 ? this.colors.player1 : this.colors.player2;
        this.ctx.fillText(` ${this.state.winner === 1 ? '红方' : '蓝方'} 胜利!`, centerX, centerY - 50);

        // 重新开始按钮
        this.renderMenuButton(centerX - 80, centerY + 30, 160, 50, '重新开始');
    }

    // 主渲染函数
    render() {
        switch (this.state.viewState) {
            case 'MENU':
                this.renderMenu();
                break;
            case 'SELECT_P1':
            case 'SELECT_P2':
                this.renderSelectScreen();
                break;
            case 'DEPLOY':
                this.renderDeployScreen();
                break;
            case 'BATTLE':
                this.renderBattleScreen();
                break;
            case 'GAME_OVER':
                this.renderGameOver();
                break;
        }
    }
}

// 创建全局渲染器
window.Renderer = Renderer;
