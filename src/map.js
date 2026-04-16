// 28 columns x 36 rows
// # = Wall (0)
// . = Dot (1)
// o = Power Pellet (2)
// [space] = Empty (3)
// - = Ghost House Door (4)

const mapLayout = [
    "############################",
    "############################",
    "############################",
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##### ## #####.#     ",
    "     #.##          ##.#     ",
    "     #.## ###--### ##.#     ",
    "######.## #      # ##.######",
    "      .   #      #   .      ",
    "######.## #      # ##.######",
    "     #.## ######## ##.#     ",
    "     #.##          ##.#     ",
    "     #.## ######## ##.#     ",
    "######.## ######## ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#.####.#####.##.#####.####.#",
    "#o..##.......  .......##..o#",
    "###.##.##.########.##.##.###",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################",
    "############################",
    "############################"
];

export const TILE_SIZE = 8;
export const matrix = [];

export function initMap() {
    matrix.length = 0; // Clear for restarts
    for (let r = 0; r < mapLayout.length; r++) {
        let row = [];
        for (let c = 0; c < mapLayout[r].length; c++) {
            let char = mapLayout[r][c];
            if (char === '#') row.push(0);
            else if (char === '.') row.push(1);
            else if (char === 'o') row.push(2);
            else if (char === ' ') row.push(3);
            else if (char === '-') row.push(4); // Door
            else row.push(3);
        }
        matrix.push(row);
    }
}

export function drawMap(ctx) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            let val = matrix[r][c];
            let x = c * TILE_SIZE;
            let y = r * TILE_SIZE;

            if (val === 0) {
                // Draw Neon Blue Wall Block
                ctx.fillStyle = '#1919A6'; // Deep retro blue
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                // Inner border to make it look like a tube
                ctx.strokeStyle = '#0000FF'; 
                ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
            } else if (val === 1) {
                // Pac-dot
                ctx.fillStyle = '#ffb8ae';
                ctx.fillRect(x + 3, y + 3, 2, 2);
            } else if (val === 2) {
                // Power Pellet (make it flash later, just draw big circle for now)
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x + 4, y + 4, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (val === 4) {
                // Door
                ctx.fillStyle = '#ffb8ff'; // Pinkish door
                ctx.fillRect(x, y + 3, TILE_SIZE, 2);
            }
        }
    }
}

export function isWall(col, row, isGhost = false) {
    if (row < 0 || row >= matrix.length || col < 0 || col >= matrix[0].length) {
        // Assume out of bounds is empty (for the lateral warp tunnels)
        return false; 
    }
    let val = matrix[row][col];
    if (val === 0) return true;
    if (!isGhost && val === 4) return true; // Pacman can't pass ghost door
    return false;
}
