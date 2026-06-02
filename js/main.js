// 全将战棋 - 主程序

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = window.gameState;
        this.board = null;
        this.renderer = null;
        this.combat = null;
        this.ui = null;
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this.init();
    }

    init() {
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.handleResize(), 100));

        // 初始化系统
        this.board = new Board(this.state);
        this.renderer = new Renderer(this.canvas, this.state, this.board);
        this.combat = new Combat(this.state, this.board);
        this.ui = new UI(this.canvas, this.state, this.board, this.renderer, this.combat, this);

        // 初始渲染
        this.renderer.resize(this.canvas.width, this.canvas.height);
        this.renderer.render();

        // 启动游戏循环
        this.gameLoop();
    }

    handleResize() {
        // 延迟执行以等待布局完成
        setTimeout(() => this.resizeCanvas(), 50);
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // 棋盘所需最小尺寸
        const boardSize = 8;
        const cellSize = this.isMobile ? 40 : 70; // 移动端缩小格子
        const boardPixelSize = boardSize * cellSize;

        // 计算合适的大小
        let width, height;

        if (this.isMobile) {
            // 移动端：优先填满屏幕
            width = containerWidth;
            height = containerHeight;

            // 确保最小尺寸
            width = Math.max(width, 320);
            height = Math.max(height, 400);
        } else {
            // 桌面端
            width = Math.min(containerWidth - 20, 1200);
            height = Math.min(containerHeight - 20, 800);

            // 最小尺寸
            width = Math.max(width, boardPixelSize + 200);
            height = Math.max(height, boardPixelSize + 100);
        }

        this.canvas.width = width;
        this.canvas.height = height;

        // 重新计算棋盘偏移
        if (this.renderer) {
            this.renderer.cellSize = cellSize;
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
    }

    gameLoop() {
        if (this.renderer) {
            this.renderer.render();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
