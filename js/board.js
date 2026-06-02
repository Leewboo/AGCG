// 全将战棋 - 棋盘系统

class Board {
    constructor(gameState) {
        this.state = gameState;
    }

    // 计算曼哈顿距离
    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // 计算欧几里得距离
    euclideanDistance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    // 获取可移动范围
    getMoveableTiles(unit) {
        const tiles = [];
        const size = this.state.board.size;
        const mov = unit.mov;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (x === unit.pos.x && y === unit.pos.y) continue;

                const tile = this.state.getTile(x, y);
                if (tile.unitId) continue; // 有单位占据

                const dist = this.manhattanDistance(unit.pos.x, unit.pos.y, x, y);
                const terrain = window.GAME_DATA.TERRAIN_TYPES[tile.terrain];

                // 检查移动消耗
                if (dist <= mov * terrain.movCost) {
                    tiles.push({ x, y });
                }
            }
        }

        return tiles;
    }

    // 获取攻击范围 (基于范围类型)
    getAttackableTiles(unit, range) {
        const tiles = [];
        const size = this.state.board.size;
        const { type, value } = range;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const tile = this.state.getTile(x, y);
                if (!tile.unitId) continue; // 无单位

                const targetUnit = this.state.getUnit(tile.unitId);
                if (targetUnit.player === unit.player) continue; // 同阵营

                if (this.isInRange(unit.pos.x, unit.pos.y, x, y, type, value)) {
                    tiles.push({ x, y, unitId: tile.unitId });
                }
            }
        }

        return tiles;
    }

    // 获取技能范围
    getSkillTiles(unit, skill) {
        const tiles = [];
        const size = this.state.board.size;
        const { rangeType, rangeValue, targetType } = skill;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!this.isInRange(unit.pos.x, unit.pos.y, x, y, rangeType, rangeValue)) {
                    continue;
                }

                const tile = this.state.getTile(x, y);

                if (targetType === 'self') {
                    if (x === unit.pos.x && y === unit.pos.y) {
                        tiles.push({ x, y, isSelf: true });
                    }
                } else if (targetType === 'ally') {
                    if (tile.unitId) {
                        const targetUnit = this.state.getUnit(tile.unitId);
                        if (targetUnit.player === unit.player) {
                            tiles.push({ x, y, unitId: tile.unitId });
                        }
                    }
                } else if (targetType === 'enemy') {
                    if (tile.unitId) {
                        const targetUnit = this.state.getUnit(tile.unitId);
                        if (targetUnit.player !== unit.player) {
                            tiles.push({ x, y, unitId: tile.unitId });
                        }
                    }
                }
            }
        }

        return tiles;
    }

    // 判断是否在范围内
    isInRange(fromX, fromY, toX, toY, type, value) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        switch (type) {
            case 'r': // 圆形 (曼哈顿距离)
                return this.manhattanDistance(fromX, fromY, toX, toY) <= value;

            case '+': // 十字形
                if (dx === 0 && dy <= value) return true;
                if (dy === 0 && dx <= value) return true;
                return false;

            case 'x': // 斜角形
                return dx === dy && dx <= value;

            default:
                return false;
        }
    }

    // 获取范围内所有格子
    getTilesInRange(centerX, centerY, type, value) {
        const tiles = [];
        const size = this.state.board.size;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (this.isInRange(centerX, centerY, x, y, type, value)) {
                    tiles.push({ x, y });
                }
            }
        }

        return tiles;
    }

    // 获取相邻格子
    getAdjacentTiles(x, y) {
        const tiles = [];
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }  // 右
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const tile = this.state.getTile(nx, ny);
            if (tile) {
                tiles.push({ x: nx, y: ny, tile });
            }
        }

        return tiles;
    }

    // 获取直线上的格子
    getLineTiles(fromX, fromY, toX, toY) {
        const tiles = [];
        const dx = Math.sign(toX - fromX);
        const dy = Math.sign(toY - fromY);

        let x = fromX;
        let y = fromY;

        while (x !== toX || y !== toY) {
            x += dx;
            y += dy;
            const tile = this.state.getTile(x, y);
            if (tile) {
                tiles.push({ x, y, tile });
            }
        }

        return tiles;
    }

    // 寻路 (简单BFS)
    findPath(fromX, fromY, toX, toY, maxDist) {
        if (this.manhattanDistance(fromX, fromY, toX, toY) > maxDist) {
            return null;
        }

        const queue = [{ x: fromX, y: fromY, path: [] }];
        const visited = new Set();
        visited.add(`${fromX},${fromY}`);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === toX && current.y === toY) {
                return current.path;
            }

            if (current.path.length >= maxDist) continue;

            const adjacent = this.getAdjacentTiles(current.x, current.y);

            for (const adj of adjacent) {
                const key = `${adj.x},${adj.y}`;
                if (visited.has(key)) continue;

                const tile = this.state.getTile(adj.x, adj.y);
                if (tile && !tile.unitId) {
                    visited.add(key);
                    queue.push({
                        x: adj.x,
                        y: adj.y,
                        path: [...current.path, { x: adj.x, y: adj.y }]
                    });
                }
            }
        }

        return null;
    }

    // 获取地形加成
    getTerrainBonus(x, y) {
        const tile = this.state.getTile(x, y);
        if (!tile) return { atkBonus: 0, defBonus: 0 };
        return window.GAME_DATA.TERRAIN_TYPES[tile.terrain];
    }
}

// 创建全局棋盘实例
window.Board = Board;
