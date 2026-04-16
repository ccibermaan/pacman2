import { initMap, drawMap, matrix } from './map.js';
import Player from './player.js';
import { Ghost } from './ghosts.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize Map
initMap();

let globalScore = 0;
let gameState = 'START'; // START, PLAY, GAMEOVER
let player;
let blinky, pinky, inky, clyde;
let ghosts = [];

// Global Timer Strategy (Scatter vs Chase) approx frame counts
let globalTimer = 0;
let modePhases = [
    { mode: 'SCATTER', duration: 420 }, // 7 sec
    { mode: 'CHASE', duration: 1200 },  // 20 sec
    { mode: 'SCATTER', duration: 420 },
    { mode: 'CHASE', duration: 1200 },
    { mode: 'SCATTER', duration: 300 }, // 5 sec
    { mode: 'CHASE', duration: 1200 },
    { mode: 'SCATTER', duration: 300 },
    { mode: 'CHASE', duration: Infinity }
];
let currentPhaseIndex = 0;

export function resetGame() {
    initMap();
    globalScore = 0;
    
    // Spawn exactly on integer tiles to align with % 8 === 0 grid logic
    player = new Player(14, 26); 
    
    blinky = new Ghost(13, 14, '#ff0000', 'BLINKY', {col: 25, row: 0});
    pinky = new Ghost(13, 17, '#ffb8ff', 'PINKY', {col: 2, row: 0});
    inky = new Ghost(11, 17, '#00ffff', 'INKY', {col: 27, row: 35});
    clyde = new Ghost(15, 17, '#ffb852', 'CLYDE', {col: 0, row: 35});
    
    ghosts = [blinky, pinky, inky, clyde];
    
    globalTimer = 0;
    currentPhaseIndex = 0;
    gameState = 'PLAY';
    
    const ui = document.getElementById('restart-ui');
    if(ui) ui.style.display = 'none';
}



window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'START' || gameState === 'GAMEOVER') {
            resetGame();
        }
    }
});

function updateGhostsGlobalMode() {
    let phase = modePhases[currentPhaseIndex];
    if (globalTimer > phase.duration) {
        globalTimer = 0;
        currentPhaseIndex++;
        if (currentPhaseIndex >= modePhases.length) currentPhaseIndex = modePhases.length - 1;
        
        let newMode = modePhases[currentPhaseIndex].mode;
        
        ghosts.forEach(g => {
            if (g.mode !== 'FRIGHTENED') {
                g.mode = newMode;
                // Arcade logic: reverse dir on mode change
                if (g.dir === 'UP') g.dir = 'DOWN';
                else if (g.dir === 'DOWN') g.dir = 'UP';
                else if (g.dir === 'LEFT') g.dir = 'RIGHT';
                else if (g.dir === 'RIGHT') g.dir = 'LEFT';
            }
        });
    }
}

function checkCollisions() {
    let pw = 6; // Hitbox tolerance
    ghosts.forEach(g => {
        let dx = g.x - player.x;
        let dy = g.y - player.y;
        if (Math.abs(dx) < pw && Math.abs(dy) < pw) {
            if (g.mode === 'FRIGHTENED') {
                // Eat ghost
                g.x = g.startX;
                g.y = g.startY;
                g.mode = modePhases[currentPhaseIndex].mode; // reset to global
                globalScore += 200;
            } else {
                // Death
                gameState = 'GAMEOVER';
                const ui = document.getElementById('restart-ui');
                if(ui) ui.style.display = 'block';
            }
        }
    });
}

function update() {
    if (gameState !== 'PLAY') return;

    globalTimer++;
    updateGhostsGlobalMode();

    player.update();
    
    // Check if pacman ate a power pellet
    let pCol = player.getCol();
    let pRow = player.getRow();
    // Let's implement eating logic purely here:
    if (matrix[pRow] && matrix[pRow][pCol] === 1) {
        matrix[pRow][pCol] = 3;
        player.scoreCache += 10;
    } else if (matrix[pRow] && matrix[pRow][pCol] === 2) {
        matrix[pRow][pCol] = 3;
        player.scoreCache += 50;
        // Frighten ghosts
        ghosts.forEach(g => {
            if (g.mode !== 'FRIGHTENED') {
                // Reverse dir
                if (g.dir === 'UP') g.dir = 'DOWN';
                else if (g.dir === 'DOWN') g.dir = 'UP';
                else if (g.dir === 'LEFT') g.dir = 'RIGHT';
                else if (g.dir === 'RIGHT') g.dir = 'LEFT';
            }
            g.mode = 'FRIGHTENED';
            g.frightTimer = 360; // ~6 seconds
        });
    }

    globalScore += player.scoreCache;
    player.scoreCache = 0;

    ghosts.forEach(g => g.update(player, blinky));

    checkCollisions();
}

function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'START') {
        ctx.fillStyle = '#ff0';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText("PAC-MAN", 80, 100);
        ctx.fillStyle = '#fff';
        ctx.fillText("PRESS SPACE TO RESUME", 10, 140);
        return;
    }

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = '#f00';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText("GAME OVER", 70, 140);
        return;
    }

    drawMap(ctx);
    
    // Top Score
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(`SCORE`, 10, 8);
    ctx.fillText(`${globalScore.toString().padStart(6, '0')}`, 60, 8);

    player.render(ctx);
    ghosts.forEach(g => g.render(ctx));
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

// Access reset from HTML button
window.resetGame = resetGame;

// Start
resetGame();
requestAnimationFrame(loop);
