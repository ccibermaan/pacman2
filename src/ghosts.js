import { TILE_SIZE, isWall, matrix } from './map.js';

export class Ghost {
    constructor(x, y, color, type, scatterTarget) {
        this.startX = x * TILE_SIZE;
        this.startY = y * TILE_SIZE;
        this.x = this.startX;
        this.y = this.startY;
        this.color = color;
        this.type = type; // 'BLINKY', 'PINKY', 'INKY', 'CLYDE'
        this.scatterTarget = scatterTarget; // {col, row}
        
        this.baseSpeed = 0.8;
        this.vx = -this.baseSpeed;
        this.vy = 0;
        this.dir = 'LEFT';
        
        // Mode: 'SCATTER', 'CHASE', 'FRIGHTENED', 'EATEN'
        this.mode = 'SCATTER';
        
        // Frightened timer
        this.frightTimer = 0;
    }

    getCol() { return Math.floor(this.x / TILE_SIZE); }
    getRow() { return Math.floor(this.y / TILE_SIZE); }

    isAligned() {
        return this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0;
    }

    getDistance(col1, row1, col2, row2) {
        let dx = col1 - col2;
        let dy = row1 - row2;
        return dx * dx + dy * dy; // We don't need sqrt for arbitrary distance comparison
    }

    getTarget(player, blinky) {
        if (this.mode === 'SCATTER') return this.scatterTarget;
        
        let pCol = player.getCol();
        let pRow = player.getRow();
        let pv = player.getVector(player.currentDir);

        if (this.type === 'BLINKY') {
            return { col: pCol, row: pRow };
        } 
        else if (this.type === 'PINKY') {
            return { col: pCol + (pv.x * 4), row: pRow + (pv.y * 4) };
        } 
        else if (this.type === 'INKY' && blinky) {
            let tCol = pCol + (pv.x * 2);
            let tRow = pRow + (pv.y * 2);
            let bCol = blinky.getCol();
            let bRow = blinky.getRow();
            return { col: tCol + (tCol - bCol), row: tRow + (tRow - bRow) };
        } 
        else if (this.type === 'CLYDE') {
            let distToPlayer = this.getDistance(this.getCol(), this.getRow(), pCol, pRow);
            // 8 tiles distance squared = 64
            if (distToPlayer > 64) {
                return { col: pCol, row: pRow };
            } else {
                return this.scatterTarget;
            }
        }
        return { col: pCol, row: pRow }; // Fallback
    }

    update(player, blinky) {
        if (this.isAligned()) {
            let col = this.getCol();
            let row = this.getRow();

            // Tunnel Wrap
            if (col < 0) { this.x = 27 * TILE_SIZE; return; }
            if (col > 27) { this.x = 0; return; }

            // Get target
            let target = this.getTarget(player, blinky);
            
            // Frightened mode ignores target and picks random valid (pseudo-random logic original arcade)
            let isFrightened = this.mode === 'FRIGHTENED';

            let possibleMoves = [
                { dir: 'UP', x: 0, y: -1, backwards: 'DOWN' },
                { dir: 'LEFT', x: -1, y: 0, backwards: 'RIGHT' },
                { dir: 'DOWN', x: 0, y: 1, backwards: 'UP' },
                { dir: 'RIGHT', x: 1, y: 0, backwards: 'LEFT' }
            ];

            let bestDist = Infinity;
            let chosenMove = null;
            let validMoves = [];

            for (let move of possibleMoves) {
                // Cannot reverse direction
                if (move.backwards === this.dir && !isFrightened) continue; // In original, changing to frightened reverses dir once, handled in engine

                if (!isWall(col + move.x, row + move.y, true)) {
                    validMoves.push(move);
                    let dist = this.getDistance(col + move.x, row + move.y, target.col, target.row);
                    if (dist < bestDist) {
                        bestDist = dist;
                        chosenMove = move;
                    }
                }
            }

            if (isFrightened && validMoves.length > 0) {
                // Random turn when frightened
                chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            }

            if (chosenMove) {
                this.dir = chosenMove.dir;
                this.vx = chosenMove.x * (isFrightened ? 0.4 : this.baseSpeed);
                this.vy = chosenMove.y * (isFrightened ? 0.4 : this.baseSpeed);
            } else {
                // Dead end (shouldn't happen on pacman maps unless eaten/in ghost house)
                this.vx = 0; this.vy = 0;
            }
        }

        // Fright timer
        if (this.mode === 'FRIGHTENED') {
            this.frightTimer--;
            if (this.frightTimer <= 0) {
                this.mode = 'CHASE'; // Return to normal logic
                // Ensure speed resets
                let move = {x: 0, y: 0};
                if (this.dir==='UP') move.y=-1; if (this.dir==='DOWN') move.y=1;
                if (this.dir==='LEFT') move.x=-1; if (this.dir==='RIGHT') move.x=1;
                this.vx = move.x * this.baseSpeed;
                this.vy = move.y * this.baseSpeed;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        if (this.mode === 'FRIGHTENED') {
            ctx.fillStyle = this.frightTimer < 120 && (this.frightTimer % 20 < 10) ? '#fff' : '#00f';
        }
        
        ctx.beginPath();
        let hc = this.x + TILE_SIZE / 2;
        let hy = this.y + TILE_SIZE / 2;
        ctx.arc(hc, hy, TILE_SIZE / 2, Math.PI, 0); // Head dome
        ctx.lineTo(this.x + TILE_SIZE, this.y + TILE_SIZE);
        // Scalloped bottom
        ctx.lineTo(this.x + (TILE_SIZE * 0.75), this.y + TILE_SIZE - 2);
        ctx.lineTo(this.x + (TILE_SIZE * 0.5), this.y + TILE_SIZE);
        ctx.lineTo(this.x + (TILE_SIZE * 0.25), this.y + TILE_SIZE - 2);
        ctx.lineTo(this.x, this.y + TILE_SIZE);
        ctx.fill();

        if (this.mode !== 'FRIGHTENED') {
            // Eyes Directional
            ctx.fillStyle = '#fff';
            let ex = 0; let ey = 0;
            if (this.dir==='UP') ey = -2;
            if (this.dir==='DOWN') ey = 2;
            if (this.dir==='LEFT') ex = -2;
            if (this.dir==='RIGHT') ex = 2;
            
            ctx.fillRect(this.x + 1 + ex, this.y + 2 + ey, 2, 2);
            ctx.fillRect(this.x + 5 + ex, this.y + 2 + ey, 2, 2);
        }
    }
}
