var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// Game elements
var board = document.getElementById("game-board");
var scoreEl = document.getElementById("score");
var finalScoreEl = document.getElementById("final-score");
var startScreen = document.getElementById("start-screen");
var gameOverScreen = document.getElementById("game-over-screen");
var pauseScreen = document.getElementById("pause-screen");
var startBtn = document.getElementById("start-btn");
var restartBtn = document.getElementById("restart-btn");
var pauseBtn = document.getElementById("pause-btn");
var resetBtn = document.getElementById("reset-btn");
var resumeBtn = document.getElementById("resume-btn");
var difficultySelect = document.getElementById("difficulty-select");
var mobileControls = document.getElementById("mobile-controls");
var lastMoveTime = 0;
var minMoveInterval = 50; // milliseconds
var powerUpEndTime = 0;
var powerUpDuration = 8000;
var highScore = 0;
// Game constants and variables
var rows = 10;
var cols = 10;
var cells = [];
var snake = [];
var direction = { row: 0, col: 1 };
var food = { row: 2, col: 2 };
var foodType = "normal";
var foodTimer = null;
var activePower = null;
var powerTimeout = null;
var score = 0;
var level = 1;
var speed = 300;
var interval = null;
var gameStarted = false;
var isPaused = false;
// Difficulty settings
var difficultySettings = {
    easy: { initialSpeed: 400, speedIncrement: 40 },
    medium: { initialSpeed: 300, speedIncrement: 50 },
    hard: { initialSpeed: 200, speedIncrement: 60 }
};
// Initialize the game
function initGame() {
    createBoard();
    setupEventListeners();
    checkMobileDevice();
    draw();
}
// Create the game board
function createBoard() {
    board.innerHTML = '';
    cells = [];
    for (var r = 0; r < rows; r++) {
        cells[r] = [];
        for (var c = 0; c < cols; c++) {
            var cell = document.createElement("div");
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
// Load high score on game start
function loadHighScore() {
    var saved = localStorage.getItem('snakeHighScore');
    highScore = saved ? parseInt(saved) : 0;
    updateHighScoreDisplay();
}
function updateHighScoreDisplay() {
    var highScoreEl = document.getElementById("high-score");
    highScoreEl.textContent = highScore.toString();
}
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore.toString());
        updateHighScoreDisplay();
    }
}
// Set up event listeners
function setupEventListeners() {
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
    document.getElementById("up-btn").addEventListener("click", function () { return changeDirection({ row: -1, col: 0 }); });
    document.getElementById("left-btn").addEventListener("click", function () { return changeDirection({ row: 0, col: -1 }); });
    document.getElementById("right-btn").addEventListener("click", function () { return changeDirection({ row: 0, col: 1 }); });
    document.getElementById("down-btn").addEventListener("click", function () { return changeDirection({ row: 1, col: 0 }); });
}
// Handle keyboard input
function handleKeyDown(e) {
    if (e.key === "p" || e.key === " ") {
        togglePause();
        return;
    }
    if (isPaused)
        return;
    var headDir = direction;
    switch (e.key) {
        case "w":
        case "ArrowUp":
            if (headDir.row !== 1)
                changeDirection({ row: -1, col: 0 });
            break;
        case "a":
        case "ArrowLeft":
            if (headDir.col !== 1)
                changeDirection({ row: 0, col: -1 });
            break;
        case "d":
        case "ArrowRight":
            if (headDir.col !== -1)
                changeDirection({ row: 0, col: 1 });
            break;
        case "x":
        case "ArrowDown":
            if (headDir.row !== -1)
                changeDirection({ row: 1, col: 0 });
            break;
    }
    // Start game on first key press if not started
    if (!gameStarted && e.key.includes("Arrow")) {
        startGame();
    }
}
// Change direction with validation
function changeDirection(newDir) {
    // Prevent 180-degree turns
    if (newDir.row === -direction.row && newDir.col === -direction.col) {
        return;
    }
    direction = newDir;
}
// Start the game
function startGame() {
    if (gameStarted)
        return;
    // Reset game state
    snake = [{ row: 5, col: 5 }];
    direction = { row: 0, col: 1 };
    score = 0;
    level = 1;
    // Set speed based on difficulty
    var difficulty = difficultySelect.value;
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
    if (interval)
        clearInterval(interval);
    interval = setInterval(moveSnake, speed);
}
// Restart the game
function restartGame() {
    if (interval)
        clearInterval(interval);
    gameOverScreen.classList.add("hidden");
    startGame();
}
// Reset the game
function resetGame() {
    if (interval)
        clearInterval(interval);
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
    snake = [{ row: 5, col: 5 }];
    direction = { row: 0, col: 1 };
    draw();
}
// Toggle pause
function togglePause() {
    if (!gameStarted)
        return;
    if (isPaused) {
        resumeGame();
    }
    else {
        pauseGame();
    }
}
// Pause the game
function pauseGame() {
    if (interval)
        clearInterval(interval);
    isPaused = true;
    pauseScreen.classList.remove("hidden");
    pauseBtn.textContent = "Resume";
}
// Resume the game
function resumeGame() {
    isPaused = false;
    pauseScreen.classList.add("hidden");
    pauseBtn.textContent = "Pause";
    interval = setInterval(moveSnake, speed);
}
// Update difficulty
function updateDifficulty() {
    if (!gameStarted)
        return;
    var difficulty = difficultySelect.value;
    speed = difficultySettings[difficulty].initialSpeed;
    if (!isPaused) {
        if (interval)
            clearInterval(interval);
        interval = setInterval(moveSnake, speed);
    }
}
// Check if device is mobile and show controls
function checkMobileDevice() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        mobileControls.classList.remove("hidden");
        document.querySelector('.mobile-controls-info').classList.remove("hidden");
    }
}
// Draw snake and food
function draw() {
    // Clear the board
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            cells[r][c].classList.remove("snake", "snake-head", "food");
        }
    }
    // Draw snake
    snake.forEach(function (seg, index) {
        if (index === 0) {
            cells[seg.row][seg.col].classList.add("snake-head");
        }
        else {
            cells[seg.row][seg.col].classList.add("snake");
        }
    });
    // Draw food with type
    cells[food.row][food.col].classList.add("food");
    if (foodType === "golden") {
        cells[food.row][food.col].classList.add("food-golden");
    }
    else if (foodType === "poison") {
        cells[food.row][food.col].classList.add("food-poison");
    }
    else if (foodType === "power") {
        cells[food.row][food.col].classList.add("food-power");
    }
}
// Place food randomly
function placeFood() {
    var r, c;
    do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
    } while (snake.some(function (seg) { return seg.row === r && seg.col === c; }));
    food = { row: r, col: c };
    // Randomize food type
    var rand = Math.random();
    if (rand < 0.7) {
        foodType = "normal";
    }
    else if (rand < 0.85) {
        foodType = "golden";
        if (foodTimer)
            clearTimeout(foodTimer);
        foodTimer = setTimeout(function () {
            if (foodType === "golden")
                placeFood(); // remove if not eaten
        }, 5000);
    }
    else if (rand < 0.95) {
        foodType = "poison";
    }
    else {
        foodType = "power";
    }
}
// Update score display
function updateScore() {
    scoreEl.textContent = "Score: ".concat(score, " | Level: ").concat(level);
}
// Update speed and level
function updateSpeed() {
    var difficulty = difficultySelect.value;
    var speedIncrement = difficultySettings[difficulty].speedIncrement;
    if (score >= 50 && level === 1) {
        speed -= speedIncrement;
        level = 2;
        restartInterval();
    }
    else if (score >= 100 && level === 2) {
        speed -= speedIncrement;
        level = 3;
        restartInterval();
    }
    else if (score >= 200 && level === 3) {
        speed -= speedIncrement;
        level = 4;
        restartInterval();
    }
}
// Restart interval with new speed
function restartInterval() {
    if (interval)
        clearInterval(interval);
    interval = setInterval(moveSnake, speed);
}
// Move snake
function moveSnake() {
    var now = Date.now();
    if (now - lastMoveTime < minMoveInterval)
        return;
    lastMoveTime = now;
    var head = { row: snake[0].row + direction.row, col: snake[0].col + direction.col };
    // Wrap around edges
    if (head.row < 0)
        head.row = rows - 1;
    if (head.row >= rows)
        head.row = 0;
    if (head.col < 0)
        head.col = cols - 1;
    if (head.col >= cols)
        head.col = 0;
    // Check for collision with self
    if (snake.some(function (seg) { return seg.row === head.row && seg.col === head.col; })) {
        if (activePower !== "invincible") {
            gameOver();
            return;
        }
    }
    snake.unshift(head);
    // Eat food
    if (head.row === food.row && head.col === food.col) {
        if (foodType === "normal" || foodType === "golden") {
            playSound("eat-sound");
        }
        else if (foodType === "power") {
            playSound("power-up-sound");
        }
        if (foodType === "normal") {
            score += 10;
            growSnake(1 + Math.floor(Math.random() * 3)); // grow 1–3
        }
        else if (foodType === "golden") {
            score += 50;
            growSnake(3); // golden grows more
        }
        else if (foodType === "poison") {
            score = Math.max(0, score - 20);
            snake.splice(-2, 2); // remove last 2 segments
            if (snake.length < 1) {
                gameOver();
                return;
            }
        }
        else if (foodType === "power") {
            var powers = ["invincible", "slow"];
            activePower = powers[Math.floor(Math.random() * powers.length)];
            applyPowerUp(activePower);
        }
        // Update score immediately after changing it
        updateScore();
        placeFood();
        updateSpeed();
        // Visual effect
        cells[food.row][food.col].classList.add("food-eaten");
        setTimeout(function () {
            cells[food.row][food.col].classList.remove("food-eaten");
        }, 200);
    }
    else {
        snake.pop();
    }
    // Keep this updateScore call for cases where score might change elsewhere
    updateScore();
    draw();
}
// Game over
function gameOver() {
    // Visual feedback before ending game
    snake.forEach(function (seg, index) {
        var cell = cells[seg.row][seg.col];
        if (index === 0) {
            cell.classList.add("collision-effect");
        }
        else {
            cell.classList.add("snake-hit");
        }
    });
    // Delay the actual game over to show animations
    setTimeout(function () {
        if (interval)
            clearInterval(interval);
        gameStarted = false;
        // Update final score
        finalScoreEl.textContent = score.toString();
        // Save high score and play sound
        saveHighScore();
        playSound("game-over-sound");
        // Show game over screen
        gameOverScreen.classList.remove("hidden");
        // Disable control buttons
        pauseBtn.disabled = true;
        resetBtn.disabled = false;
    }, 500); // 500ms delay to show the animation
}
// Grow snake by N segments
function growSnake(n) {
    for (var i = 0; i < n; i++) {
        snake.push(__assign({}, snake[snake.length - 1]));
    }
}
// Power-up effects
function applyPowerUp(type) {
    if (powerTimeout)
        clearTimeout(powerTimeout);
    activePower = type;
    powerUpEndTime = Date.now() + powerUpDuration;
    // Show power-up indicator
    var indicator = document.getElementById("power-up-indicator");
    var powerText = document.getElementById("active-power-text");
    indicator.classList.remove("hidden", "invincible", "slow");
    indicator.classList.add(type);
    powerText.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    updatePowerUpDisplay();
    if (type === "invincible") {
        powerTimeout = setTimeout(function () {
            activePower = null;
            indicator.classList.add("hidden");
        }, powerUpDuration);
    }
    else if (type === "slow") {
        if (interval)
            clearInterval(interval);
        interval = setInterval(moveSnake, speed * 1.5);
        powerTimeout = setTimeout(function () {
            activePower = null;
            indicator.classList.add("hidden");
            if (interval)
                clearInterval(interval);
            interval = setInterval(moveSnake, speed);
        }, powerUpDuration);
    }
}
function updatePowerUpDisplay() {
    if (!activePower)
        return;
    var timeLeft = Math.max(0, powerUpEndTime - Date.now());
    var secondsLeft = Math.ceil(timeLeft / 1000);
    var timerEl = document.getElementById("power-timer");
    timerEl.textContent = "(".concat(secondsLeft, "s)");
    if (timeLeft > 0) {
        requestAnimationFrame(updatePowerUpDisplay);
    }
}
// Sound functions
function playSound(soundId) {
    var sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(function (e) { return console.log("Audio play failed:", e); });
    }
}
// Initialize the game when the page loads
window.addEventListener('load', function () {
    initGame();
    loadHighScore();
});
