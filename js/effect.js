const Effect = {
    damage: function(attacker, defender, amount) {
        const defense = defender.defense || 0;
        const actualDamage = Math.max(1, Math.floor(amount * (1 - defense / 100)));
        defender.hp -= actualDamage;
        Game.addLog(`${attacker.name} 对 ${defender.name} 造成 ${actualDamage} 点伤害！`);
        if (defender.hp <= 0) {
            defender.hp = 0;
            Game.addLog(`${defender.name} 被击败了！`);
        }
        Game.renderBoard();
    },

    heal: function(target, amount) {
        const healed = Math.min(amount, target.maxHp - target.hp);
        target.hp += healed;
        Game.addLog(`${target.name} 恢复了 ${healed} 点生命！`);
        Game.renderBoard();
    },

    buff: function(target, stat, amount, duration) {
        if (!target.buffs) target.buffs = [];
        target.buffs.push({ stat, amount, duration });
        target[stat] = (target[stat] || 0) + amount;
        Game.addLog(`${target.name} 获得了 ${stat}+${amount} 的增益！`);
    },

    movePiece: function(piece, toRow, toCol) {
        Game.board[piece.row][piece.col] = null;
        piece.row = toRow;
        piece.col = toCol;
        Game.board[toRow][toCol] = piece;
    },

    summon: function(summoner, summonType, row, col) {
        if (!Game.board[row][col]) {
            const summon = {
                ...SUMMONS[summonType],
                player: summoner.player,
                row,
                col,
                isSummon: true,
                energy: 0,
                maxEnergy: 100
            };
            Game.board[row][col] = summon;
            Game.pieces.push(summon);
            Game.addLog(`${summoner.name} 召唤了 ${summon.name}！`);
            Game.renderBoard();
        }
    },

    energize: function(target, amount) {
        target.energy = Math.min(target.maxEnergy, target.energy + amount);
        Game.addLog(`${target.name} 获得了 ${amount} 点能量！`);
    }
};
