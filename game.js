class Llama {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpForce = -12;
        this.minGravity = 0.2;  // Gravity when holding up
        this.normalGravity = 0.5;  // Normal gravity
        this.isHoldingUp = false;
        this.isJumping = false;
        this.groundY = 650;
        this.velocityX = 0;
        this.speed = 5;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }
    }

    update() {
        // Update horizontal position
        this.x += this.velocityX;
        
        // Keep llama within canvas bounds
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;

        // Apply reduced gravity when holding up and moving upward
        if (this.isHoldingUp && this.velocityY < 0) {
            this.gravity = this.minGravity;
        } else {
            this.gravity = this.normalGravity;
        }

        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }
    }

    draw(ctx) {
        // Draw llama body
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
        
        // Draw llama head
        ctx.fillRect(this.x + this.width - 10, this.y - this.height - 20, 20, 20);
        
        // Draw llama neck
        ctx.fillRect(this.x + this.width - 5, this.y - this.height, 10, 20);
        
        // Draw llama legs
        ctx.fillRect(this.x + 5, this.y - 20, 8, 20);
        ctx.fillRect(this.x + this.width - 15, this.y - 20, 8, 20);
    }
}

class Obstacle {
    constructor(x) {
        this.x = x;
        this.width = 30;
        this.height = 40;
        this.groundY = 650;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
    }

    draw(ctx) {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x, this.groundY - this.height, this.width, this.height);
    }

    collidesWith(llama) {
        return !(this.x > llama.x + llama.width || 
                this.x + this.width < llama.x || 
                this.groundY - this.height > llama.y);
    }
}

class Star {
    constructor(x) {
        this.x = x;
        // Random height between ground level - 200 (high jump) and ground level - 50 (just above ground)
        const groundLevel = 650;
        const minHeight = 50;  // minimum height from ground
        const maxHeight = 200; // maximum height from ground
        this.y = groundLevel - minHeight - Math.random() * (maxHeight - minHeight);
        this.width = 20;
        this.height = 20;
        this.collected = false;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
    }

    draw(ctx) {
        if (this.collected) return;
        
        ctx.fillStyle = '#0f0';
        // Draw a simple star shape
        ctx.beginPath();
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI/2;
            const x = centerX + Math.cos(angle) * this.width/2;
            const y = centerY + Math.sin(angle) * this.height/2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    collidesWith(llama) {
        if (this.collected) return false;
        return !(this.x > llama.x + llama.width || 
                this.x + this.width < llama.x || 
                this.y > llama.y || 
                this.y + this.height < llama.y - llama.height);
    }
}

class Game {
    constructor() {
        this.scrollSpeed = 3;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120;
        this.minSpawnInterval = 60;
        this.stars = [];
        this.starPoints = 0;
        this.score = 0;
        this.isMuted = false;
    }

    update() {
        // Random spawn interval
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            if (Math.random() < 0.2) { // 20% chance for star
                this.stars.push(new Star(canvas.width));
            } else {
                this.obstacles.push(new Obstacle(canvas.width));
            }
            // Random interval between spawns
            this.spawnInterval = Math.max(
                this.minSpawnInterval,
                120 + Math.floor(Math.random() * 60)
            );
            this.spawnTimer = 0;
        }

        // Update and remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.update(this.scrollSpeed);
            return obstacle.x + obstacle.width > 0;
        });

        // Update and remove off-screen stars
        this.stars = this.stars.filter(star => {
            star.update(this.scrollSpeed);
            if (star.collidesWith(llama) && !star.collected) {
                star.collected = true;
                this.starPoints += 100;
            }
            return star.x + star.width > 0;
        });

        // Check for collisions
        this.obstacles.forEach(obstacle => {
            if (obstacle.collidesWith(llama)) {
                this.gameOver();
            }
        });

        // Increment score
        this.score++;
    }

    draw(ctx) {
        // Draw score and star points
        ctx.fillStyle = '#0f0';
        ctx.font = '20px monospace';
        ctx.fillText(`Distance: ${Math.floor(this.score/10)}`, 20, 30);
        ctx.fillText(`Stars: ${this.starPoints}`, 20, 60);

        // Draw obstacles and stars
        this.obstacles.forEach(obstacle => obstacle.draw(ctx));
        this.stars.forEach(star => star.draw(ctx));
    }

    gameOver() {
        ctx.fillStyle = '#0f0';
        ctx.font = '40px monospace';
        ctx.fillText('GAME OVER', canvas.width/2 - 100, canvas.height/2);
        ctx.font = '20px monospace';
        ctx.fillText('Press SPACE to restart', canvas.width/2 - 120, canvas.height/2 + 40);
        this.scrollSpeed = 0;
        gameRunning = false;
        gameMusic.pause();
        gameMusic.currentTime = 0;
    }

    reset() {
        this.obstacles = [];
        this.stars = [];
        this.spawnTimer = 0;
        this.score = 0;
        this.starPoints = 0;
        this.scrollSpeed = 3;
        this.spawnInterval = 120;
        llama.x = 100;
        llama.y = llama.groundY;
        llama.velocityY = 0;
        if (!this.isMuted && gameMusic.readyState >= 3) {
            gameMusic.play();
        }
        gameRunning = true;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const llama = new Llama(100, 300);

// Add to existing variables at the top
let gameRunning = true;
const game = new Game();

// Add after other const declarations
const gameMusic = document.getElementById('gameMusic');
const loadingIndicator = document.getElementById('loading');
const musicControls = document.getElementById('music-controls');
gameMusic.volume = 0.3; // Set volume to 30%

// Music loading handlers
gameMusic.addEventListener('loadstart', () => {
    loadingIndicator.style.display = 'block';
    gameRunning = false;
});

gameMusic.addEventListener('canplaythrough', () => {
    loadingIndicator.style.display = 'none';
    gameRunning = true;
    gameLoop();
});

// Update music controls UI
function updateMusicControls() {
    musicControls.textContent = game.isMuted ? '[SOUND OFF] Music [M]' : '[SOUND ON] Music [M]';
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (gameRunning) {
            llama.jump();
        } else {
            game.reset();
        }
    }
    if (event.key === 'ArrowLeft') {
        llama.velocityX = -llama.speed;
    }
    if (event.key === 'ArrowRight') {
        llama.velocityX = llama.speed;
    }
    if (event.key === 'ArrowUp') {
        llama.isHoldingUp = true;
    }
    if (event.key === 'M') {  // M key toggles music
        if (game.isMuted) {
            gameMusic.play();
            game.isMuted = false;
        } else {
            gameMusic.pause();
            game.isMuted = true;
        }
        updateMusicControls();
    }
});

// Add click handler for music controls
musicControls.addEventListener('click', () => {
    if (game.isMuted) {
        gameMusic.play();
        game.isMuted = false;
    } else {
        gameMusic.pause();
        game.isMuted = true;
    }
    updateMusicControls();
});

// Add key up listener to stop movement when keys are released
document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        llama.velocityX = 0;
    }
    if (event.key === 'ArrowUp') {
        llama.isHoldingUp = false;
    }
});

// Update the drawGround function
function drawGround() {
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    
    // Create scrolling dashed line effect
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -game.score * game.scrollSpeed; // Makes the line appear to move
    
    ctx.beginPath();
    ctx.moveTo(0, 650);
    ctx.lineTo(canvas.width, 650);
    ctx.stroke();
    
    // Reset line dash
    ctx.setLineDash([]);
}

// Update the gameLoop function
function gameLoop() {
    // Clear the canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the ground
    drawGround();

    if (gameRunning) {
        // Update game state
        game.update();
        llama.update();
    }

    // Draw everything
    llama.draw(ctx);
    game.draw(ctx);
    addScanlines();

    requestAnimationFrame(gameLoop);
}

function addScanlines() {
    for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, i, canvas.width, 2);
    }
}

// Start music when game starts
window.addEventListener('load', () => {
    updateMusicControls();
    // Try to play music (browsers might block autoplay)
    if (!game.isMuted && gameMusic.readyState >= 3) {
        gameMusic.play().catch(error => {
            console.log('Autoplay prevented - click to start game and music');
        });
    }
});

// Add click handler to start music (for browsers that block autoplay)
document.addEventListener('click', () => {
    if (!game.isMuted && gameMusic.paused && gameMusic.readyState >= 3) {
        gameMusic.play();
    }
});

// Only start the game loop after music is loaded
if (gameMusic.readyState >= 3) {
    gameLoop();
} else {
    loadingIndicator.style.display = 'block';
    gameRunning = false;
} 