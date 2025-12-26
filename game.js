// ==================== 游戏配置 ====================
const GRID_SIZE = 25;
const CANVAS_SIZE = 600;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// ==================== 游戏状态 ====================
let gameState = {
    snake: [{ x: 12, y: 12 }],
    food: { x: 18, y: 18 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    isRunning: false,
    isPaused: false,
    speed: 10
};

let gameLoop = null;

// ==================== DOM 元素 ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// ==================== 初始化 ====================
function init() {
    highScoreDisplay.textContent = gameState.highScore;
    setupEventListeners();
    draw();
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyPress);
    
    speedSlider.addEventListener('input', (e) => {
        gameState.speed = parseInt(e.target.value);
        speedValue.textContent = gameState.speed;
        if (gameState.isRunning && !gameState.isPaused) {
            clearInterval(gameLoop);
            startGameLoop();
        }
    });

    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
}

// ==================== 键盘控制 ====================
function handleKeyPress(e) {
    if (!gameState.isRunning) return;

    const key = e.key.toLowerCase();
    
    // 方向键控制
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (gameState.direction.y === 0) gameState.nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (gameState.direction.y === 0) gameState.nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (gameState.direction.x === 0) gameState.nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (gameState.direction.x === 0) gameState.nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
        case ' ':
            togglePause();
            e.preventDefault();
            break;
    }
}

// ==================== 游戏主逻辑 ====================
function startGame() {
    if (gameState.isRunning) return;
    
    gameState.isRunning = true;
    gameState.isPaused = false;
    updateUI();
    startGameLoop();
}

function startGameLoop() {
    // 计算间隔时间（速度越高，间隔越短）
    const interval = Math.max(50, 300 - (gameState.speed - 1) * 13);
    gameLoop = setInterval(update, interval);
}

function togglePause() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameLoop);
    } else {
        startGameLoop();
    }
    
    updateUI();
}

function resetGame() {
    clearInterval(gameLoop);
    gameState = {
        snake: [{ x: 12, y: 12 }],
        food: { x: 18, y: 18 },
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        score: 0,
        highScore: gameState.highScore,
        isRunning: false,
        isPaused: false,
        speed: gameState.speed
    };
    updateUI();
    draw();
}

function update() {
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 计算新的头部位置
    const head = gameState.snake[0];
    const newHead = {
        x: head.x + gameState.direction.x,
        y: head.y + gameState.direction.y
    };

    // 检查碰撞 - 墙壁
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || 
        newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame();
        return;
    }

    // 检查碰撞 - 自身
    if (gameState.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
    }

    // 添加新头部
    gameState.snake.unshift(newHead);

    // 检查是否吃到食物
    if (newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        gameState.score += 10;
        scoreDisplay.textContent = gameState.score;
        generateFood();
    } else {
        // 如果没有吃到食物，移除尾部
        gameState.snake.pop();
    }

    draw();
}

function endGame() {
    clearInterval(gameLoop);
    gameState.isRunning = false;
    
    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        highScoreDisplay.textContent = gameState.highScore;
        localStorage.setItem('snakeHighScore', gameState.highScore);
    }
    
    updateUI();
    
    // 显示游戏结束信息
    setTimeout(() => {
        alert(`游戏结束！\n最终分数: ${gameState.score}\n最高分: ${gameState.highScore}`);
    }, 100);
}

// ==================== 食物生成 ====================
function generateFood() {
    let newFood;
    let foodOnSnake = true;
    
    while (foodOnSnake) {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        foodOnSnake = gameState.snake.some(
            segment => segment.x === newFood.x && segment.y === newFood.y
        );
    }
    
    gameState.food = newFood;
}

// ==================== 绘制 ====================
function draw() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 绘制网格（可选，增强视觉效果）
    drawGrid();

    // 绘制蛇
    drawSnake();

    // 绘制食物
    drawFood();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * CELL_SIZE;
        
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
    }
}

function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        // 头部颜色渐变
        if (index === 0) {
            ctx.fillStyle = '#51cf66';
            ctx.shadowColor = 'rgba(81, 207, 102, 0.8)';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#40c057';
            ctx.shadowColor = 'none';
        }

        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        
        // 绘制圆角矩形
        const radius = CELL_SIZE / 5;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + CELL_SIZE - radius, y);
        ctx.quadraticCurveTo(x + CELL_SIZE, y, x + CELL_SIZE, y + radius);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE - radius);
        ctx.quadraticCurveTo(x + CELL_SIZE, y + CELL_SIZE, x + CELL_SIZE - radius, y + CELL_SIZE);
        ctx.lineTo(x + radius, y + CELL_SIZE);
        ctx.quadraticCurveTo(x, y + CELL_SIZE, x, y + CELL_SIZE - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // 绘制眼睛（仅头部）
        if (index === 0) {
            ctx.shadowColor = 'none';
            ctx.fillStyle = '#fff';
            const eyeSize = CELL_SIZE / 8;
            const eyeOffset = CELL_SIZE / 4;
            
            // 根据方向绘制眼睛
            if (gameState.direction.x === 1) { // 向右
                ctx.fillRect(x + eyeOffset * 2.5, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset * 2.5, y + eyeOffset * 2, eyeSize, eyeSize);
            } else if (gameState.direction.x === -1) { // 向左
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset, y + eyeOffset * 2, eyeSize, eyeSize);
            } else if (gameState.direction.y === -1) { // 向上
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset * 2, y + eyeOffset, eyeSize, eyeSize);
            } else if (gameState.direction.y === 1) { // 向下
                ctx.fillRect(x + eyeOffset, y + eyeOffset * 2.5, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset * 2, y + eyeOffset * 2.5, eyeSize, eyeSize);
            }
        }
    });
}

function drawFood() {
    const x = gameState.food.x * CELL_SIZE;
    const y = gameState.food.y * CELL_SIZE;
    
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = 'rgba(255, 107, 107, 0.8)';
    ctx.shadowBlur = 10;
    
    // 绘制圆形食物
    ctx.beginPath();
    ctx.arc(
        x + CELL_SIZE / 2,
        y + CELL_SIZE / 2,
        CELL_SIZE / 2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 添加高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
        x + CELL_SIZE / 3,
        y + CELL_SIZE / 3,
        CELL_SIZE / 6,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowColor = 'none';
}

// ==================== UI 更新 ====================
function updateUI() {
    // 更新按钮状态
    startBtn.disabled = gameState.isRunning;
    pauseBtn.disabled = !gameState.isRunning;
    
    // 更新状态显示
    if (!gameState.isRunning) {
        statusDisplay.textContent = '已停止';
        statusDisplay.className = 'value status-stopped';
    } else if (gameState.isPaused) {
        statusDisplay.textContent = '暂停中';
        statusDisplay.className = 'value status-paused';
    } else {
        statusDisplay.textContent = '进行中';
        statusDisplay.className = 'value status-running';
    }
    
    // 更新分数显示
    scoreDisplay.textContent = gameState.score;
}

// ==================== 页面加载时初始化 ====================
window.addEventListener('load', init);

// ==================== 页面离开时清理 ====================
window.addEventListener('beforeunload', () => {
    if (gameState.isRunning) {
        clearInterval(gameLoop);
    }
});
