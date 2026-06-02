// 全将战棋 - UI交互系统

class UI {
    constructor(canvas, gameState, board, renderer, combat, game) {
        this.canvas = canvas;
        this.state = gameState;
        this.board = board;
        this.renderer = renderer;
        this.combat = combat;
        this.game = game;

        this.setupEventListeners();
    }

    // 设置事件监听
    setupEventListeners() {
        // 桌面点击
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        // 触摸事件（移动端）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // 获取点击位置（考虑canvas缩放）
    getClickPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    // 转换坐标到棋盘格子
    posToBoard(pos) {
        const x = Math.floor((pos.x - this.renderer.boardOffsetX) / this.renderer.cellSize);
        const y = Math.floor((pos.y - this.renderer.boardOffsetY) / this.renderer.cellSize);
        return { x, y };
    }

    // 点击处理
    handleClick(e) {
        const pos = this.getClickPosition(e);

        switch (this.state.viewState) {
            case 'MENU':
                this.handleMenuClick(pos);
                break;
            case 'SELECT_P1':
            case 'SELECT_P2':
                this.handleSelectClick(pos);
                break;
            case 'DEPLOY':
                this.handleDeployClick(pos);
                break;
            case 'BATTLE':
                this.handleBattleClick(pos);
                break;
            case 'GAME_OVER':
                this.handleGameOverClick(pos);
                break;
        }
    }

    // 鼠标移动处理
    handleMouseMove(e) {
        const pos = this.getClickPosition(e);
        this.currentPos = pos;
    }

    // 键盘事件处理
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.state.clearSelection();
        }
    }

    // 菜单点击
    handleMenuClick(pos) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 双人对战按钮
        if (this.isInRect(pos, centerX - 100, centerY - 40, 200, 45)) {
            this.state.setGameMode('pvp');
            this.state.startNewGame();
        }
        // 人机对战按钮
        else if (this.isInRect(pos, centerX - 100, centerY + 10, 200, 45)) {
            this.state.setGameMode('pve');
            this.state.startNewGame();
        }
        // DIY武将按钮
        else if (this.isInRect(pos, centerX - 100, centerY + 60, 200, 45)) {
            // DIY模式暂不实现
            alert('DIY武将功能开发中...');
        }
    }

    // 选将界面点击
    handleSelectClick(pos) {
        const generals = window.GAME_DATA.GENERALS;
        const startX = 50;
        const startY = 130;
        const cardWidth = 140;
        const cardHeight = 180;
        const gap = 15;

        for (let i = 0; i < generals.length; i++) {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = startX + col * (cardWidth + gap);
            const y = startY + row * (cardHeight + gap);

            if (this.isInRect(pos, x, y, cardWidth, cardHeight)) {
                const general = generals[i];
                const player = this.state.selectingPlayer;

                if (this.state.selectGeneral(player, general)) {
                    // 切换到下一玩家选将
                    if (this.state.selectingPlayer === 1 &&
                        this.state.players[1].selectedGenerals.length === 5) {
                        this.state.switchSelectPlayer();
                    } else if (this.state.selectingPlayer === 2 &&
                        this.state.players[2].selectedGenerals.length === 5) {
                        // 双方都选完了，进入布阵阶段
                        this.state.switchSelectPlayer();
                    }
                }
                break;
            }
        }

        // 布阵阶段按钮
        if (this.state.isSelectionComplete()) {
            const centerX = this.canvas.width / 2;
            if (this.isInRect(pos, centerX - 80, this.canvas.height - 80, 160, 50)) {
                this.startDeploy();
            }
        }
    }

    // 开始布阵
    startDeploy() {
        this.state.initBoard(8);
        this.state.currentPlayer = 1;
        this.state.viewState = 'DEPLOY';
        // 初始化部署数组
        this.state.players[1].deployedUnits = [];
        this.state.players[2].deployedUnits = [];
        // 重新计算画布大小和偏移（确保棋盘能正确渲染）
        this.game.resizeCanvas();
    }

    // 布阵界面点击
    handleDeployClick(pos) {
        const boardPos = this.posToBoard(pos);

        // 检查是否在棋盘内
        if (boardPos.x < 0 || boardPos.x >= 8 || boardPos.y < 0 || boardPos.y >= 8) {
            // 检查布阵面板点击
            this.handleDeployPanelClick(pos);
            return;
        }

        // 检查是否已有单位
        if (this.state.getUnitAt(boardPos.x, boardPos.y)) {
            return;
        }

        // 获取当前玩家待部署武将
        const generals = this.state.players[this.state.currentPlayer].selectedGenerals;
        const deployed = this.state.players[this.state.currentPlayer].deployedUnits;

        // 找到未部署的武将
        for (const general of generals) {
            const isDeployed = deployed.find(d => d.generalId === general.id);
            if (!isDeployed) {
                // 部署武将
                this.state.createUnit(general, this.state.currentPlayer, boardPos.x, boardPos.y);
                deployed.push({ generalId: general.id });

                // 切换到下一玩家
                if (deployed.length < 5) {
                    // 继续当前玩家布阵
                } else if (this.state.currentPlayer === 1) {
                    this.state.currentPlayer = 2;
                } else {
                    // 双方都布阵完成，开始战斗
                    this.startBattle();
                }
                break;
            }
        }
    }

    // 处理布阵面板点击
    handleDeployPanelClick(pos) {
        // 这个功能暂不实现，玩家直接在棋盘上点击部署
    }

    // 开始战斗
    startBattle() {
        this.state.viewState = 'BATTLE';
        this.state.currentPlayer = 1;
        this.state.turn = 1;
        this.state.addLog('战斗开始！');
    }

    // 对战界面点击
    handleBattleClick(pos) {
        const boardPos = this.posToBoard(pos);

        // 检查是否在棋盘内
        if (boardPos.x < 0 || boardPos.x >= 8 || boardPos.y < 0 || boardPos.y >= 8) {
            this.handleBattleUIClick(pos);
            return;
        }

        // 点击在棋盘上
        const clickedUnit = this.state.getUnitAt(boardPos.x, boardPos.y);

        // 检查是否点击移动范围
        if (this.state.moveableTiles.find(t => t.x === boardPos.x && t.y === boardPos.y)) {
            this.executeMove(boardPos.x, boardPos.y);
            return;
        }

        // 检查是否点击攻击范围
        if (this.state.attackableTiles.find(t => t.x === boardPos.x && t.y === boardPos.y)) {
            this.executeAttack(boardPos.x, boardPos.y);
            return;
        }

        // 检查是否点击技能目标
        if (this.state.skillTargetTiles.find(t => t.x === boardPos.x && t.y === boardPos.y)) {
            this.executeSkill(boardPos.x, boardPos.y);
            return;
        }

        // 选中/取消单位
        if (clickedUnit) {
            if (clickedUnit.player === this.state.currentPlayer) {
                this.selectUnit(clickedUnit);
            }
        } else {
            this.state.clearSelection();
        }
    }

    // 处理对战界面UI点击
    handleBattleUIClick(pos) {
        const panelX = 20;
        const panelY = 80;
        const buttonHeight = 40;
        const buttonWidth = 180;
        const gap = 10;

        if (!this.state.selectedUnit) return;

        const unit = this.state.selectedUnit;

        // 技能按钮区域
        let skillY = panelY + 70;
        for (const skill of unit.skills) {
            if (this.isInRect(pos, panelX, skillY, buttonWidth, buttonHeight)) {
                if (unit.sp >= skill.spCost && !unit.hasUsedSkill) {
                    this.selectSkill(skill);
                }
                return;
            }
            skillY += buttonHeight + gap;
        }

        // 移动按钮
        if (!unit.hasMoved) {
            skillY += 20;
            if (this.isInRect(pos, panelX, skillY, buttonWidth, buttonHeight)) {
                this.showMoveRange();
                return;
            }
            skillY += buttonHeight + gap;
        }

        // 攻击按钮
        if (!unit.hasAttacked) {
            if (this.isInRect(pos, panelX, skillY, buttonWidth, buttonHeight)) {
                this.showAttackRange();
                return;
            }
        }

        // 结束回合按钮
        if (this.isInRect(pos, panelX, this.canvas.height - 80, buttonWidth, 50)) {
            this.endTurn();
        }
    }

    // 选中单位
    selectUnit(unit) {
        this.state.selectUnit(unit);
        this.state.addLog(`选中 ${unit.name}`);
    }

    // 显示移动范围
    showMoveRange() {
        if (!this.state.selectedUnit) return;
        const unit = this.state.selectedUnit;
        if (unit.hasMoved) return;

        this.state.moveableTiles = this.board.getMoveableTiles(unit);
    }

    // 执行移动
    executeMove(x, y) {
        if (!this.state.selectedUnit) return;

        this.state.moveUnit(this.state.selectedUnit, x, y);
        this.state.moveableTiles = [];
        this.state.addLog(`${this.state.selectedUnit.name} 移动到 (${x}, ${y})`);

        // 自动显示攻击范围
        this.showAttackRange();
    }

    // 显示攻击范围
    showAttackRange() {
        if (!this.state.selectedUnit) return;
        const unit = this.state.selectedUnit;
        if (unit.hasAttacked) return;

        this.state.attackableTiles = this.board.getAttackableTiles(unit, unit.attackRange);
    }

    // 执行攻击
    executeAttack(x, y) {
        if (!this.state.selectedUnit) return;

        const target = this.state.getUnitAt(x, y);
        if (!target) return;

        const unit = this.state.selectedUnit;
        const result = this.combat.executeAttack(unit, target);

        unit.hasAttacked = true;
        this.state.attackableTiles = [];

        // 检查胜负
        this.state.checkWinCondition();
    }

    // 选择技能
    selectSkill(skill) {
        if (!this.state.selectedUnit) return;

        this.state.currentSkill = skill;
        const skillSystem = new SkillSystem(this.state, this.board);
        this.state.skillTargetTiles = skillSystem.getSkillPreview(
            this.state.selectedUnit,
            skill
        );
    }

    // 执行技能
    executeSkill(x, y) {
        if (!this.state.selectedUnit || !this.state.currentSkill) return;

        const unit = this.state.selectedUnit;
        const skill = this.state.currentSkill;
        const skillSystem = new SkillSystem(this.state, this.board);

        // 构建目标
        const targetUnit = this.state.getUnitAt(x, y);
        if (!targetUnit) return;

        const targets = [{ unitId: targetUnit.id }];
        const result = skillSystem.useSkill(unit, skill, targets);

        if (result.success) {
            unit.hasUsedSkill = true;
        }

        this.state.currentSkill = null;
        this.state.skillTargetTiles = [];

        // 检查胜负
        this.state.checkWinCondition();
    }

    // 结束回合
    endTurn() {
        this.state.addLog(`${this.state.currentPlayer === 1 ? '红方' : '蓝方'}结束回合`);
        this.state.switchPlayer();
        this.state.clearSelection();

        // 如果是AI回合
        if (this.state.gameMode === 'pve' && this.state.currentPlayer === 2) {
            this.executeAITurn();
        }
    }

    // 执行AI回合
    async executeAITurn() {
        const ai = new AI(this.state, this.board, this.state.aiDifficulty);
        await ai.executeTurn();

        // AI结束后切换到玩家回合
        this.state.switchPlayer();
        this.state.clearSelection();
    }

    // 游戏结束点击
    handleGameOverClick(pos) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        if (this.isInRect(pos, centerX - 80, centerY + 30, 160, 50)) {
            this.state.reset();
            this.state.viewState = 'MENU';
        }
    }

    // 检查是否在矩形内
    isInRect(pos, x, y, width, height) {
        return pos.x >= x && pos.x <= x + width &&
               pos.y >= y && pos.y <= y + height;
    }
}

// 创建全局UI实例
window.UI = UI;
