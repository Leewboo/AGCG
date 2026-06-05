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
        id: 'test1',
        name: '勇将',
        hp: 150,
        atk: 45,
        def: 25,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            { id: 'power', name: '猛击', type: 'passive', desc: '攻击时有50%概率造成额外20伤害' }
        ]
    },
    {
        id: 'test2',
        name: '智将',
        hp: 120,
        atk: 30,
        def: 20,
        moveRange: '+2',
        attackRange: '+2',
        skills: [
            { id: 'smart', name: '智谋', type: 'passive', desc: '每回合开始时，如果没有移动，可以攻击两次' }
        ]
    },
    {
        id: 'test3',
        name: '速将',
        hp: 100,
        atk: 35,
        def: 15,
        moveRange: '+4',
        attackRange: '+1',
        skills: [
            { id: 'speed', name: '疾风', type: 'passive', desc: '移动后可以额外移动1格' }
        ]
    },
    {
        id: 'test4',
        name: '守将',
        hp: 200,
        atk: 25,
        def: 40,
        moveRange: '+2',
        attackRange: '+1',
        skills: [
            { id: 'defend', name: '坚守', type: 'passive', desc: '没有移动时，受到的伤害减少30%' }
        ]
    },
    {
        id: 'test5',
        name: '弓将',
        hp: 110,
        atk: 50,
        def: 15,
        moveRange: '+2',
        attackRange: '+3',
        skills: [
            { id: 'archer', name: '精准', type: 'passive', desc: '攻击距离越远，伤害越高，每格+10伤害' }
        ]
    },
    {
        id: 'test6',
        name: '猛将',
        hp: 180,
        atk: 55,
        def: 20,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            { id: 'fury', name: '暴怒', type: 'passive', desc: '血量越低，攻击力越高' }
        ]
    },
    {
        id: 'test7',
        name: '贤将',
        hp: 130,
        atk: 35,
        def: 25,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            { id: 'heal', name: '仁心', type: 'passive', desc: '回合结束时，治疗周围一格友方单位20点血' }
        ]
    },
    {
        id: 'test8',
        name: '骑将',
        hp: 140,
        atk: 40,
        def: 20,
        moveRange: ['+3', 'x3'],
        attackRange: '+1',
        skills: [
            { id: 'charge', name: '冲锋', type: 'passive', desc: '移动距离超过2格，攻击伤害+30' }
        ]
    },
    {
        id: 'test9',
        name: '御将',
        hp: 160,
        atk: 30,
        def: 35,
        moveRange: '+2',
        attackRange: '+2',
        skills: [
            { id: 'counter', name: '反击', type: 'passive', desc: '被攻击时有30%概率反击' }
        ]
    },
    {
        id: 'test10',
        name: '骁将',
        hp: 170,
        atk: 50,
        def: 20,
        moveRange: '+3',
        attackRange: '+1',
        skills: [
            { id: 'brave', name: '骁勇', type: 'passive', desc: '击杀敌人后，可以立即再次行动' }
        ]
    }
];

window.GENERALS = GENERALS;
