const GAME_DATA = {
    GENERALS: [
        {
            id: 'guanyu',
            name: '关羽',
            icon: '⚔️',
            hp: 100,
            atk: 25,
            def: 15,
            mov: 3,
            skills: ['dragon']
        },
        {
            id: 'zhugeliang',
            name: '诸葛亮',
            icon: '📖',
            hp: 70,
            atk: 20,
            def: 10,
            mov: 2,
            skills: ['fire']
        },
        {
            id: 'zhaoyun',
            name: '赵云',
            icon: '🐴',
            hp: 85,
            atk: 22,
            def: 12,
            mov: 4,
            skills: ['spear']
        },
        {
            id: 'zhangfei',
            name: '张飞',
            icon: '🗡️',
            hp: 110,
            atk: 28,
            def: 18,
            mov: 2,
            skills: ['roar']
        },
        {
            id: 'huangzhong',
            name: '黄忠',
            icon: '🏹',
            hp: 75,
            atk: 26,
            def: 8,
            mov: 2,
            skills: ['arrow']
        },
        {
            id: 'machao',
            name: '马超',
            icon: '⚡',
            hp: 90,
            atk: 24,
            def: 10,
            mov: 4,
            skills: ['charge']
        },
        {
            id: 'caocao',
            name: '曹操',
            icon: '👑',
            hp: 95,
            atk: 22,
            def: 14,
            mov: 3,
            skills: ['strategy']
        },
        {
            id: 'caoren',
            name: '曹仁',
            icon: '🛡️',
            hp: 105,
            atk: 18,
            def: 22,
            mov: 2,
            skills: ['defend']
        },
        {
            id: 'sunce',
            name: '孙策',
            icon: '🔥',
            hp: 88,
            atk: 25,
            def: 11,
            mov: 3,
            skills: ['assault']
        },
        {
            id: 'sunshangxiang',
            name: '孙尚香',
            icon: '💫',
            hp: 72,
            atk: 23,
            def: 9,
            mov: 3,
            skills: ['bow']
        }
    ],

    SKILLS: {
        dragon: {
            id: 'dragon',
            name: '青龙偃月',
            range: 'cross',
            rangeValue: 2,
            damage: 35,
            spCost: 30
        },
        fire: {
            id: 'fire',
            name: '火烧赤壁',
            range: 'circle',
            rangeValue: 2,
            damage: 28,
            spCost: 35
        },
        spear: {
            id: 'spear',
            name: '龙胆枪',
            range: 'cross',
            rangeValue: 3,
            damage: 30,
            spCost: 25
        },
        roar: {
            id: 'roar',
            name: '狮吼功',
            range: 'cross',
            rangeValue: 1,
            damage: 40,
            spCost: 35
        },
        arrow: {
            id: 'arrow',
            name: '百步穿杨',
            range: 'cross',
            rangeValue: 4,
            damage: 32,
            spCost: 30
        },
        charge: {
            id: 'charge',
            name: '铁骑冲锋',
            range: 'cross',
            rangeValue: 3,
            damage: 33,
            spCost: 28
        },
        strategy: {
            id: 'strategy',
            name: '奸雄之计',
            range: 'circle',
            rangeValue: 2,
            damage: 25,
            spCost: 30
        },
        defend: {
            id: 'defend',
            name: '铜墙铁壁',
            range: 'cross',
            rangeValue: 1,
            damage: 20,
            spCost: 20
        },
        assault: {
            id: 'assault',
            name: '霸王突袭',
            range: 'cross',
            rangeValue: 2,
            damage: 35,
            spCost: 30
        },
        bow: {
            id: 'bow',
            name: '枭姬弓',
            range: 'cross',
            rangeValue: 3,
            damage: 28,
            spCost: 25
        }
    },

    TERRAIN: [
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
    ],

    TERRAIN_NAMES: {
        0: 'grass',
        1: 'mountain',
        2: 'river',
        3: 'city',
        4: 'swamp'
    },

    TERRAIN_LABELS: {
        0: '',
        1: '山',
        2: '～',
        3: '城',
        4: '沼'
    }
};
