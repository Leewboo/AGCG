// 全将战棋 - 战斗系统

class Combat {
    constructor(gameState, board) {
        this.state = gameState;
        this.board = board;
    }

    // 计算伤害
    calculateDamage(attacker, defender, skillMultiplier = 1) {
        const terrain = this.board.getTerrainBonus(defender.pos.x, defender.pos.y);

        // 基础伤害 = 攻击 - 防御/2
        let damage = attacker.atk - (defender.def / 2);

        // 地形加成
        if (terrain.defBonus > 0) {
            damage *= (1 - terrain.defBonus);
        }

        // 技能倍率
        damage *= skillMultiplier;

        // 最小伤害为1
        return Math.max(1, Math.floor(damage));
    }

    // 执行攻击
    executeAttack(attacker, defender, skillMultiplier = 1) {
        const damage = this.calculateDamage(attacker, defender, skillMultiplier);
        const isDead = this.state.damageUnit(defender, damage);

        this.state.addLog(`${attacker.name} 攻击 ${defender.name}，造成 ${damage} 点伤害${isDead ? '，击杀！' : ''}`);

        return {
            damage,
            isDead,
            defender
        };
    }

    // 执行技能
    executeSkill(unit, skill, targets) {
        if (unit.sp < skill.spCost) {
            return { success: false, message: '技能能量不足' };
        }

        if (targets.length === 0) {
            return { success: false, message: '没有有效目标' };
        }

        // 消耗技能能量
        this.state.useSkillEnergy(unit, skill.spCost);

        const results = [];

        for (const targetData of targets) {
            const target = this.state.getUnit(targetData.unitId);
            if (!target || target.isDead) continue;

            if (skill.effect === 'damage') {
                const damage = this.calculateDamage(unit, target, skill.damage / unit.atk);
                const isDead = this.state.damageUnit(target, damage);
                results.push({ target, damage, isDead });

                this.state.addLog(`${unit.name} 使用 ${skill.name}，对 ${target.name} 造成 ${damage} 点伤害${isDead ? '，击杀！' : ''}`);
            } else if (skill.effect === 'heal') {
                this.state.healUnit(target, skill.damage);
                results.push({ target, healing: skill.damage });
                this.state.addLog(`${unit.name} 使用 ${skill.name}，治疗 ${target.name} ${skill.damage} 点生命`);
            }
        }

        return { success: true, results };
    }

    // 获取普攻伤害值
    getAttackDamage(attacker) {
        return attacker.atk;
    }

    // 检查是否能攻击
    canAttack(attacker, defender) {
        if (attacker.isDead || defender.isDead) return false;
        if (attacker.player === defender.player) return false;

        const dist = this.board.manhattanDistance(
            attacker.pos.x, attacker.pos.y,
            defender.pos.x, defender.pos.y
        );

        return dist <= attacker.attackRange.value;
    }
}

// 创建全局战斗实例
window.Combat = Combat;
