// 全将战棋 - 主程序

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = window.gameState;
        this.board = null;
        this.renderer = null;
        this.combat = null;
        this.ui = null;

        this.init();
    }

    init() {
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 初始化系统
        this.board = new Board(this.state);
        this.renderer = new Renderer(this.canvas, this.state, this.board);
        this.combat = new Combat(this.state, this.board);
        this.ui = new UI(this.canvas, this.state, this.board, this.renderer, this.combat);

        // 初始渲染
        this.renderer.resize(this.canvas.width, this.canvas.height);
        this.renderer.render();

        // 启动游戏循环
        this.gameLoop();
    }

    resizeCanvas() {
        // 根据窗口大小调整画布
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 40;

        // 最小尺寸
        const minWidth = 900;
        const minHeight = 700;

        this.canvas.width = Math.max(minWidth, Math.min(maxWidth, 1200));
        this.canvas.height = Math.max(minHeight, Math.min(maxHeight, 800));

        // 重新计算棋盘偏移
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
    }

    gameLoop() {
        this.renderer.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
