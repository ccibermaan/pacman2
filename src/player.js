import { TILE_SIZE, isWall, matrix } from './map.js';

export default class Player {
    constructor(x, y) {
        this.x = x * TILE_SIZE; // starting col
        this.y = y * TILE_SIZE; // starting row
        
        this.baseSpeed = 1; // Pixels per frame. Pacman speed is slightly less than 1 tile per 8 frames. Handled via 1px per frame.
        this.vx = 0;
        this.vy = 0;
        
        // Directions: null, 'UP', 'DOWN', 'LEFT', 'RIGHT'
        this.currentDir = 'LEFT';
        this.nextDir = 'LEFT';

        this.mouthOpen = 0;
        this.mouthDir = 1; // 1 for opening, -1 for closing
        this.scoreCache = 0;
        
        // Setup input buffering
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.nextDir = 'UP';
            else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.nextDir = 'DOWN';
            else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.nextDir = 'LEFT';
            else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.nextDir = 'RIGHT';
        });
    }

    getCol() { return Math.floor(this.x / TILE_SIZE); }
    getRow() { return Math.floor(this.y / TILE_SIZE); }

    isAligned() {
        return this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0;
    }

    getVector(dir) {
        if (dir === 'UP') return {x: 0, y: -1};
        if (dir === 'DOWN') return {x: 0, y: 1};
        if (dir === 'LEFT') return {x: -1, y: 0};
        if (dir === 'RIGHT') return {x: 1, y: 0};
        return {x: 0, y: 0};
    }

    update() {
        // Animation
        this.mouthOpen += 0.15 * this.mouthDir;
        if (this.mouthOpen >= 0.7) this.mouthDir = -1;
        if (this.mouthOpen <= 0) this.mouthDir = 1;

        // Input and Movement Logic
        if (this.isAligned()) {
            let col = this.getCol();
            let row = this.getRow();

            // Handle lateral tunnels wrap around
            if (col < 0) {
                this.x = 27 * TILE_SIZE;
                return;
            } else if (col > 27) {
                this.x = 0;
                return;
            }

            // Check if we can turn to nextDir
            let nextV = this.getVector(this.nextDir);
            if (!isWall(col + nextV.x, row + nextV.y)) {
                this.currentDir = this.nextDir;
            }

            // Check if currentDir hits a wall
            let currV = this.getVector(this.currentDir);
            if (isWall(col + currV.x, row + currV.y)) {
                this.vx = 0;
                this.vy = 0;
            } else {
                this.vx = currV.x * this.baseSpeed;
                this.vy = currV.y * this.baseSpeed;
            }

            // Consumables are handled globally in engine.js
            
        } else {
            // If not aligned, we might be able to reverse direction instantly (180 turn)
            if ((this.nextDir === 'LEFT' && this.currentDir === 'RIGHT') ||
                (this.nextDir === 'RIGHT' && this.currentDir === 'LEFT') ||
                (this.nextDir === 'UP' && this.currentDir === 'DOWN') ||
                (this.nextDir === 'DOWN' && this.currentDir === 'UP')) {
                this.currentDir = this.nextDir;
                let nextV = this.getVector(this.nextDir);
                this.vx = nextV.x * this.baseSpeed;
                this.vy = nextV.y * this.baseSpeed;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    render(ctx) {
        let sprite = this.mouthOpen > 0.3 ? [
            "    XXXXX    ",
            "  XXXXXXXXX  ",
            " XXXXXXXXXXX ",
            "XXXXXXXXXXXXX",
            "XXXXXX       ",
            "XXXXX        ",
            "XXXX         ",
            "XXXXX        ",
            "XXXXXX       ",
            "XXXXXXXXXXXXX",
            " XXXXXXXXXXX ",
            "  XXXXXXXXX  ",
            "    XXXXX    "
        ] : [
            "    XXXXX    ",
            "  XXXXXXXXX  ",
            " XXXXXXXXXXX ",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            " XXXXXXXXXXX ",
            "  XXXXXXXXX  ",
            "    XXXXX    "
        ];

        ctx.save();
        ctx.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        
        let rotation = 0;
        if (this.currentDir === 'DOWN') rotation = Math.PI / 2;
        if (this.currentDir === 'LEFT') rotation = Math.PI;
        if (this.currentDir === 'UP') rotation = -Math.PI / 2;
        ctx.rotate(rotation);

        ctx.fillStyle = '#FFFF00'; // Pacman Yellow
        
        let offset = -6; // center the 13x13 sprite
        for (let r = 0; r < sprite.length; r++) {
            for (let c = 0; c < sprite[r].length; c++) {
                if (sprite[r][c] === 'X') {
                    ctx.fillRect(offset + c, offset + r, 1, 1);
                }
            }
        }
        ctx.restore();
    }
}
