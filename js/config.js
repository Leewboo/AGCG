const CONFIG = {
    BOARD_ROWS: 10,
    BOARD_COLS: 10,
    SELECTION_COUNT: 5,
    INITIAL_ENERGY: 0,
    MAX_ENERGY: 100,
    MOVE_ENERGY: 10,
    ATTACK_ENERGY: 15
};

const TERRAINS = {
    grass: { name: '草地', moveCost: 1, defense: 0, passable: true, symbol: '' },
    forest: { name: '森林', moveCost: 2, defense: 10, passable: true, symbol: '林' },
    mountain: { name: '山地', moveCost: 3, defense: 20, passable: true, symbol: '山' },
    water: { name: '水域', moveCost: Infinity, defense: 0, passable: false, symbol: '～' },
    castle: { name: '城池', moveCost: 1, defense: 30, passable: true, symbol: '城' },
    swamp: { name: '沼泽', moveCost: 2, defense: -10, passable: true, symbol: '沼' },
    default: { name: '平地', moveCost: 1, defense: 0, passable: true, symbol: '' }
};

const EQUIPMENT = {
    sword: { name: '青龙偃月刀', slot: 'weapon', attack: 15, hp: 0 },
    spear: { name: '丈八蛇矛', slot: 'weapon', attack: 12, hp: 10 },
    bow: { name: '养由基弓', slot: 'weapon', attack: 10, range: 1 },
    armor: { name: '鱼鳞甲', slot: 'armor', attack: 0, hp: 30, defense: 10 },
    robe: { name: '鹤氅', slot: 'armor', attack: 5, hp: 20, defense: 5 },
    ring: { name: '力量戒指', slot: 'accessory', attack: 8, hp: 0 },
    amulet: { name: '护身符', slot: 'accessory', attack: 0, hp: 25 }
};

const SKILLS = {
    fireAttack: {
        name: '火攻',
        type: 'active',
        category: 'charge',
        energyCost: 30,
        range: ['r2'],
        description: '对目标造成25点伤害',
        filter: (user, target) => target && target.player !== user.player,
        content: (user, target) => {
            Effect.damage(user, target, 25);
        }
    },
    heal: {
        name: '治疗',
        type: 'active',
        category: 'charge',
        energyCost: 25,
        range: ['+1', 'x1'],
        description: '恢复目标20点生命',
        filter: (user, target) => target && target.player === user.player,
        content: (user, target) => {
            Effect.heal(target, 20);
        }
    },
    fury: {
        name: '狂暴',
        type: 'passive',
        category: 'special',
        description: '生命值低于30%时，攻击力+50%',
        trigger: 'onTurnStart',
        filter: (user) => user.hp / user.maxHp < 0.3,
        content: (user) => {
            if (!user.furyActive) {
                user.attack = Math.floor(user.attack * 1.5);
                user.furyActive = true;
                Game.addLog(user.name + ' 进入狂暴状态');
            }
        }
    },
    warCry: {
        name: '战吼',
        type: 'active',
        category: 'special',
        energyCost: 40,
        range: ['r1'],
        description: '提升周围友军攻击力',
        filter: (user, target) => target && target.player === user.player,
        content: (user, target) => {
            Effect.buff(target, 'attack', 10, 3);
        }
    },
    summonSoldier: {
        name: '召唤士兵',
        type: 'active',
        category: 'summon',
        energyCost: 50,
        range: ['+1'],
        description: '在相邻空格召唤一个士兵',
        filter: (user, target, row, col) => !target,
        content: (user, target, row, col) => {
            Effect.summon(user, 'soldier', row, col);
        }
    },
    shieldWall: {
        name: '铁壁',
        type: 'passive',
        category: 'special',
        description: '受到伤害减少20%',
        trigger: 'onDamage',
        content: (user, damage) => {
            return Math.floor(damage * 0.8);
        }
    }
};

const SUMMONS = {
    soldier: {
        name: '士兵',
        symbol: '兵',
        hp: 30,
        maxHp: 30,
        attack: 8,
        defense: 5,
        moveRange: ['r2'],
        attackRange: ['+1'],
        skills: []
    }
};

const GENERALS = {
    guanYu: {
        id: 'guanYu',
        name: '关羽',
        symbol: '关',
        hp: 100,
        maxHp: 100,
        attack: 25,
        defense: 15,
        moveRange: ['r2'],
        attackRange: ['+1'],
        skills: ['fireAttack', 'fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    zhangFei: {
        id: 'zhangFei',
        name: '张飞',
        symbol: '张',
        hp: 110,
        maxHp: 110,
        attack: 28,
        defense: 12,
        moveRange: ['r2'],
        attackRange: ['+1'],
        skills: ['warCry', 'fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    zhugeLiang: {
        id: 'zhugeLiang',
        name: '诸葛亮',
        symbol: '诸',
        hp: 70,
        maxHp: 70,
        attack: 15,
        defense: 8,
        moveRange: ['r2'],
        attackRange: ['r2'],
        skills: ['heal', 'summonSoldier'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    caoCao: {
        id: 'caoCao',
        name: '曹操',
        symbol: '曹',
        hp: 90,
        maxHp: 90,
        attack: 22,
        defense: 18,
        moveRange: ['r3'],
        attackRange: ['+1'],
        skills: ['warCry', 'shieldWall'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    sunQuan: {
        id: 'sunQuan',
        name: '孙权',
        symbol: '孙',
        hp: 85,
        maxHp: 85,
        attack: 20,
        defense: 16,
        moveRange: ['r2'],
        attackRange: ['x1', '+1'],
        skills: ['heal', 'shieldWall'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    zhaoYun: {
        id: 'zhaoYun',
        name: '赵云',
        symbol: '赵',
        hp: 95,
        maxHp: 95,
        attack: 26,
        defense: 14,
        moveRange: ['r3'],
        attackRange: ['+1'],
        skills: ['fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    maChao: {
        id: 'maChao',
        name: '马超',
        symbol: '马',
        hp: 88,
        maxHp: 88,
        attack: 27,
        defense: 11,
        moveRange: ['r4'],
        attackRange: ['+1'],
        skills: ['fury'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    huangZhong: {
        id: 'huangZhong',
        name: '黄忠',
        symbol: '黄',
        hp: 75,
        maxHp: 75,
        attack: 24,
        defense: 9,
        moveRange: ['r2'],
        attackRange: ['r3'],
        skills: ['fireAttack'],
        equipment: { weapon: null, armor: null, accessory: null }
    },
    luBu: {
        id: 'luBu',
        name: '吕布',
        symbol: '吕',
        hp: 120,
        maxHp: 120,
        attack: 35,
        defense: 10,
        moveRange: ['r2'],
        attackRange: ['+1', 'x1'],
        skills: ['fury', 'warCry'],
        equipment: { weapon: null, armor: null, accessory: null }
    }
};
