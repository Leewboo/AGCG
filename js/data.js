// ================================
// 游戏数据
// ================================

const BOARD_SIZE_DATA = 12;
window.BOARD_SIZE = BOARD_SIZE_DATA;

// 地形类型: 0=草地 1=山脉(阻断移动/攻击) 2=河流(阻断移动,可攻击) 3=城池 4=沼泽 5=桥梁(可通行)
const TERRAIN = [
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 1],
    [0, 0, 2, 2, 2, 5, 5, 2, 2, 2, 0, 0],
    [0, 0, 2, 2, 2, 5, 5, 2, 2, 2, 0, 0],
    [0, 0, 2, 2, 2, 5, 5, 2, 2, 2, 0, 0],
    [0, 0, 2, 2, 2, 5, 5, 2, 2, 2, 0, 0],
    [1, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0]
];

const TERRAIN_NAMES = { 0: 'grass', 1: 'mountain', 2: 'river', 3: 'city', 4: 'swamp', 5: 'bridge' };
window.TERRAIN_NAMES = TERRAIN_NAMES;

const TERRAIN_LABELS = { 0: '', 1: '山', 2: '～', 3: '城', 4: '沼', 5: '桥' };
window.TERRAIN_LABELS = TERRAIN_LABELS;

window.TERRAIN = TERRAIN;

const BLOCKING_TERRAIN_MOVE = new Set([1, 2]);
window.BLOCKING_TERRAIN_MOVE = BLOCKING_TERRAIN_MOVE;

const BLOCKING_TERRAIN_ATTACK = new Set([1]);
window.BLOCKING_TERRAIN_ATTACK = BLOCKING_TERRAIN_ATTACK;

const GENERALS = [
    {
        id: 'zhaoyun',
        name: '赵云',
        hp: 180,
        atk: 50,
        def: 20,
        mov: 3,
        moveRange: '+3',
        attackRange: '+1',
        quotes: {
            move: ['长枪所向，披靡万里！', '七进七出，何惧之有？'],
            attack: ['胆敢挡我？', '看枪！'],
            skill: ['一身是胆！', '纵马长驱！'],
            kill: ['常胜将军，岂是虚言？', '又下一城！'],
            hurt: ['这点伤，算什么！', '再来！'],
            death: ['主公……云……尽力了……']
        },
        skills: [
            {
                id: 'changsheng',
                name: '常胜',
                type: 'passive',
                category: 'special',
                content(a, t, gs) {
                    a._passive_changsheng = true;
                    return { type: 'passive' };
                },
                desc: '被动：击杀敌方武将时，立即恢复移动和攻击机会'
            },
            {
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
                desc: '主动：十字4格选择敌方棋子，然后在其r2范围内选择一个空格作为落点，突进造成30伤害（每回合限用一次）'
            }
        ]
    },
    {
        id: 'guanyu',
        name: '关羽',
        hp: 200,
        atk: 45,
        def: 25,
        mov: 2,
        moveRange: '+2',
        attackRange: '+1',
        quotes: {
            move: ['过五关，斩六将！', '敌将休走！'],
            attack: ['刀下不斩无名之辈！', '看刀！'],
            skill: ['水淹七军！', '吾乃关羽！'],
            kill: ['痛快！', '首级在此！'],
            hurt: ['区区小伤！', '再来！'],
            death: ['大哥……云长……去也……']
        },
        skills: [
            {
                id: 'weilin',
                name: '威临',
                type: 'passive',
                category: 'special',
                content(a, t, gs) {
                    a._passive_weilin = true;
                    return { type: 'passive' };
                },
                desc: '被动：周围+2范围内的敌方武将攻击力-10。周围+1范围内的敌方武将无法使用主动技能'
            },
            {
                id: 'shuiyan',
                name: '水淹',
                type: 'active',
                category: 'special',
                range: '+3',
                energyCost: 2,
                chargeTrigger: 'afterAction',
                content(a, t, gs) {
                    const { Effect } = gs._modules;
                    const isRiver = TERRAIN[t.y] && TERRAIN[t.y][t.x] === 2;
                    const dmg = isRiver ? 60 : 30;
                    const dmgResult = Effect.damage(a, t, dmg);
                    const slowResult = Effect.slow(a, t, 1, 2);
                    return { ...dmgResult, type: 'shuiyan', slow: slowResult, riverBonus: isRiver };
                },
                desc: '主动：十字3格，对目标造成30伤害并减速1（持续2回合）。若目标在河流地形上，伤害翻倍'
            }
        ]
    }
];

window.GENERALS = GENERALS;
