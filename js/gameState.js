// 全将战棋 - 游戏状态管理

class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // 游戏视图状态
        this.viewState = 'MENU'; // MENU, SELECT_P1, SELECT_P2, DEPLOY, BATTLE, GAME_OVER

        // 游戏模式
        this.gameMode = null; // 'pvp', 'pve', 'online'

        // 玩家信息
        this.currentPlayer = 1;
        this.players = {
            1: { selectedGenerals: [], deployedUnits: [] },
            2: { selectedGenerals: [], deployedUnits: [] }
        };

        // 当前选将阶段的玩家
        this.selectingPlayer = 1;

        // 棋盘数据
        this.board = null;

        // 所有武将单位
        this.units = [];

        // 回合信息
        this.turn = 1;
        this.turnPhase = 'ACTION'; // ACTION, SKILL, END

        // 选中的单位
        this.selectedUnit = null;

        // 可移动范围
        this.moveableTiles = [];

        // 可攻击范围
        this.attackableTiles = [];

        // 技能目标范围
        this.skillTargetTiles = [];

        // 当前使用的技能
        this.currentSkill = null;

        // 行动状态
        this.actionTaken = false; // 是否已行动
        this.hasMoved = false;
        this.hasAttacked = false;
        this.hasUsedSkill = false;

        // AI难度
        this.aiDifficulty = 'normal';

        // 游戏结果
        this.winner = null;

        // 动画状态
        this.animations = [];

        // 日志
        this.actionLog = [];
    }

    // 设置游戏模式
    setGameMode(mode) {
        this.gameMode = mode;
    }

    // 设置AI难度
    setAIDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
    }

    // 开始新游戏
    startNewGame() {
        this.reset();
        this.viewState = 'SELECT_P1';
        this.selectingPlayer = 1;
    }

    // 切换选将玩家
    switchSelectPlayer() {
        if (this.selectingPlayer === 1) {
            this.selectingPlayer = 2;
            this.viewState = 'SELECT_P2';
        } else {
            this.viewState = 'DEPLOY';
        }
    }

    // 选择武将
    selectGeneral(player, general) {
        const playerData = this.players[player];
        if (playerData.selectedGenerals.length >= 5) return false;
        if (playerData.selectedGenerals.find(g => g.id === general.id)) return false;

        playerData.selectedGenerals.push({...general});
        return true;
    }

    // 取消选择武将
    deselectGeneral(player, generalId) {
        const playerData = this.players[player];
        playerData.selectedGenerals = playerData.selectedGenerals.filter(g => g.id !== generalId);
    }

    // 检查是否完成选将
    isSelectionComplete() {
        return this.players[1].selectedGenerals.length === 5 &&
               this.players[2].selectedGenerals.length === 5;
    }

    // 初始化棋盘
    initBoard(size = 8) {
        this.board = {
            size: size,
            tiles: []
        };

        // 创建棋盘格子
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // 随机生成地形
                let terrain = 'GRASS';
                const rand = Math.random();
                if (rand < 0.1) terrain = 'MOUNTAIN';
                else if (rand < 0.15) terrain = 'RIVER';
                else if (rand < 0.2) terrain = 'CITY';

                this.board.tiles.push({
                    x: x,
                    y: y,
                    terrain: terrain,
                    unitId: null
                });
            }
        }
    }

    // 获取格子
    getTile(x, y) {
        if (x < 0 || x >= this.board.size || y < 0 || y >= this.board.size) {
            return null;
        }
        return this.board.tiles[y * this.board.size + x];
    }

    // 设置格子单位
    setTileUnit(x, y, unitId) {
        const tile = this.getTile(x, y);
        if (tile) {
            tile.unitId = unitId;
        }
    }

    // 创建武将单位
    createUnit(generalData, player, x, y) {
        const unit = {
            id: `${player}_${generalData.id}_${Date.now()}`,
            generalId: generalData.id,
            name: generalData.name,
            player: player,
            hp: generalData.hp,
            maxHp: generalData.hp,
            atk: generalData.atk,
            def: generalData.def,
            mov: generalData.mov,
            sp: generalData.sp,
            maxSp: generalData.sp,
            pos: { x, y },
            attackRange: generalData.attackRange,
            skills: generalData.skills.map(sid => ({...window.GAME_DATA.SKILLS[sid]})),
            isDead: false,
            icon: generalData.icon,
            hasMoved: false,
            hasAttacked: false,
            hasUsedSkill: false
        };

        this.units.push(unit);
        this.setTileUnit(x, y, unit.id);
        return unit;
    }

    // 获取单位
    getUnit(unitId) {
        return this.units.find(u => u.id === unitId);
    }

    // 获取某位置单位
    getUnitAt(x, y) {
        const tile = this.getTile(x, y);
        if (!tile || !tile.unitId) return null;
        return this.getUnit(tile.unitId);
    }

    // 获取玩家所有存活单位
    getPlayerUnits(player) {
        return this.units.filter(u => u.player === player && !u.isDead);
    }

    // 移动单位
    moveUnit(unit, toX, toY) {
        // 清除原位置
        this.setTileUnit(unit.pos.x, unit.pos.y, null);
        // 设置新位置
        unit.pos.x = toX;
        unit.pos.y = toY;
        this.setTileUnit(toX, toY, unit.id);
        unit.hasMoved = true;
    }

    // 伤害单位
    damageUnit(unit, damage) {
        unit.hp = Math.max(0, unit.hp - damage);
        if (unit.hp <= 0) {
            unit.isDead = true;
            this.setTileUnit(unit.pos.x, unit.pos.y, null);
        }
        return unit.isDead;
    }

    // 治疗单位
    healUnit(unit, amount) {
        unit.hp = Math.min(unit.maxHp, unit.hp + amount);
    }

    // 消耗技能能量
    useSkillEnergy(unit, amount) {
        unit.sp = Math.max(0, unit.sp - amount);
    }

    // 重置单位行动状态
    resetUnitActions(unit) {
        unit.hasMoved = false;
        unit.hasAttacked = false;
        unit.hasUsedSkill = false;
    }

    // 重置所有单位行动状态
    resetAllUnitActions() {
        this.units.forEach(u => {
            if (!u.isDead) {
                this.resetUnitActions(u);
            }
        });
    }

    // 恢复技能能量
    restoreSkillEnergy() {
        this.units.forEach(u => {
            if (!u.isDead) {
                u.sp = Math.min(u.maxSp, u.sp + 20);
            }
        });
    }

    // 切换玩家
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        if (this.currentPlayer === 1) {
            this.turn++;
        }
        this.resetAllUnitActions();
        this.restoreSkillEnergy();
        this.clearSelection();
    }

    // 选择单位
    selectUnit(unit) {
        this.selectedUnit = unit;
    }

    // 清除选择
    clearSelection() {
        this.selectedUnit = null;
        this.moveableTiles = [];
        this.attackableTiles = [];
        this.skillTargetTiles = [];
        this.currentSkill = null;
    }

    // 检查胜负
    checkWinCondition() {
        const p1Units = this.getPlayerUnits(1);
        const p2Units = this.getPlayerUnits(2);

        if (p1Units.length === 0) {
            this.winner = 2;
            this.viewState = 'GAME_OVER';
            return true;
        }
        if (p2Units.length === 0) {
            this.winner = 1;
            this.viewState = 'GAME_OVER';
            return true;
        }
        return false;
    }

    // 添加日志
    addLog(message) {
        this.actionLog.push({
            turn: this.turn,
            player: this.currentPlayer,
            message: message,
            timestamp: Date.now()
        });
    }

    // 获取回合信息文本
    getTurnText() {
        return `第 ${this.turn} 回合 - ${this.currentPlayer === 1 ? '红方' : '蓝方'} 行动`;
    }

    // 获取单位状态文本
    getUnitStatusText(unit) {
        return `${unit.name}: HP ${unit.hp}/${unit.maxHp} SP ${unit.sp}/${unit.maxSp}`;
    }
}

// 创建全局状态实例
window.gameState = new GameState();
