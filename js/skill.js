// 全将战棋 - 技能系统

class SkillSystem {
    constructor(gameState, board) {
        this.state = gameState;
        this.board = board;
    }

    // 检查技能是否可用
    canUseSkill(unit, skill) {
        if (unit.isDead) return false;
        if (unit.hasUsedSkill) return false;
        if (unit.sp < skill.spCost) return false;
        return true;
    }

    // 获取技能可用目标
    getValidTargets(unit, skill) {
        if (!this.canUseSkill(unit, skill)) return [];

        const tiles = this.board.getSkillTiles(unit, skill);
        return tiles.filter(t => {
            if (skill.targetType === 'self') return true;
            if (skill.targetType === 'ally' || skill.targetType === 'enemy') {
                return t.unitId !== undefined;
            }
            return false;
        });
    }

    // 获取技能范围预览
    getSkillPreview(unit, skill) {
        return this.board.getTilesInRange(
            unit.pos.x,
            unit.pos.y,
            skill.rangeType,
            skill.rangeValue
        );
    }

    // 释放技能
    useSkill(unit, skill, targets) {
        if (!this.canUseSkill(unit, skill)) {
            return { success: false, message: '无法使用此技能' };
        }

        const validTargets = this.getValidTargets(unit, skill);
        if (validTargets.length === 0) {
            return { success: false, message: '没有有效目标' };
        }

        // 执行技能
        const combat = new Combat(this.state, this.board);
        const result = combat.executeSkill(unit, skill, targets);

        if (result.success) {
            unit.hasUsedSkill = true;
        }

        return result;
    }
}

// 创建全局技能系统实例
window.SkillSystem = SkillSystem;
