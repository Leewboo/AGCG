// ================================
// 技能定义
// ================================
const Skills = {
    // 赵云技能
    changsheng: {
        id: 'changsheng',
        name: '常胜',
        type: 'passive',
        category: 'special',
        content(a, t, gs) {
            const { Effect } = gs._modules;
            Effect.on(a, 'afterKill', (target, gameState) => {
                if (target.generalId) {
                    return { extraAction: true, showText: '常胜！', logText: `${a.name} 获得额外行动！` };
                }
            });
            return { type: 'passive' };
        },
        desc: '被动：击杀敌方武将时，立即获得额外行动'
    },
    danyong: {
        id: 'danyong',
        name: '胆勇',
        type: 'active',
        category: 'special',
        range: '+4',
        step1: 'selectEnemy',
        step1Range: '+4',
        step2: 'selectLanding',
        step2Range: 'r2',
        content(a, t, gs, landingPos) {
            const { Effect } = gs._modules;
            const moveResult = Effect.moveTo(a, landingPos.x, landingPos.y);
            const dmgResult = Effect.damage(a, t, 30);
            return { ...dmgResult, type: 'danyong', move: moveResult };
        },
        desc: '主动：十字4格选择敌方棋子，然后在其r2范围内选择空格作为落点，突进造成30伤害'
    },

    // 关羽技能
    weilin: {
        id: 'weilin',
        name: '威临',
        type: 'passive',
        category: 'special',
        content(a, t, gs) {
            const { Effect } = gs._modules;
            Effect.on(a, 'onTurnStart', (gameState) => {
                const auraRange2 = window.Range.parse('+2', a.x, a.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
                const auraRange1 = window.Range.parse('+1', a.x, a.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
                gameState.units.forEach(e => {
                    if (e.dead || e.player === a.player) return;
                    const inRange2 = auraRange2.find(p => p.x === e.x && p.y === e.y);
                    const isDebuffed = Effect.hasMark(e, 'weilinDebuff');
                    if (inRange2 && !isDebuffed) {
                        e._originalAtk = e.atk;
                        e.atk = Math.max(0, e.atk - 10);
                        Effect.mark(e, 'weilinDebuff', true);
                    } else if (!inRange2 && isDebuffed) {
                        if (e._originalAtk !== undefined) {
                            e.atk = e._originalAtk;
                            delete e._originalAtk;
                        }
                        Effect.unmark(e, 'weilinDebuff');
                    }
                    const inRange1 = auraRange1.find(p => p.x === e.x && p.y === e.y);
                    if (inRange1 && !e.silenced) {
                        Effect.silence(a, e, 1);
                    }
                });
            });
            return { type: 'passive' };
        },
        desc: '被动：周围+2范围内的敌方武将攻击力-10；周围+1范围内的敌方武将被沉默'
    },
    shuiyan: {
        id: 'shuiyan',
        name: '水淹',
        type: 'active',
        category: 'special',
        range: '+3',
        energyCost: 2,
        chargeTrigger: 'afterAction',
        content(a, t, gs) {
            const { Effect } = gs._modules;
            const isRiver = window.TERRAIN[t.y] && window.TERRAIN[t.y][t.x] === 2;
            const dmg = isRiver ? 60 : 30;
            const dmgResult = Effect.damage(a, t, dmg);
            const slowResult = Effect.slow(a, t, 1, 2);
            return { ...dmgResult, type: 'shuiyan', slow: slowResult, riverBonus: isRiver };
        },
        desc: '主动：十字3格，对目标造成30伤害并减速1（持续2回合）；若目标在河流地形上，伤害翻倍'
    },

    // 马超技能
    tieqi: {
        id: 'tieqi',
        name: '铁骑',
        type: 'passive',
        category: 'special',
        content(a, t, gs) {
            const { Effect } = gs._modules;
            Effect.mark(a, 'tieqiCharge', 0);
            Effect.mark(a, 'tieqiOriginalAtk', a.atk);
            
            Effect.on(a, 'afterMove', (gameState) => {
                let charge = Effect.hasMark(a, 'tieqiCharge') || 0;
                charge = Math.min(3, charge + 1); // 最多3层
                Effect.mark(a, 'tieqiCharge', charge);
                const originalAtk = Effect.hasMark(a, 'tieqiOriginalAtk');
                a.atk = Math.floor(originalAtk * (1 + charge * 0.2)); // 每层+20%攻击力
                return { showText: `铁骑! +${charge * 20}%` };
            });
            
            Effect.on(a, 'afterAttack', (gameState) => {
                Effect.mark(a, 'tieqiCharge', 0);
                const originalAtk = Effect.hasMark(a, 'tieqiOriginalAtk');
                a.atk = originalAtk;
            });
            return { type: 'passive' };
        },
        desc: '被动：每次移动后下次攻击攻击力+20%，最多累计+60%，攻击后效果重置'
    },
    tuci: {
        id: 'tuci',
        name: '突刺',
        type: 'active',
        category: 'special',
        range: '+5',
        step1: 'selectEnemy',
        step1Range: '+5',
        step2: 'selectLanding',
        step2Range: 'r1',
        content(a, t, gs, landingPos) {
            const { Effect } = gs._modules;
            const moveResult = Effect.moveTo(a, landingPos.x, landingPos.y);
            
            // 临时降低目标30%防御
            const originalDef = t.def;
            t.def = Math.floor(t.def * 0.7);
            const dmgResult = Effect.damage(a, t, 40);
            t.def = originalDef;
            
            // 触发铁骑效果
            Effect.trigger(a, 'afterMove', gs);
            
            return { ...dmgResult, type: 'tuci', move: moveResult };
        },
        desc: '主动：选择5格内敌方目标，移动到其身边，造成40点穿透伤害（忽略目标30%防御）'
    }
};

window.Skills = Skills;