// ================================
// 技能定义
// ================================
const Skills = {
    changSheng: {
        id: 'changSheng',
        name: '常胜',
        type: 'passive',
        category: 'special',
        content(a, t, gs) {
            const { Effect } = gs._modules;
            Effect.on(a, 'onKill', (target, gameState) => {
                if (target.generalId) {
                    return { extraAction: true, showText: '常胜！', logText: `${a.name} 常胜！获得额外行动` };
                }
            });
            return { type: 'passive' };
        },
        desc: '被动：击杀敌方武将时，立即恢复移动和攻击机会'
    },
    danYong: {
        id: 'danYong',
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
            return { ...dmgResult, type: 'danYong', move: moveResult };
        },
        desc: '主动：十字4格选择敌方棋子，然后在其r2范围内选择一个空格作为落点，突进造成30伤害（每回合限用一次）'
    },
    weiLin: {
        id: 'weiLin',
        name: '威临',
        type: 'passive',
        category: 'special',
        content(a, t, gs) {
            const { Effect } = gs._modules;
            Effect.on(a, 'onTurnStart', (gameState) => {
                const auraRange2 = window.Range.parse('+2', a.x, a.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
                const auraRange1 = window.Range.parse('+1', a.x, a.y, window.BLOCKING_TERRAIN_ATTACK, window.TERRAIN);
                gameState.units.forEach(enemy => {
                    if (enemy.dead || enemy.player === a.player) return;
                    const inRange2 = auraRange2.find(p => p.x === enemy.x && p.y === enemy.y);
                    const isDebuffed = Effect.hasMark(enemy, 'weiLinDebuff');
                    if (inRange2 && !isDebuffed) {
                        enemy.atk = Math.max(1, enemy.atk - 10);
                        Effect.mark(enemy, 'weiLinDebuff', true);
                    } else if (!inRange2 && isDebuffed) {
                        enemy.atk += 10;
                        Effect.unmark(enemy, 'weiLinDebuff');
                    }
                    const inRange1 = auraRange1.find(p => p.x === enemy.x && p.y === enemy.y);
                    if (inRange1 && !enemy.silenced) {
                        Effect.silence(a, enemy, 1);
                    }
                });
            });
            return { type: 'passive' };
        },
        desc: '被动：周围+2范围内的敌方武将攻击力-10。周围+1范围内的敌方武将无法使用主动技能'
    },
    shuiYan: {
        id: 'shuiYan',
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
            return { ...dmgResult, type: 'shuiYan', slow: slowResult, riverBonus: isRiver };
        },
        desc: '主动：十字3格，对目标造成30伤害并减速1（持续2回合）。若目标在河流地形上，伤害翻倍'
    },
    testDmg: {
        id: 'testDmg',
        name: '测试打击',
        type: 'active',
        category: 'normal',
        range: '+2',
        energyCost: 1,
        content(a, t, gs) {
            const { Effect } = gs._modules;
            return Effect.damage(a, t, 10);
        },
        desc: '十字2格，造成10伤害'
    }
};

window.Skills = Skills;
