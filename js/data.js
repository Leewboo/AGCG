// 全将战棋 - 游戏数据
// 武将和技能数据定义

const GENERALS = [
    {
        id: 'guanyu',
        name: '关羽',
        hp: 120,
        atk: 25,
        def: 15,
        mov: 3,
        sp: 100,
        attackRange: { type: 'r', value: 1 },
        skills: ['qinglongzhan'],
        icon: '👑'
    },
    {
        id: 'caocao',
        name: '曹操',
        hp: 100,
        atk: 20,
        def: 12,
        mov: 4,
        sp: 100,
        attackRange: { type: 'r', value: 1 },
        skills: ['bingleizhen'],
        icon: '🛡️'
    },
    {
        id: 'zhaoyun',
        name: '赵云',
        hp: 90,
        atk: 22,
        def: 10,
        mov: 5,
        sp: 100,
        attackRange: { type: 'r', value: 1 },
        skills: ['qitanqiang'],
        icon: '⚔️'
    },
    {
        id: 'diaochan',
        name: '貂蝉',
        hp: 80,
        atk: 15,
        def: 8,
        mov: 4,
        sp: 100,
        attackRange: { type: '+', value: 1 },
        skills: ['qingguo'],
        icon: '💫'
    },
    {
        id: 'lvbu',
        name: '吕布',
        hp: 130,
        atk: 30,
        def: 20,
        mov: 3,
        sp: 100,
        attackRange: { type: 'r', value: 1 },
        skills: ['wushuangluanwu'],
        icon: '🔥'
    },
    {
        id: 'zhangfei',
        name: '张飞',
        hp: 110,
        atk: 28,
        def: 18,
        mov: 3,
        sp: 100,
        attackRange: { type: 'r', value: 1 },
        skills: ['baotan'],
        icon: '🪓'
    },
    {
        id: 'huangzhong',
        name: '黄忠',
        hp: 85,
        atk: 26,
        def: 10,
        mov: 3,
        sp: 100,
        attackRange: { type: 'r', value: 2 },
        skills: ['sviouslyhe'],
        icon: '🏹'
    },
    {
        id: 'machao',
        name: '马超',
        hp: 95,
        atk: 24,
        def: 12,
        mov: 5,
        sp: 100,
        attackRange: { type: 'r', value: 1 },
        skills: ['tieqi'],
        icon: '🐎'
    },
    {
        id: 'sunshangxiang',
        name: '孙尚香',
        hp: 75,
        atk: 22,
        def: 8,
        mov: 4,
        sp: 100,
        attackRange: { type: 'r', value: 2 },
        skills: ['wuhun'],
        icon: '🎯'
    },
    {
        id: 'zhugeliang',
        name: '诸葛亮',
        hp: 70,
        atk: 18,
        def: 8,
        mov: 3,
        sp: 100,
        attackRange: { type: '+', value: 2 },
        skills: ['huoshaoyan'],
        icon: '📖'
    }
];

const SKILLS = {
    qinglongzhan: {
        id: 'qinglongzhan',
        name: '青龙斩',
        spCost: 30,
        rangeType: 'r',
        rangeValue: 2,
        damage: 40,
        effect: 'damage',
        targetType: 'enemy',
        description: '对范围内敌人造成40伤害'
    },
    bingleizhen: {
        id: 'bingleizhen',
        name: '冰雷阵',
        spCost: 35,
        rangeType: '+',
        rangeValue: 2,
        damage: 35,
        effect: 'damage',
        targetType: 'enemy',
        description: '十字形范围内造成35伤害'
    },
    qitanqiang: {
        id: 'qitanqiang',
        name: '七探枪',
        spCost: 40,
        rangeType: 'x',
        rangeValue: 2,
        damage: 45,
        effect: 'damage',
        targetType: 'enemy',
        description: '斜角范围内造成45伤害'
    },
    qingguo: {
        id: 'qingguo',
        name: '倾国',
        spCost: 25,
        rangeType: 'x',
        rangeValue: 1,
        damage: 25,
        effect: 'damage',
        targetType: 'enemy',
        description: '斜角范围内造成25伤害并减速'
    },
    wushuangluanwu: {
        id: 'wushuangluanwu',
        name: '无双乱舞',
        spCost: 50,
        rangeType: 'r',
        rangeValue: 3,
        damage: 50,
        effect: 'damage',
        targetType: 'enemy',
        description: '圆形范围造成50伤害'
    },
    baotan: {
        id: 'baotan',
        name: '暴叹',
        spCost: 30,
        rangeType: 'r',
        rangeValue: 1,
        damage: 45,
        effect: 'damage',
        targetType: 'enemy',
        description: '对单体造成45伤害'
    },
    sviouslyhe: {
        id: 'sviouslyhe',
        name: '无可奉还',
        spCost: 35,
        rangeType: 'r',
        rangeValue: 3,
        damage: 38,
        effect: 'damage',
        targetType: 'enemy',
        description: '远程造成38伤害'
    },
    tieqi: {
        id: 'tieqi',
        name: '铁骑',
        spCost: 40,
        rangeType: 'r',
        rangeValue: 2,
        damage: 42,
        effect: 'damage',
        targetType: 'enemy',
        description: '冲击范围内造成42伤害'
    },
    wuhun: {
        id: 'wuhun',
        name: '武魂',
        spCost: 30,
        rangeType: 'r',
        rangeValue: 2,
        damage: 35,
        effect: 'damage',
        targetType: 'enemy',
        description: '精神攻击造成35伤害'
    },
    huoshaoyan: {
        id: 'huoshaoyan',
        name: '火烧连营',
        spCost: 45,
        rangeType: '+',
        rangeValue: 3,
        damage: 48,
        effect: 'damage',
        targetType: 'enemy',
        description: '十字形火焰造成48伤害'
    }
};

const TERRAIN_TYPES = {
    GRASS: { id: 'grass', name: '草地', atkBonus: 0, defBonus: 0, movCost: 1 },
    MOUNTAIN: { id: 'mountain', name: '山地', atkBonus: 0, defBonus: 0.2, movCost: 2 },
    RIVER: { id: 'river', name: '河流', atkBonus: 0, defBonus: 0, movCost: 99 },
    CITY: { id: 'city', name: '城池', atkBonus: 0.1, defBonus: 0, movCost: 1 }
};

// 导出数据
window.GAME_DATA = {
    GENERALS,
    SKILLS,
    TERRAIN_TYPES
};
