// Game elements
const board: HTMLElement = document.getElementById("game-board") as HTMLElement;
const scoreEl: HTMLElement = document.getElementById("score") as HTMLElement;
const finalScoreEl: HTMLElement = document.getElementById("final-score") as HTMLElement;
const startScreen: HTMLElement = document.getElementById("start-screen") as HTMLElement;
const gameOverScreen: HTMLElement = document.getElementById("game-over-screen") as HTMLElement;
const pauseScreen: HTMLElement = document.getElementById("pause-screen") as HTMLElement;
const startBtn: HTMLButtonElement = document.getElementById("start-btn") as HTMLButtonElement;
const restartBtn: HTMLButtonElement = document.getElementById("restart-btn") as HTMLButtonElement;
const pauseBtn: HTMLButtonElement = document.getElementById("pause-btn") as HTMLButtonElement;
const resetBtn: HTMLButtonElement = document.getElementById("reset-btn") as HTMLButtonElement;
const resumeBtn: HTMLButtonElement = document.getElementById("resume-btn") as HTMLButtonElement;
const difficultySelect: HTMLSelectElement = document.getElementById("difficulty-select") as HTMLSelectElement;
const mobileControls: HTMLElement = document.getElementById("mobile-controls") as HTMLElement;

// Type definitions
interface Position {
    row: number;
    col: number;
}

type Direction = Position;

type FoodType = "normal" | "golden" | "poison" | "power";

type PowerType = "invincible" | "slow" | null;

interface DifficultySettings {
    [key: string]: {
        initialSpeed: number;
        speedIncrement: number;
    };
}

// Game constants and variables
const rows: number = 10;
const cols: number = 10;
let cells: HTMLElement[][] = [];
let snake: Position[] = [];
let direction: Direction = {row: 0, col: 1};
let food: Position = {row: 2, col: 2};
let foodType: FoodType = "normal";
let foodTimer: number | null = null;
let activePower: PowerType = null;
let powerTimeout: number | null = null;
let score: number = 0;
let level: number = 1;
let speed: number = 300;
let interval: number | null = null;
let gameStarted: boolean = false;
let isPaused: boolean = false;

// Difficulty settings
const difficultySettings: DifficultySettings = {
    easy: { initialSpeed: 400, speedIncrement: 40 },
    medium: { initialSpeed: 300, speedIncrement: 50 },
    hard: { initialSpeed: 200, speedIncrement: 60 }
};

// Initialize the game
function initGame(): void {
    createBoard();
    setupEventListeners();
    checkMobileDevice();
    draw();
}

// Create the game board
function createBoard(): void {
    board.innerHTML = '';
    cells = [];
    
    for (let r = 0; r < rows; r++) {
        cells[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.classList.add("hex");
            
            // Offset odd rows for honeycomb layout
            if (r % 2 !== 0) {
                cell.style.marginLeft = "25px";
            }
            
            board.appendChild(cell);
            cells[r][c] = cell;
        }
    }
}

// Set up event listeners
function setupEventListeners(): void {
    // Keyboard controls
    document.addEventListener("keydown", handleKeyDown);
    
    // Button events
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", restartGame);
    pauseBtn.addEventListener("click", togglePause);
    resetBtn.addEventListener("click", resetGame);
    resumeBtn.addEventListener("click", resumeGame);
    difficultySelect.addEventListener("change", updateDifficulty);
    
    // Mobile control buttons
    document.getElementById("up-btn")!.addEventListener("click", () => changeDirection({row: -1, col: 0}));
    document.getElementById("left-btn")!.addEventListener("click", () => changeDirection({row: 0, col: -1}));
    document.getElementById("right-btn")!.addEventListener("click", () => changeDirection({row: 0, col: 1}));
    document.getElementById("down-btn")!.addEventListener("click", () => changeDirection({row: 1, col: 0}));
}

// Handle keyboard input
function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "p" || e.key === " ") {
        togglePause();
        return;
    }
    
    if (isPaused) return;
    
    const headDir = direction;
    switch(e.key) {
        case "w": case "ArrowUp": 
            if(headDir.row !== 1) changeDirection({row: -1, col: 0}); 
            break;
        case "a": case "ArrowLeft": 
            if(headDir.col !== 1) changeDirection({row: 0, col: -1}); 
            break;
        case "d": case "ArrowRight": 
            if(headDir.col !== -1) changeDirection({row: 0, col: 1}); 
            break;
        case "x": case "ArrowDown": 
            if(headDir.row !== -1) changeDirection({row: 1, col: 0}); 
            break;
    }
    
    // Start game on first key press if not started
    if (!gameStarted && e.key.includes("Arrow")) {
        startGame();
    }
}

// Change direction with validation
function changeDirection(newDir: Direction): void {
    // Prevent 180-degree turns
    if (newDir.row === -direction.row && newDir.col === -direction.col) {
        return;
    }
    direction = newDir;
}

// Start the game
function startGame(): void {
    if (gameStarted) return;
    
    // Reset game state
    snake = [{row: 5, col: 5}];
    direction = {row: 0, col: 1};
    score = 0;
    level = 1;
    
    // Set speed based on difficulty
    const difficulty = difficultySelect.value;
    speed = difficultySettings[difficulty].initialSpeed;
    
    placeFood();
    updateScore();
    
    // Hide start screen, show game
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    
    // Enable control buttons
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    // Start game loop
    gameStarted = true;
    isPaused = false;
    if (interval) clearInterval(interval);
    interval = setInterval(moveSnake, speed) as unknown as number;
}

// Restart the game
function restartGame(): void {
    if (interval) clearInterval(interval);
    gameOverScreen.classList.add("hidden");
    startGame();
}

// Reset the game
function resetGame(): void {
    if (interval) clearInterval(interval);
    gameStarted = false;
    isPaused = false;
    
    // Reset UI
    startScreen.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    
    // Disable control buttons
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Reset and draw initial state
    snake = [{row: 5, col: 5}];
    direction = {row: 0, col: 1};
    draw();
}

// Toggle pause
function togglePause(): void {
    if (!gameStarted) return;
    
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Pause the game
function pauseGame(): void {
    if (interval) clearInterval(interval);
    isPaused = true;
    pauseScreen.classList.remove("hidden");
    pauseBtn.textContent = "Resume";
}

// Resume the game
function resumeGame(): void {
    isPaused = false;
    pauseScreen.classList.add("hidden");
    pauseBtn.textContent = "Pause";
    interval = setInterval(moveSnake, speed) as unknown as number;
}

// Update difficulty
function updateDifficulty(): void {
    if (!gameStarted) return;
    
    const difficulty = difficultySelect.value;
    speed = difficultySettings[difficulty].initialSpeed;
    
    if (!isPaused) {
        if (interval) clearInterval(interval);
        interval = setInterval(moveSnake, speed) as unknown as number;
    }
}

// Check if device is mobile and show controls
function checkMobileDevice(): void {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        mobileControls.classList.remove("hidden");
        document.querySelector('.mobile-controls-info')!.classList.remove("hidden");
    }
}

// Draw snake and food
function draw(): void {
    // Clear the board
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cells[r][c].classList.remove("snake", "snake-head", "food");
        }
    }
    
    // Draw snake
    snake.forEach((seg, index) => {
        if (index === 0) {
            cells[seg.row][seg.col].classList.add("snake-head");
        } else {
            cells[seg.row][seg.col].classList.add("snake");
        }
    });
    
    // Draw food with type
    cells[food.row][food.col].classList.add("food");
    if (foodType === "golden") {
        cells[food.row][food.col].classList.add("food-golden");
    } else if (foodType === "poison") {
        cells[food.row][food.col].classList.add("food-poison");
    } else if (foodType === "power") {
        cells[food.row][food.col].classList.add("food-power");
    }
}

// Place food randomly
function placeFood(): void {
    let r: number, c: number;
    do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
    } while (snake.some(seg => seg.row === r && seg.col === c));

    food = {row: r, col: c};

    // Randomize food type
    const rand = Math.random();
    if (rand < 0.7) {
        foodType = "normal";
    } else if (rand < 0.85) {
        foodType = "golden";
        if (foodTimer) clearTimeout(foodTimer);
        foodTimer = setTimeout(() => {
            if (foodType === "golden") placeFood(); // remove if not eaten
        }, 5000) as unknown as number;
    } else if (rand < 0.95) {
        foodType = "poison";
    } else {
        foodType = "power";
    }
}

// Update score display
function updateScore(): void {
    scoreEl.textContent = `Score: ${score} | Level: ${level}`;
}

// Update speed and level
function updateSpeed(): void {
    const difficulty = difficultySelect.value;
    const speedIncrement = difficultySettings[difficulty].speedIncrement;
    
    if (score >= 50 && level === 1) {
        speed -= speedIncrement;
        level = 2;
        restartInterval();
    } else if (score >= 100 && level === 2) {
        speed -= speedIncrement;
        level = 3;
        restartInterval();
    } else if (score >= 200 && level === 3) {
        speed -= speedIncrement;
        level = 4;
        restartInterval();
    }
}

// Restart interval with new speed
function restartInterval(): void {
    if (interval) clearInterval(interval);
    interval = setInterval(moveSnake, speed) as unknown as number;
}

// Move snake
function moveSnake(): void {
    const head: Position = {row: snake[0].row + direction.row, col: snake[0].col + direction.col};

    // Wrap around edges
    if (head.row < 0) head.row = rows - 1;
    if (head.row >= rows) head.row = 0;
    if (head.col < 0) head.col = cols - 1;
    if (head.col >= cols) head.col = 0;

    // Check for collision with self
    if (snake.some(seg => seg.row === head.row && seg.col === head.col)) {
        if (activePower !== "invincible") {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

  // Eat food
if (head.row === food.row && head.col === food.col) {
    if (foodType === "normal") {
        score += 10;
        growSnake(1 + Math.floor(Math.random() * 3)); // grow 1–3
    } else if (foodType === "golden") {
        score += 50;
        growSnake(3); // golden grows more
    } else if (foodType === "poison") {
        score = Math.max(0, score - 20);
        snake.splice(-2, 2); // remove last 2 segments
        if (snake.length < 1) {
            gameOver();
            return;
        }
    } else if (foodType === "power") {
        const powers: PowerType[] = ["invincible", "slow"];
        activePower = powers[Math.floor(Math.random() * powers.length)];
        applyPowerUp(activePower!);
    }

    // Update score immediately after changing it
    updateScore();
    
    placeFood();
    updateSpeed();

    // Visual effect
    cells[food.row][food.col].classList.add("food-eaten");
    setTimeout(() => {
        cells[food.row][food.col].classList.remove("food-eaten");
    }, 200);
} else {
    snake.pop();
}

// Keep this updateScore call for cases where score might change elsewhere
updateScore();
draw();
}

// Game over
function gameOver(): void {
    if (interval) clearInterval(interval);
    gameStarted = false;
    
    // Update final score
    finalScoreEl.textContent = score.toString();
    
    // Show game over screen
    gameOverScreen.classList.remove("hidden");
    
    // Disable control buttons
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
}

// Grow snake by N segments
function growSnake(n: number): void {
    for (let i = 0; i < n; i++) {
        snake.push({...snake[snake.length - 1]});
    }
}

// Power-up effects
function applyPowerUp(type: Exclude<PowerType, null>): void {
    if (powerTimeout) clearTimeout(powerTimeout);

    if (type === "invincible") {
        // temporarily ignore self-collisions
        powerTimeout = setTimeout(() => activePower = null, 8000) as unknown as number;
    } else if (type === "slow") {
        if (interval) clearInterval(interval);
        interval = setInterval(moveSnake, speed * 1.5) as unknown as number;
        powerTimeout = setTimeout(() => {
            activePower = null;
            if (interval) clearInterval(interval);
            interval = setInterval(moveSnake, speed) as unknown as number;
        }, 8000) as unknown as number;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);