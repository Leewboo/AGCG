// 全将战棋 - AI系统

class AI {
    constructor(gameState, board, difficulty = 'normal') {
        this.state = gameState;
        this.board = board;
        this.difficulty = difficulty;
    }

    // 设置难度
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    // 执行AI回合
    async executeTurn() {
        const units = this.state.getPlayerUnits(this.state.currentPlayer);

        for (const unit of units) {
            await this.delay(500);
            await this.executeUnitAction(unit);
        }

        // 结束回合
        this.state.addLog(`AI 结束回合`);
    }

    // 执行单位行动
    async executeUnitAction(unit) {
        // 重置行动状态
        unit.hasMoved = false;
        unit.hasAttacked = false;

        // 简单AI：优先攻击能击杀的目标
        const attackableUnits = this.board.getAttackableTiles(unit, unit.attackRange);

        // 检查是否有击杀机会
        const killOpportunity = this.findKillOpportunity(unit, attackableUnits);
        if (killOpportunity) {
            const combat = new Combat(this.state, this.board);
            combat.executeAttack(unit, killOpportunity);
            unit.hasAttacked = true;
            return;
        }

        // 尝试使用技能
        if (!unit.hasUsedSkill && unit.sp >= 30) {
            const skillResult = this.tryUseSkill(unit);
            if (skillResult) return;
        }

        // 移动到最佳位置
        const bestMove = this.findBestMove(unit);
        if (bestMove) {
            this.state.moveUnit(unit, bestMove.x, bestMove.y);
            await this.delay(300);
        }

        // 攻击最近的敌人
        const newAttackable = this.board.getAttackableTiles(unit, unit.attackRange);
        if (newAttackable.length > 0 && !unit.hasAttacked) {
            // 优先攻击低血量单位
            newAttackable.sort((a, b) => {
                const unitA = this.state.getUnit(a.unitId);
                const unitB = this.state.getUnit(b.unitId);
                return unitA.hp - unitB.hp;
            });

            const target = this.state.getUnit(newAttackable[0].unitId);
            const combat = new Combat(this.state, this.board);
            combat.executeAttack(unit, target);
            unit.hasAttacked = true;
        }
    }

    // 寻找击杀机会
    findKillOpportunity(unit, attackableUnits) {
        const combat = new Combat(this.state, this.board);

        for (const tile of attackableUnits) {
            const target = this.state.getUnit(tile.unitId);
            const damage = combat.calculateDamage(unit, target);

            if (damage >= target.hp) {
                return target;
            }
        }

        return null;
    }

    // 尝试使用技能
    tryUseSkill(unit) {
        for (const skill of unit.skills) {
            if (unit.sp < skill.spCost) continue;

            const tiles = this.board.getSkillTiles(unit, skill);
            if (tiles.length === 0) continue;

            // 简单AI：优先使用能造成伤害的技能
            if (skill.effect === 'damage') {
                const targets = tiles.map(t => ({ unitId: t.unitId }));
                const combat = new Combat(this.state, this.board);
                const result = combat.executeSkill(unit, skill, targets);

                if (result.success) {
                    this.state.addLog(`AI ${unit.name} 使用 ${skill.name}`);
                    unit.hasUsedSkill = true;
                    return true;
                }
            }
        }

        return false;
    }

    // 找到最佳移动位置
    findBestMove(unit) {
        const moveableTiles = this.board.getMoveableTiles(unit);
        if (moveableTiles.length === 0) return null;

        // 找到最近的敌人
        const enemies = this.state.getPlayerUnits(unit.player === 1 ? 2 : 1);
        if (enemies.length === 0) return null;

        let bestTile = null;
        let bestScore = -Infinity;

        for (const tile of moveableTiles) {
            // 计算到所有敌人的距离
            let totalDist = 0;
            let minDist = Infinity;

            for (const enemy of enemies) {
                const dist = this.board.manhattanDistance(tile.x, tile.y, enemy.pos.x, enemy.pos.y);
                totalDist += dist;
                minDist = Math.min(minDist, dist);
            }

            // 评分：距离越近分数越高
            const score = -minDist * 10 + (unit.attackRange.value - minDist > 0 ? 50 : 0);

            if (score > bestScore) {
                bestScore = score;
                bestTile = tile;
            }
        }

        return bestTile;
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建全局AI实例
window.AI = AI;
