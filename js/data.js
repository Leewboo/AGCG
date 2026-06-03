
// ================================
// 范围系统定义
// ================================
const Range = {
    /**
     * +n: 十字范围
     */
    plus(n, x, y) {
        const result = [];
        for (let i = 1; i <= n; i++) {
            result.push({ x: x + i, y });
            result.push({ x: x - i, y });
            result.push({ x, y: y + i });
            result.push({ x, y: y - i });
        }
        return result.filter(p => p.x >= 0 && p.x < 10 && p.y >= 0 && p.y < 10);
    },

    /**
     * xn: 斜角范围
     */
    x(n, x, y) {
        const result = [];
        for (let i = 1; i <= n; i++) {
            result.push({ x: x + i, y: y + i });
            result.push({ x: x - i, y: y + i });
            result.push({ x: x + i, y: y - i });
            result.push({ x: x - i, y: y - i });
        }
        return result.filter(p => p.x >= 0 && p.x < 10 && p.y >= 0 && p.y < 10);
    },

    /**
     * rn: 圆形范围
     */
    r(n, x, y) {
        const result = [];
        for (let dy = -n; dy <= n; dy++) {
            for (let dx = -n; dx <= n; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (Math.abs(dx) + Math.abs(dy) <= n) {
                    result.push({ x: x + dx, y: y + dy });
                }
            }
        }
        return result.filter(p => p.x >= 0 && p.x < 10 && p.y >= 0 && p.y < 10);
    },

    /**
     * 解析范围字符串: "+2", "x1", "r3"
     */
    parse(rangeStr, x, y) {
        const match = rangeStr.match(/^([+xr])(\d+)$/);
        if (!match) return [];
        const type = match[1];
        const n = parseInt(match[2]);
        if (type === '+') return this.plus(n, x, y);
        if (type === 'x') return this.x(n, x, y);
        if (type === 'r') return this.r(n, x, y);
        return [];
    }
};

// ================================
// 效果系统定义
// ================================
const Effect = {
    /**
     * 造成伤害
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 目标
     * @param {Number} damage - 伤害值
     */
    damage(attacker, target, damage) {
        const realDamage = Math.max(1, Math.floor(damage - target.def * 0.3));
        target.hp -= realDamage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
        }
        return { damage: realDamage, type: 'damage' };
    },

    /**
     * 治疗
     * @param {Object} healer - 治疗者
     * @param {Object} target - 目标
     * @param {Number} amount - 治疗量
     */
    heal(healer, target, amount) {
        const healAmount = Math.min(amount, target.maxHp - target.hp);
        target.hp += healAmount;
        return { heal: healAmount, type: 'heal' };
    },

    /**
     * 增加攻击力
     * @param {Object} user - 使用者
     * @param {Object} target - 目标
     * @param {Number} amount - 增量
     * @param {Number} turns - 回合数
     */
    buffAtk(user, target, amount, turns = 3) {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat: 'atk', value: amount, turns });
        target.atk += amount;
        return { buff: 'atk', value: amount, turns, type: 'buff' };
    },

    /**
     * 增加防御力
     * @param {Object} user - 使用者
     * @param {Object} target - 目标
     * @param {Number} amount - 增量
     * @param {Number} turns - 回合数
     */
    buffDef(user, target, amount, turns = 3) {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat: 'def', value: amount, turns });
        target.def += amount;
        return { buff: 'def', value: amount, turns, type: 'buff' };
    },

    /**
     * 增加移动力
     * @param {Object} user - 使用者
     * @param {Object} target - 目标
     * @param {Number} amount - 增量
     * @param {Number} turns - 回合数
     */
    buffMov(user, target, amount, turns = 2) {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat: 'mov', value: amount, turns });
        target.mov += amount;
        return { buff: 'mov', value: amount, turns, type: 'buff' };
    },

    /**
     * 召唤单位
     * @param {Object} summoner - 召唤者
     * @param {Object} summonData - 召唤物数据
     * @param {Number} x - 位置x
     * @param {Number} y - 位置y
     * @param {Object} gameState - 游戏状态
     */
    summon(summoner, summonData, x, y, gameState) {
        const unit = {
            id: Date.now() + Math.random(),
            name: summonData.name,
            player: summoner.player,
            x, y,
            hp: summonData.hp,
            maxHp: summonData.hp,
            atk: summonData.atk,
            def: summonData.def,
            mov: summonData.mov,
            sp: 100,
            maxSp: 100,
            skills: [],
            dead: false,
            moved: false,
            attacked: false,
            usedSkill: false,
            isSummon: true
        };
        gameState.units.push(unit);
        return { unit, type: 'summon' };
    },

    /**
     * 传送
     * @param {Object} user - 使用者
     * @param {Object} target - 目标
     * @param {Number} x - 目标位置x
     * @param {Number} y - 目标位置y
     */
    teleport(user, target, x, y) {
        target.x = x;
        target.y = y;
        return { to: { x, y }, type: 'teleport' };
    }
};

// ================================
// 地形数据
// ================================
const TERRAIN = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 3, 0, 0, 0, 0, 3, 0, 0],
    [2, 0, 0, 1, 0, 0, 1, 0, 0, 2],
    [2, 0, 4, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 4, 0, 2],
    [2, 0, 0, 1, 0, 0, 1, 0, 0, 2],
    [0, 0, 3, 0, 0, 0, 0, 3, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const TERRAIN_NAMES = { 0: 'grass', 1: 'mountain', 2: 'river', 3: 'city', 4: 'swamp' };
const TERRAIN_LABELS = { 0: '', 1: '山', 2: '～', 3: '城', 4: '沼' };

// ================================
// 召唤物数据
// ================================
const SUMMONS = {
    soldier: { name: '士兵', hp: 40, atk: 8, def: 5, mov: 2 },
    archer: { name: '弓手', hp: 30, atk: 12, def: 3, mov: 2 },
    wall: { name: '盾墙', hp: 80, atk: 0, def: 20, mov: 0 }
};

// ================================
// 武将与技能数据
// ================================
const GENERALS = [
    {
        id: 'guanyu',
        name: '关羽',
        hp: 100,
        atk: 25,
        def: 15,
        mov: 3,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            {
                id: 'dragon',
                name: '青龙偃月',
                type: 'active',
                category: 'normal',
                range: '+2',
                spCost: 30,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 35);
                },
                desc: '十字2格范围，造成35伤害'
            },
            {
                id: 'warrior',
                name: '武圣',
                type: 'passive',
                category: 'special',
                content(attacker, gameState) {
                    attacker.atk = Math.floor(attacker.atk * 1.1);
                    return { type: 'passive', msg: '攻击力+10%' };
                },
                desc: '被动：攻击力+10%'
            }
        ]
    },
    {
        id: 'zhugeliang',
        name: '诸葛亮',
        hp: 70,
        atk: 20,
        def: 10,
        mov: 2,
        moveRange: '+2',
        attackRange: '+2',
        skills: [
            {
                id: 'fire',
                name: '火烧赤壁',
                type: 'active',
                category: 'normal',
                range: 'r2',
                spCost: 35,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 28);
                },
                desc: '圆形2格范围，造成28伤害'
            },
            {
                id: 'summonArcher',
                name: '借东风',
                type: 'active',
                category: 'summon',
                range: '+1',
                spCost: 40,
                summon: 'archer',
                content(attacker, pos, gameState) {
                    return Effect.summon(attacker, SUMMONS.archer, pos.x, pos.y, gameState);
                },
                desc: '召唤弓手到十字1格'
            }
        ]
    },
    {
        id: 'zhaoyun',
        name: '赵云',
        hp: 85,
        atk: 22,
        def: 12,
        mov: 4,
        moveRange: '+4',
        attackRange: '+1',
        skills: [
            {
                id: 'spear',
                name: '龙胆枪',
                type: 'active',
                category: 'normal',
                range: '+3',
                spCost: 25,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 30);
                },
                desc: '十字3格，造成30伤害'
            }
        ]
    },
    {
        id: 'zhangfei',
        name: '张飞',
        hp: 110,
        atk: 28,
        def: 18,
        mov: 2,
        moveRange: '+2',
        attackRange: '+1',
        skills: [
            {
                id: 'roar',
                name: '狮吼功',
                type: 'active',
                category: 'normal',
                range: 'r1',
                spCost: 35,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 40);
                },
                desc: '周围1格，造成40伤害'
            },
            {
                id: 'brave',
                name: '猛志',
                type: 'passive',
                category: 'special',
                content(attacker, gameState) {
                    attacker.def = Math.floor(attacker.def * 1.15);
                    return { type: 'passive', msg: '防御力+15%' };
                },
                desc: '被动：防御力+15%'
            }
        ]
    },
    {
        id: 'huangzhong',
        name: '黄忠',
        hp: 75,
        atk: 26,
        def: 8,
        mov: 2,
        moveRange: '+2',
        attackRange: '+3',
        skills: [
            {
                id: 'arrow',
                name: '百步穿杨',
                type: 'active',
                category: 'normal',
                range: '+4',
                spCost: 30,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 32);
                },
                desc: '十字4格，造成32伤害'
            }
        ]
    },
    {
        id: 'machao',
        name: '马超',
        hp: 90,
        atk: 24,
        def: 10,
        mov: 4,
        moveRange: '+4',
        attackRange: '+1',
        skills: [
            {
                id: 'charge',
                name: '铁骑冲锋',
                type: 'active',
                category: 'normal',
                range: '+3',
                spCost: 28,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 33);
                },
                desc: '十字3格，造成33伤害'
            }
        ]
    },
    {
        id: 'caocao',
        name: '曹操',
        hp: 95,
        atk: 22,
        def: 14,
        mov: 3,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            {
                id: 'strategy',
                name: '奸雄之计',
                type: 'active',
                category: 'normal',
                range: 'r2',
                spCost: 30,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 25);
                },
                desc: '圆形2格，造成25伤害'
            },
            {
                id: 'ambition',
                name: '挟天子',
                type: 'active',
                category: 'special',
                range: 'r1',
                spCost: 35,
                content(attacker, target, gameState) {
                    const dmg = Effect.damage(attacker, target, 20);
                    Effect.heal(attacker, attacker, 15);
                    return { ...dmg, heal: 15, type: 'drain' };
                },
                desc: '吸血：20伤害 + 15治疗'
            }
        ]
    },
    {
        id: 'caoren',
        name: '曹仁',
        hp: 105,
        atk: 18,
        def: 22,
        mov: 2,
        moveRange: '+2',
        attackRange: '+1',
        skills: [
            {
                id: 'defend',
                name: '铜墙铁壁',
                type: 'active',
                category: 'normal',
                range: '+1',
                spCost: 20,
                content(attacker, target, gameState) {
                    Effect.buffDef(attacker, attacker, 10, 2);
                    return Effect.damage(attacker, target, 20);
                },
                desc: '自身防御+10，攻击'
            },
            {
                id: 'summonWall',
                name: '筑城',
                type: 'active',
                category: 'summon',
                range: '+1',
                spCost: 45,
                summon: 'wall',
                content(attacker, pos, gameState) {
                    return Effect.summon(attacker, SUMMONS.wall, pos.x, pos.y, gameState);
                },
                desc: '召唤盾墙'
            }
        ]
    },
    {
        id: 'sunce',
        name: '孙策',
        hp: 88,
        atk: 25,
        def: 11,
        mov: 3,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            {
                id: 'assault',
                name: '霸王突袭',
                type: 'active',
                category: 'normal',
                range: '+2',
                spCost: 30,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 35);
                },
                desc: '十字2格，造成35伤害'
            }
        ]
    },
    {
        id: 'sunshangxiang',
        name: '孙尚香',
        hp: 72,
        atk: 23,
        def: 9,
        mov: 3,
        moveRange: '+3',
        attackRange: '+2',
        skills: [
            {
                id: 'bow',
                name: '枭姬弓',
                type: 'active',
                category: 'normal',
                range: '+3',
                spCost: 25,
                content(attacker, target, gameState) {
                    return Effect.damage(attacker, target, 28);
                },
                desc: '十字3格，造成28伤害'
            },
            {
                id: 'summonSoldier',
                name: '练兵',
                type: 'active',
                category: 'summon',
                range: '+1',
                spCost: 25,
                summon: 'soldier',
                content(attacker, pos, gameState) {
                    return Effect.summon(attacker, SUMMONS.soldier, pos.x, pos.y, gameState);
                },
                desc: '召唤士兵'
            }
        ]
    }
];

// ================================
// DIY技能示例（JS格式）
// ================================
const DIY_SKILL_EXAMPLE = {
    id: 'mySkill',
    name: '我的技能',
    type: 'active',
    category: 'normal',
    range: 'r2',
    spCost: 30,
    content(attacker, target, gameState) {
        // 自定义技能逻辑
        Effect.damage(attacker, target, 25);
        Effect.heal(attacker, attacker, 10);
        return { type: 'custom', msg: '自定义技能触发' };
    },
    desc: '自定义技能'
};

export {
    Range,
    Effect,
    TERRAIN,
    TERRAIN_NAMES,
    TERRAIN_LABELS,
    GENERALS,
    SUMMONS,
    DIY_SKILL_EXAMPLE
};
