// ================================
// 效果系统
// ================================
const Effect = {
    damage(attacker, target, damage) {
        const realDamage = Math.max(1, Math.floor(damage - target.def * 0.3));
        target.hp -= realDamage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
        }
        return { damage: realDamage, type: 'damage' };
    }
};

window.Effect = Effect;
