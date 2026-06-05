// ================================
// 游戏数据
// ================================

const BOARD_SIZE_DATA = 12;
window.BOARD_SIZE = BOARD_SIZE_DATA;

// 地形类型: 0=草地 1=山脉(阻断移动/攻击) 2=河流(阻断移动,可攻击) 3=城池 4=沼泽 5=桥梁(可通行)
// 历史战役风: 参考赤壁/官渡, 河流弯曲, 有渡口桥梁作为必争通道
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

// 地形阻断规则: 哪些地形ID会阻断移动/攻击范围
const BLOCKING_TERRAIN_MOVE = new Set([1, 2]); // 山脉+河流阻断移动
window.BLOCKING_TERRAIN_MOVE = BLOCKING_TERRAIN_MOVE;

const BLOCKING_TERRAIN_ATTACK = new Set([1]); // 山脉阻断攻击(河流可攻击跨越)
window.BLOCKING_TERRAIN_ATTACK = BLOCKING_TERRAIN_ATTACK;

const GENERALS = [];
window.GENERALS = GENERALS;
