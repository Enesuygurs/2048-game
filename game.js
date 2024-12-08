class Game2048 {
    constructor() {
        this.gridSize = parseInt(localStorage.getItem('gridSize')) || 4;
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.bestScoreElement = document.getElementById('best-score');
        this.bestScoreElement.textContent = this.bestScore;
        this.gameOver = false;
        this.gameWon = false;
        this.moves = 0;
        this.startTime = Date.now();
        this.timerInterval = null;
        this.previousStates = [];
        this.currentTheme = localStorage.getItem('theme') || 'light';

        // DOM elements
        this.gridElement = document.querySelector('.grid');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('game-over');
        this.gameWinElement = document.getElementById('game-win');
        this.movesElement = document.getElementById('moves');
        this.timeElement = document.getElementById('time');
        this.undoButton = document.getElementById('undo-button');
        this.themeToggle = document.getElementById('theme-toggle');
        this.gridSizeSelect = document.getElementById('grid-size');

        // Initialize settings
        this.gridSizeSelect.value = this.gridSize;

        // Initialize theme
        document.body.setAttribute('data-theme', this.currentTheme);
        this.themeToggle.textContent = this.currentTheme === 'light' ? '☀️' : '🌙';

        this.setupEventListeners();
        this.startTimer();
        this.spawnTile();
        this.spawnTile();
        this.renderGrid();
    }

    setupEventListeners() {
        // Touch controls
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Button controls
        document.getElementById('up-btn').addEventListener('click', () => this.move('up'));
        document.getElementById('down-btn').addEventListener('click', () => this.move('down'));
        document.getElementById('left-btn').addEventListener('click', () => this.move('left'));
        document.getElementById('right-btn').addEventListener('click', () => this.move('right'));

        // Theme toggle
        this.themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', this.currentTheme);
            this.themeToggle.textContent = this.currentTheme === 'light' ? '☀️' : '🌙';
            localStorage.setItem('theme', this.currentTheme);
        });

        // Undo button
        this.undoButton.addEventListener('click', () => {
            if (this.previousStates.length > 0) {
                const previousState = this.previousStates.pop();
                this.grid = previousState.grid.map(row => [...row]);
                this.score = previousState.score;
                this.moves--;
                this.renderGrid();
                this.updateScore();
                this.updateMoves();
                this.undoButton.disabled = this.previousStates.length === 0;
            }
        });

        // Restart buttons (both in header and game over screen)
        document.getElementById('restart-button').addEventListener('click', () => this.resetGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());

        // Win screen buttons
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.gameWinElement.style.display = 'none';
            this.gameWon = false;  // Allow the game to continue
        });

        document.getElementById('win-restart-btn').addEventListener('click', () => {
            this.resetGame();
        });

        this.gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            localStorage.setItem('gridSize', this.gridSize);
            this.resetGame();
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    updateMoves() {
        this.movesElement.textContent = this.moves;
    }

    savePreviousState() {
        this.previousStates.push({
            grid: this.grid.map(row => [...row]),
            score: this.score
        });
        if (this.previousStates.length > 5) {
            this.previousStates.shift();
        }
        this.undoButton.disabled = false;
    }

    renderGrid() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const tile = document.createElement('div');
                tile.className = this.grid[i][j] === 0 ? 'tile' : `tile tile-${this.grid[i][j]}`;
                tile.textContent = this.grid[i][j] || '';
                cell.appendChild(tile);
                this.gridElement.appendChild(cell);
            }
        }
    }

    spawnTile() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ x: i, y: j });
                }
            }
        }
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(direction) {
        if (this.gameOver) return;
        
        this.savePreviousState();
        let moved = false;
        let mergedValue = 0;

        const rotateGrid = () => {
            const newGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    newGrid[i][j] = this.grid[this.gridSize-j-1][i];
                }
            }
            this.grid = newGrid;
        };

        const moveLeft = () => {
            for (let i = 0; i < this.gridSize; i++) {
                let row = this.grid[i].filter(cell => cell !== 0);
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1]) {
                        row[j] *= 2;
                        mergedValue = Math.max(mergedValue, row[j]);
                        this.score += row[j];
                        row.splice(j + 1, 1);
                        moved = true;
                    }
                }
                while (row.length < this.gridSize) row.push(0);
                if (row.join(',') !== this.grid[i].join(',')) {
                    moved = true;
                }
                this.grid[i] = row;
            }
        };

        // Rotate grid to match direction
        if (direction === 'up') {
            rotateGrid();
            rotateGrid();
            rotateGrid();
        } else if (direction === 'right') {
            rotateGrid();
            rotateGrid();
        } else if (direction === 'down') {
            rotateGrid();
        }

        moveLeft();

        // Rotate back
        if (direction === 'up') {
            rotateGrid();
        } else if (direction === 'right') {
            rotateGrid();
            rotateGrid();
        } else if (direction === 'down') {
            rotateGrid();
            rotateGrid();
            rotateGrid();
        }

        if (moved) {
            this.moves++;
            this.updateMoves();
            this.undoButton.disabled = false;
            this.spawnTile();
            this.updateScore();
            this.renderGrid();
            this.checkWin(mergedValue);
            if (!this.gameWon) {
                this.checkGameOver();
            }
        }
    }

    checkWin(value) {
        if (!this.gameWon && value >= 2048) {
            this.gameWon = true;
            document.getElementById('win-score').textContent = this.score;
            this.gameWinElement.style.display = 'flex';
        }
    }

    checkGameOver() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) return false;
                if (i < this.gridSize - 1 && this.grid[i][j] === this.grid[i + 1][j]) return false;
                if (j < this.gridSize - 1 && this.grid[i][j] === this.grid[i][j + 1]) return false;
            }
        }
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.undoButton.disabled = true;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'flex';
        return true;
    }

    resetGame() {
        clearInterval(this.timerInterval);
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.moves = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.startTime = Date.now();
        this.previousStates = [];
        this.undoButton.disabled = true;
        this.gameOverElement.style.display = 'none';
        this.gameWinElement.style.display = 'none';
        this.updateScore();
        this.updateMoves();
        this.startTimer();
        this.spawnTile();
        this.spawnTile();
        this.renderGrid();
    }

    handleKeyDown(event) {
        switch(event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.move('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.move('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.move('left');
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.move('right');
                break;
        }
    }

    handleTouchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    handleTouchMove(event) {
        if (!this.touchStartX || !this.touchStartY) return;

        const touchEndX = event.touches[0].clientX;
        const touchEndY = event.touches[0].clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.move('right');
            } else {
                this.move('left');
            }
        } else {
            if (deltaY > 0) {
                this.move('down');
            } else {
                this.move('up');
            }
        }

        this.touchStartX = null;
        this.touchStartY = null;
    }
}

// Start the game
new Game2048();
