const RangeSystem = {
    getCellsInRange: function(row, col, rangePatterns, board) {
        const cells = new Set();
        rangePatterns.forEach(pattern => {
            const type = pattern[0];
            const n = parseInt(pattern.slice(1));
            switch (type) {
                case '+':
                    this.getPlusRange(row, col, n, board, cells);
                    break;
                case 'x':
                    this.getXRange(row, col, n, board, cells);
                    break;
                case 'r':
                    this.getCircleRange(row, col, n, board, cells);
                    break;
            }
        });
        return Array.from(cells);
    },

    getPlusRange: function(row, col, n, board, cells) {
        for (let i = 1; i <= n; i++) {
            if (row - i >= 0) cells.add(`${row - i},${col}`);
            if (row + i < board.length) cells.add(`${row + i},${col}`);
            if (col - i >= 0) cells.add(`${row},${col - i}`);
            if (col + i < board[0].length) cells.add(`${row},${col + i}`);
        }
    },

    getXRange: function(row, col, n, board, cells) {
        for (let i = 1; i <= n; i++) {
            if (row - i >= 0 && col - i >= 0) cells.add(`${row - i},${col - i}`);
            if (row - i >= 0 && col + i < board[0].length) cells.add(`${row - i},${col + i}`);
            if (row + i < board.length && col - i >= 0) cells.add(`${row + i},${col - i}`);
            if (row + i < board.length && col + i < board[0].length) cells.add(`${row + i},${col + i}`);
        }
    },

    getCircleRange: function(row, col, n, board, cells) {
        for (let dr = -n; dr <= n; dr++) {
            for (let dc = -n; dc <= n; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length) {
                    if (Math.abs(dr) + Math.abs(dc) <= n) {
                        cells.add(`${newRow},${newCol}`);
                    }
                }
            }
        }
    }
};
