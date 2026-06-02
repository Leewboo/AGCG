class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.state = window.gameState;
        this.board = null;
        this.renderer = null;
        this.combat = null;
        this.ui = null;
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.board = new Board(this.state);
        this.renderer = new Renderer(this.canvas, this.state);
        this.combat = new Combat(this.state, this.board);
        this.ui = new UI(this.canvas, this.state, this.board, this.renderer, this.combat, this);

        this.renderer.resize(this.canvas.width, this.canvas.height);
        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    loop() {
        this.renderer.render();
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
