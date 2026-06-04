// ================================
// 游戏数据
// ================================
export const BOARD_SIZE = 12;

export const TERRAIN = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0],
    [2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2],
    [2, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 2],
    [0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0],
    [2, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 2],
    [2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2],
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

export const TERRAIN_NAMES = { 0: 'grass', 1: 'mountain', 2: 'river', 3: 'city', 4: 'swamp' };
export const TERRAIN_LABELS = { 0: '', 1: '山', 2: '～', 3: '城', 4: '沼' };

export const SUMMONS = {
    soldier: { name: '士兵', hp: 40, atk: 8, def: 5, mov: 2 },
    archer: { name: '弓手', hp: 30, atk: 12, def: 3, mov: 2 },
    wall: { name: '盾墙', hp: 80, atk: 0, def: 20, mov: 0 }
};

// 能量获取条件
export const ENERGY_ON_KILL = 1;
export const ENERGY_ON_HURT = 1;
export const ENERGY_ON_TURN = 1;
export const ENERGY_ON_ATTACK = 0;

// 仅保留一个调试武将
export const GENERALS = [
    {
        id: 'debug',
        name: '调试将',
        hp: 100,
        atk: 20,
        def: 10,
        mov: 3,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            {
                id: 'testDmg',
                name: '测试打击',
                type: 'active',
                category: 'normal',
                range: '+2',
                energyCost: 1,
                content(a, t, gs) {
                    return { damage: 10, type: 'damage' };
                },
                desc: '十字2格，造成10点伤害（调试用）'
            },
            {
                id: 'testPassive',
                name: '调试被动',
                type: 'passive',
                category: 'special',
                content(a) {
                    a.atk += 5;
                    return { type: 'passive', msg: '攻击力+5' };
                },
                desc: '被动：攻击力+5'
            }
        ]
    }
];
