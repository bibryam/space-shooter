// Game variables
let player;
let bullets = [];
let enemies = [];
let powerUps = [];
let particleSystem;
let stars = [];
let nebulas = []; // Background nebula clouds
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let level = 1; // Changed from "wave" to "level"
let lastEnemySpawn = 0;
let enemySpawnRate = 2000; // milliseconds
let levelDuration = 20000; // 20 seconds per level (changed from waveDuration)
let levelStartTime = 0; // Changed from waveStartTime
let baseEnemySpeed = 2;
let bossSpawned = false;
let bossLevelThreshold = 5; // Boss appears after this many levels (changed from bossWaveThreshold)

// UI elements
let uiAlpha = 0; // For fade effects
let scoreDisplayScale = 1; // For score pop effect
let levelDisplayTimer = 0; // For level announcement (changed from waveDisplayTimer)
let gameOverAlpha = 0; // For game over screen fade
let isSpacebarDown = false; // Track if spacebar is held down for continuous shooting

// Visual effects
let backgroundStars = []; // Distant background stars
let backgroundNebulas = []; // Far background nebulas
let screenShake = 0; // Screen shake effect

// Global variables for notification systems
let activeSideNotifications = []; // For powerups, lives, nuclear bomb
let activeCenterNotifications = []; // For level progression, points

function showSideNotification(message, subMessage, color, duration) {
    activeSideNotifications.push({
        message: message,
        subMessage: subMessage || "",
        color: color || [255, 255, 255],
        duration: duration || 60,
        opacity: 255,
        timer: duration || 60,
        flashCount: 5, // Number of times to flash
        flashRate: 0.2 // Controls flash speed
    });
}

function showCenterNotification(message, subMessage, color, duration) {
    activeCenterNotifications.push({
        message: message,
        subMessage: subMessage || "",
        color: color || [255, 255, 255],
        duration: duration || 60,
        opacity: 255,
        timer: duration || 60
    });
}

// Original function renamed to maintain compatibility with existing code
function showNotification(message, subMessage, color, duration) {
    // This is now for side notifications (powerups, lives, nuclear)
    showSideNotification(message, subMessage, color, duration);
}

function updateAndDrawSideNotifications() {
    // Calculate the base Y position for notifications based on active power-ups
    let notificationBaseY = 120; // Start at the baseline position
    
    // Add space for each active power-up
    if (player && gameState === 'playing') {
        if (player.hasTripleShot) notificationBaseY += 25;
        if (player.hasSpeedBoost) notificationBaseY += 25;
        if (player.hasShield) notificationBaseY += 25;
        if (player.hasBomb) notificationBaseY += 25;
        
        // Add a little extra padding
        notificationBaseY += 10;
    }
    
    for (let i = activeSideNotifications.length - 1; i >= 0; i--) {
        let notification = activeSideNotifications[i];
        
        // Update timer
        notification.timer--;
        
        // Calculate flash effect
        let flashPhase = sin(frameCount * notification.flashRate * PI);
        let flashOpacity = map(flashPhase, -1, 1, 0.5, 1);
        
        // Calculate opacity with fade-out
        if (notification.timer < 30) {
            notification.opacity = (notification.timer / 30) * 255;
        }
        
        // Final opacity combines fade-out and flash effect
        let finalOpacity = notification.opacity * flashOpacity;
        
        // Draw notification on left side of screen
        push();
        textAlign(LEFT, TOP);
        textSize(20);
        fill(notification.color[0], notification.color[1], notification.color[2], finalOpacity);
        text(notification.message, 20, notificationBaseY);
        
        if (notification.subMessage) {
            textSize(16);
            fill(200, 200, 200, finalOpacity);
            text(notification.subMessage, 20, notificationBaseY + 25);
        }
        pop();
        
        // Space for this notification
        notificationBaseY += notification.subMessage ? 55 : 30;
        
        // Remove expired notifications
        if (notification.timer <= 0) {
            activeSideNotifications.splice(i, 1);
        }
    }
}

function updateAndDrawCenterNotifications() {
    for (let i = activeCenterNotifications.length - 1; i >= 0; i--) {
        let notification = activeCenterNotifications[i];
        
        // Update timer and opacity
        notification.timer--;
        if (notification.timer < 30) {
            notification.opacity = (notification.timer / 30) * 255;
        }
        
        // Draw notification in center
        push();
        textAlign(CENTER);
        textSize(24);
        fill(notification.color[0], notification.color[1], notification.color[2], notification.opacity);
        text(notification.message, width/2, height/4);
        
        if (notification.subMessage) {
            textSize(16);
            fill(200, 200, 200, notification.opacity);
            text(notification.subMessage, width/2, height/4 + 30);
        }
        pop();
        
        // Remove expired notifications
        if (notification.timer <= 0) {
            activeCenterNotifications.splice(i, 1);
        }
    }
}

function updateAndDrawNotifications() {
    updateAndDrawSideNotifications();
    updateAndDrawCenterNotifications();
}

// Setup function
function setup() {
    // Create a canvas that fills the window height while maintaining aspect ratio
    let canvasHeight = windowHeight;
    let canvasWidth = 800 * (canvasHeight / 800); // Maintain aspect ratio
    
    // Ensure minimum width for playability
    canvasWidth = max(canvasWidth, 600);
    
    // Create the canvas with the calculated dimensions
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('game-container');
    
    player = new Player();
    particleSystem = new ParticleSystem();
    
    // Create background stars (multiple layers for parallax effect)
    createBackgroundElements();
    
    // Initialize UI
    uiAlpha = 0;
    textFont('Arial');
}

// Handle window resizing
function windowResized() {
    // Recalculate canvas dimensions
    let canvasHeight = windowHeight;
    let canvasWidth = 800 * (canvasHeight / 800);
    
    // Ensure minimum width for playability
    canvasWidth = max(canvasWidth, 600);
    
    // Resize the canvas
    resizeCanvas(canvasWidth, canvasHeight);
    
    // Only reset player's position if the player exists but hasn't moved yet
    // This prevents resetting the player's position if they've moved up/down
    if (player && gameState === 'start') {
        player.y = height - player.height - 40;
    }
}

// Create background stars and nebulas
function createBackgroundElements() {
    // Clear existing elements
    stars = [];
    nebulas = [];
    backgroundStars = [];
    backgroundNebulas = [];
    
    // Create multiple layers of stars for parallax effect
    
    // Distant stars (tiny, slow moving)
    for (let i = 0; i < 100; i++) {
        backgroundStars.push({
            x: random(width),
            y: random(height),
            size: random(0.5, 1.5),
            speed: random(0.1, 0.3),
            brightness: random(100, 200)
        });
    }
    
    // Mid-distance stars
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            speed: random(0.5, 1.5),
            brightness: random(150, 255),
            twinkleSpeed: random(0.02, 0.05),
            twinkleAmount: random(30, 70)
        });
    }
    
    // Create nebulas (colorful gas clouds in the background)
    for (let i = 0; i < 3; i++) {
        let nebulaColors = [
            [30, 0, 50, 5],   // Deep purple
            [0, 30, 70, 5],   // Deep blue
            [50, 0, 30, 5]    // Deep magenta
        ];
        
        let colorIndex = floor(random(nebulaColors.length));
        
        backgroundNebulas.push({
            x: random(width),
            y: random(height),
            width: random(200, 400),
            height: random(100, 300),
            speed: random(0.05, 0.2),
            color: nebulaColors[colorIndex],
            noiseOffset: random(100)
        });
    }
    
    // Create foreground nebula effects (more visible, colorful)
    for (let i = 0; i < 2; i++) {
        let nebulaColors = [
            [70, 20, 120, 2],  // Purple
            [20, 40, 120, 2],  // Blue
            [120, 20, 70, 2]   // Pink
        ];
        
        let colorIndex = floor(random(nebulaColors.length));
        
        nebulas.push({
            x: random(width),
            y: random(height),
            width: random(150, 300),
            height: random(80, 200),
            speed: random(0.2, 0.4),
            color: nebulaColors[colorIndex],
            noiseOffset: random(100)
        });
    }
}

// Draw function - main game loop
function draw() {
    // Apply screen shake effect if active
    if (screenShake > 0) {
        translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
        screenShake *= 0.9; // Reduce shake over time
        if (screenShake < 0.5) screenShake = 0;
    }
    
    // Deep space background
    background(5, 5, 20);
    
    // Draw background elements
    drawBackgroundElements();
    
    // Handle different game states
    if (gameState === 'start') {
        displayStartScreen();
    } else if (gameState === 'playing') {
        updateGame();
        displayGameInfo();
    } else if (gameState === 'gameOver') {
        // Still update particles and background elements in game over
        particleSystem.run();
        displayGameOverScreen();
    }
    
    updateAndDrawNotifications();
}

// Draw background stars and nebulas with parallax effect
function drawBackgroundElements() {
    // Draw distant background nebulas
    for (let i = 0; i < backgroundNebulas.length; i++) {
        let nebula = backgroundNebulas[i];
        
        // Draw nebula with noise-based shape
        noStroke();
        for (let j = 0; j < 5; j++) { // Layer multiple slightly different colors
            let alpha = nebula.color[3] * (5-j);
            fill(nebula.color[0] + j*10, nebula.color[1] + j*5, nebula.color[2] + j*15, alpha);
            
            beginShape();
            for (let angle = 0; angle < TWO_PI; angle += 0.2) {
                let xoff = map(cos(angle), -1, 1, 0, 3) + nebula.noiseOffset;
                let yoff = map(sin(angle), -1, 1, 0, 3) + nebula.noiseOffset;
                let r = map(noise(xoff, yoff, frameCount * 0.001), 0, 1, nebula.width/2, nebula.width);
                let x = nebula.x + cos(angle) * r;
                let y = nebula.y + sin(angle) * r;
                vertex(x, y);
            }
            endShape(CLOSE);
        }
        
        // Move nebula
        nebula.y += nebula.speed;
        
        // If nebula is off screen, reset it to top
        if (nebula.y - nebula.height > height) {
            nebula.y = -nebula.height;
            nebula.x = random(width);
            nebula.noiseOffset = random(100);
        }
    }
    
    // Draw distant stars
    for (let i = 0; i < backgroundStars.length; i++) {
        let star = backgroundStars[i];
        fill(255, 255, 255, star.brightness);
        noStroke();
        ellipse(star.x, star.y, star.size, star.size);
        
        // Move star down (parallax)
        star.y += star.speed;
        
        // If star is off screen, reset it to top
        if (star.y > height) {
            star.y = 0;
            star.x = random(width);
        }
    }
    
    // Draw mid-distance stars with twinkle effect
    for (let i = 0; i < stars.length; i++) {
        let star = stars[i];
        let twinkle = sin(frameCount * star.twinkleSpeed) * star.twinkleAmount;
        fill(255, 255, 255, star.brightness + twinkle);
        noStroke();
        ellipse(star.x, star.y, star.size, star.size);
        
        // Occasional star trail/flare
        if (random() < 0.01) {
            stroke(255, 255, 255, 50);
            strokeWeight(0.5);
            line(star.x, star.y, star.x, star.y + star.size * 2);
        }
        
        // Move star down
        star.y += star.speed;
        
        // If star is off screen, reset it to top
        if (star.y > height) {
            star.y = 0;
            star.x = random(width);
        }
    }
    
    // Draw foreground nebulas
    for (let i = 0; i < nebulas.length; i++) {
        let nebula = nebulas[i];
        
        // Draw nebula with noise-based shape
        noStroke();
        for (let j = 0; j < 5; j++) { // Layer for depth
            let alpha = 20 - j * 3;
            fill(nebula.color[0] + j*10, nebula.color[1] + j*5, nebula.color[2] + j*15, alpha);
            
            beginShape();
            for (let angle = 0; angle < TWO_PI; angle += 0.2) {
                let noiseVal = noise(
                    cos(angle) + nebula.noiseOffset, 
                    sin(angle) + nebula.noiseOffset, 
                    frameCount * 0.001
                );
                let r = map(noiseVal, 0, 1, nebula.width/2, nebula.width);
                let x = nebula.x + cos(angle) * r;
                let y = nebula.y + sin(angle) * r;
                vertex(x, y);
            }
            endShape(CLOSE);
        }
        
        // Move nebula
        nebula.y += nebula.speed;
        
        // If nebula is off screen, reset it to top
        if (nebula.y - nebula.height > height) {
            nebula.y = -nebula.height;
            nebula.x = random(width);
            nebula.noiseOffset = random(100);
        }
    }
}

// Update all game entities
function updateGame() {
    const currentTime = millis();
    const deltaTime = 16; // Assume ~60 FPS
    
    // Update player
    player.update(deltaTime);
    
    // Check for level progression
    if (currentTime - levelStartTime > levelDuration) {
        level++;
        levelStartTime = currentTime;
        
        // Add bonus points for completing the level
        let levelBonus = (level-1) * 100;  // Level 1→2 = 100, Level 2→3 = 200, etc.
        score += levelBonus;
        
        // Show center notification for level bonus
        showCenterNotification(
            "LEVEL " + (level-1) + " COMPLETE!", 
            "+" + levelBonus + " points", 
            [0, 255, 0],
            120  // 2 seconds
        );
        
        // Increase difficulty with each level (more gradual - ~10% per level)
        baseEnemySpeed += 0.1 + (level * 0.01); // More gradual speed increase
        
        // Display level announcement
        levelDisplayTimer = 180; // Display for 3 seconds (60 frames/second)
        
        // Give extra life at specific levels - now using side notification
        if (level === 4 || level === 7 || level === 9 || level === 10) {
            player.lives++;
            // Extra life is a player power-up, so use side notification
            showSideNotification(
                "EXTRA LIFE!", 
                "Lives: " + player.lives, 
                [0, 255, 0],
                120 // 2 seconds
            );
        }
        
        // Give player a nuclear bomb at level 5 and every 2 levels after
        if (level == 5 || (level > 5 && (level - 5) % 2 == 0)) {
            player.addBomb();
            // Create special effect for receiving the bomb
            particleSystem.createExplosion(
                player.x + player.width/2,
                player.y + player.height/2,
                [255, 50, 50],
                1.5
            );
            
            // Note: Notification for nuclear is handled inside player.addBomb()
        }
        
        // Spawn boss at set level intervals
        if (level % bossLevelThreshold === 0) {
            spawnBoss();
            bossSpawned = true;
            console.log("Boss spawned at level " + level);
        } else {
            // Reset boss spawned flag for non-boss levels
            bossSpawned = false;
        }
    }
    
    // Spawn regular enemies (don't spawn regular enemies during boss level)
    if (currentTime - lastEnemySpawn > enemySpawnRate && !(level % bossLevelThreshold === 0 && bossSpawned && hasBossEnemy())) {
        spawnEnemy();
        lastEnemySpawn = currentTime;
        
        // Make enemies spawn faster as the level progresses (more gradual scaling)
        // Special case for levels 1 and 2: cut spawn rate in half to double the number of ships
        if (level <= 2) {
            enemySpawnRate = max(800, (2000 - level * 70) / 2); // Double the ships in levels 1-2
        } else {
            enemySpawnRate = max(800, 2000 - level * 70); // Normal spawn rate for higher levels
        }
    }
    
    // Update and display bullets
    updateBullets();
    
    // Update and display enemies
    updateEnemies(currentTime);
    
    // Update and display power-ups
    updatePowerUps();
    
    // Draw player
    player.display();
    
    // Update and display particle effects
    particleSystem.run();
    
    // Handle player movement
    if (keyIsDown(LEFT_ARROW)) {
        player.move('left');
    }
    if (keyIsDown(RIGHT_ARROW)) {
        player.move('right');
    }
    // Add vertical movement
    if (keyIsDown(UP_ARROW)) {
        player.move('up');
    }
    if (keyIsDown(DOWN_ARROW)) {
        player.move('down');
    }
    
    // Handle continuous shooting when spacebar is held down
    if (isSpacebarDown && gameState === 'playing') {
        // Get current time for rate limiting
        const currentTime = millis();
        
        // Only shoot if cooldown has passed
        if (currentTime - player.lastShotTime >= player.shotCooldown) {
            const playerBullets = player.shoot();
            bullets = bullets.concat(playerBullets);
        }
    }
    
    // Process level display timer
    if (levelDisplayTimer > 0) {
        levelDisplayTimer--;
    }
    
    // Fade in UI
    uiAlpha = min(255, uiAlpha + 5);
}

// Check if there's currently a boss enemy
function hasBossEnemy() {
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i] instanceof BossEnemy) {
            return true;
        }
    }
    return false;
}

// Spawn a boss enemy
function spawnBoss() {
    // Create dramatic entrance
    screenShake = 10;
    
    // Add explosion effects around the top of the screen
    for (let i = 0; i < 5; i++) {
        particleSystem.createExplosion(
            random(width),
            random(50),
            [100, 150, 255]
        );
    }
    
    // Spawn the boss in the center top
    let bossX = width / 2 - 60;
    let bossY = -100;
    let boss = new BossEnemy(bossX, bossY);
    enemies.push(boss);
    console.log("Boss created at position:", bossX, bossY);
    
    // Play would go here
    // playSound('boss_appear');
}

// Spawn different enemy types based on the current level
function spawnEnemy() {
    const x = random(50, width - 50);
    
    // Spawn different enemy types based on level difficulty
    let enemyType = random(1);
    let enemy;
    
    // At higher levels, introduce formation patterns (more gradual progression)
    // Also add a small chance of formations even in early levels
    if ((level >= 9 && random() < 0.15) || (level <= 2 && random() < 0.05)) {
        spawnEnemyFormation();
        return;
    }
    
    // Higher chance of more powerful enemies at higher levels (more gradual progression)
    if (level >= 8 && enemyType < 0.2) { // Elite enemies appear at level 8 instead of 7
        enemy = new EliteEnemy(x, -50);
    } else if (level >= 5 && enemyType < 0.2 + (level-5)*0.02) { // Gradually increases chance with level
        enemy = new ShootingEnemy(x, -50);
    } else if (level >= 3 && enemyType < 0.3 + (level-3)*0.03) { // Gradually increases chance with level
        enemy = new ZigzagEnemy(x, -50);
    } else if (level >= 2 && enemyType < 0.5 + (level-2)*0.02) { // Gradually increases chance with level
        enemy = new FastEnemy(x, -50);
    } else {
        enemy = new BasicEnemy(x, -50);
    }
    
    // Add to enemies array
    enemies.push(enemy);
}

// Spawn a formation of enemies that move in coordinated patterns
function spawnEnemyFormation() {
    let formationType = floor(random(3));
    let enemyCount;
    
    switch (formationType) {
        case 0: // V formation
            enemyCount = 5;
            for (let i = 0; i < enemyCount; i++) {
                let offsetX = (i - (enemyCount-1)/2) * 60;
                let offsetY = abs(offsetX) * 0.5;
                let enemy = new ShootingEnemy(width/2 + offsetX, -50 - offsetY);
                enemies.push(enemy);
            }
            break;
            
        case 1: // Line formation
            enemyCount = 6;
            for (let i = 0; i < enemyCount; i++) {
                let spacing = width / (enemyCount + 1);
                let enemy = new FastEnemy((i + 1) * spacing, -50);
                enemies.push(enemy);
            }
            break;
            
        case 2: // Circle formation
            enemyCount = 8;
            for (let i = 0; i < enemyCount; i++) {
                let angle = (i / enemyCount) * TWO_PI;
                let radius = 100;
                let centerX = width / 2;
                let enemy = new ZigzagEnemy(
                    centerX + cos(angle) * radius, 
                    -50 - sin(angle) * radius
                );
                enemies.push(enemy);
            }
            break;
    }
    
    console.log("Spawned enemy formation type:", formationType);
}

// Update all bullets and check for collisions
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();
        bullet.display();
        
        // Check if this bullet has already been destroyed
        if (!bullets[i]) continue;
        
        // Check bullet-enemy collisions (only player bullets)
        if (!bullet.isEnemy) {
            // Check if player bullets hit enemy bullets
            for (let j = bullets.length - 1; j >= 0; j--) {
                // Skip self or other player bullets
                if (i === j || !bullets[j] || !bullets[j].isEnemy) continue;
                
                const enemyBullet = bullets[j];
                // Simple collision detection between bullets
                const distance = dist(
                    bullet.x, bullet.y, 
                    enemyBullet.x, enemyBullet.y
                );
                
                // If the bullets are close enough, they collide
                if (distance < bullet.width + enemyBullet.width) {
                    // Create collision effect
                    particleSystem.createExplosion(
                        (bullet.x + enemyBullet.x) / 2,
                        (bullet.y + enemyBullet.y) / 2,
                        [255, 200, 0],  // Yellow-orange explosion
                        0.7  // Smaller explosion
                    );
                    
                    // Add screen shake for feedback
                    screenShake = 2;
                    
                    // Add a small score for shooting down enemy bullets
                    score += 5;
                    
                    // Visual feedback for scoring
                    scoreDisplayScale = 1.2;
                    
                    // Remove both bullets
                    bullets.splice(j, 1);
                    bullets.splice(i, 1);
                    
                    // Skip the rest of the checks for this bullet
                    break;
                }
            }
            
            // If the bullet still exists, check for enemy collisions
            if (bullets[i]) {
                checkBulletEnemyCollisions(bullet, i);
            }
        } 
        // Check enemy bullets-player collisions
        else if (bullet.isEnemy && bullet.hits(player)) {
            const playerDestroyed = player.hit();
            if (playerDestroyed) {
                gameState = 'gameOver';
                
                // Add dramatic explosion for player ship
                screenShake = 15;
                particleSystem.createExplosion(player.x + player.width / 2, player.y + player.height / 2, [0, 150, 255]);
                
                // Add multiple explosions
                for (let j = 0; j < 5; j++) {
                    setTimeout(() => {
                        if (particleSystem) {
                            particleSystem.createExplosion(
                                player.x + player.width/2 + random(-20, 20),
                                player.y + player.height/2 + random(-20, 20),
                                [0, 150, 255]
                            );
                        }
                    }, j * 100);
                }
            } else {
                // Player hit but not destroyed
                particleSystem.createImpact(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                    [0, 150, 255]
                );
                screenShake = 5;
            }
            bullets.splice(i, 1);
        }
        
        // Remove bullets that are off screen
        if (bullets[i] && bullet.isOffScreen()) {
            bullets.splice(i, 1);
        }
    }
}

// Check collisions between a bullet and all enemies
function checkBulletEnemyCollisions(bullet, bulletIndex) {
    for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (bullet.hits(enemy)) {
            const enemyDestroyed = enemy.hit();
            
            // Impact effect even if not destroyed
            particleSystem.createImpact(
                bullet.x,
                bullet.y,
                [255, 100, 100]
            );
            
            if (enemyDestroyed) {
                // Add score with multiplier based on enemy type
                let pointValue = enemy.points;
                score += pointValue;
                
                // Visual effect for score increase
                scoreDisplayScale = 1.5; // Make score text pop
                
                // Add screen shake for boss destruction
                if (enemy instanceof BossEnemy) {
                    screenShake = 20;
                    
                    // Bigger explosion sequence for boss
                    for (let k = 0; k < 10; k++) {
                        setTimeout(() => {
                            if (particleSystem) {
                                particleSystem.createExplosion(
                                    enemy.x + random(enemy.width),
                                    enemy.y + random(enemy.height),
                                    [100, 100, 255]
                                );
                            }
                        }, k * 150);
                    }
                } else {
                    // Regular explosion effect
                    const enemyColor = enemy instanceof BasicEnemy ? [255, 0, 0] :
                                       enemy instanceof FastEnemy ? [255, 150, 0] :
                                       enemy instanceof ZigzagEnemy ? [200, 0, 200] : 
                                       [0, 0, 255];
                    
                    particleSystem.createExplosion(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        enemyColor
                    );
                }
                
                // Check for power-up drop
                const powerUp = enemy.dropPowerUp();
                if (powerUp) {
                    powerUps.push(powerUp);
                }
                
                // Remove the enemy
                enemies.splice(j, 1);
            }
            
            // Remove the bullet
            bullets.splice(bulletIndex, 1);
            break;
        }
    }
}

// Update and display enemies, check for collisions with player
function updateEnemies(currentTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.display();
        
        // Check enemy-player collision
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            const playerDestroyed = player.hit();
            if (playerDestroyed) {
                gameState = 'gameOver';
                
                // Add dramatic explosion for player ship
                screenShake = 15;
                particleSystem.createExplosion(player.x + player.width / 2, player.y + player.height / 2, [0, 150, 255]);
                
                // Add multiple explosions
                for (let j = 0; j < 5; j++) {
                    setTimeout(() => {
                        if (particleSystem) {
                            particleSystem.createExplosion(
                                player.x + player.width/2 + random(-20, 20),
                                player.y + player.height/2 + random(-20, 20),
                                [0, 150, 255]
                            );
                        }
                    }, j * 100);
                }
            } else {
                screenShake = 5;
            }
            
            // Don't destroy boss on collision, but damage it
            if (enemy instanceof BossEnemy) {
                enemy.hit();
                
                // Create explosion effect at collision point
                particleSystem.createExplosion(
                    player.x + player.width/2,
                    player.y,
                    [255, 100, 100]
                );
            } else {
                // Create explosion effect
                particleSystem.createExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    [255, 0, 0]
                );
                enemies.splice(i, 1);
            }
            continue;
        }
        
        // Get enemy shots
        const enemyBullets = enemy.shoot();
        if (enemyBullets.length > 0) {
            bullets = bullets.concat(enemyBullets);
        }
        
        // Remove enemies that are off screen
        if (enemy.isOffScreen()) {
            enemies.splice(i, 1);
        }
    }
}

// Update and display power-ups, check for collisions with player
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.update();
        powerUp.display();
        
        // Check power-up collision with player
        if (powerUp.collidesWith(player)) {
            powerUp.apply(player);
            
            // Add visual effect for power-up collection
            particleSystem.addParticles(
                player.x + player.width/2,
                player.y + player.height/2,
                15,
                powerUp.colors[powerUp.type],
                'spark'
            );
            
            powerUps.splice(i, 1);
            continue;
        }
        
        // Remove power-ups that are off screen
        if (powerUp.isOffScreen()) {
            powerUps.splice(i, 1);
        }
    }
}

// Display game information (score, level, lives)
function displayGameInfo() {
    // Score display with color change effect instead of scale
    push();
    let scoreColor = lerpColor(
        color(255, 255, 255, uiAlpha),
        color(255, 100, 100, uiAlpha),
        scoreDisplayScale
    );
    fill(scoreColor);
    textSize(24);
    textAlign(LEFT, TOP);
    text('SCORE: ' + score, 20, 20);
    // Gradually return to normal color
    scoreDisplayScale = lerp(scoreDisplayScale, 0, 0.1);
    
    // Level indicator
    textSize(18);
    fill(255, 255, 255, uiAlpha);
    text('LEVEL: ' + level, 20, 60);
    
    // Lives remaining (draw heart icons)
    for (let i = 0; i < player.lives; i++) {
        // Draw heart shape
        push();
        translate(20 + i * 30, 90);
        fill(255, 50, 50, uiAlpha);
        noStroke();
        beginShape();
        vertex(0, 5);
        bezierVertex(0, 5, 5, 0, 10, 5);
        bezierVertex(15, 0, 20, 5, 20, 5);
        bezierVertex(20, 5, 20, 15, 10, 20);
        bezierVertex(0, 15, 0, 5, 0, 5);
        endShape();
        pop();
    }
    
    // Power-up status indicators
    let powerUpY = 120;
    
    if (player.hasTripleShot) {
        push();
        // Draw power-up name
        fill(255, 50, 50, uiAlpha);
        textAlign(LEFT, TOP);
        text('Burst', 20, powerUpY);
        
        // Draw new burst indicator (Spreading Arrows design)
        translate(100, powerUpY + 10);  // Moved closer to text
        noStroke();
        
        // Draw three arrows spreading outward
        let arrowPulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        let arrowSize = 12;
        let spreadAngle = 0.4; // Angle between arrows
        
        // Draw arrows with gradient effect
        for (let i = -1; i <= 1; i++) {
            push();
            rotate(i * spreadAngle);
            
            // Arrow body
            fill(255, 50, 50, uiAlpha * arrowPulse);
            rect(-arrowSize/2, -arrowSize/4, arrowSize, arrowSize/2);
            
            // Arrow head
            beginShape();
            vertex(arrowSize/2, -arrowSize/2);
            vertex(arrowSize/2 + arrowSize/3, 0);
            vertex(arrowSize/2, arrowSize/2);
            endShape(CLOSE);
            
            // Arrow trail
            fill(255, 50, 50, uiAlpha * 0.3 * arrowPulse);
            beginShape();
            vertex(-arrowSize/2, -arrowSize/2);
            vertex(-arrowSize/2, arrowSize/2);
            vertex(-arrowSize/2 - arrowSize/3, 0);
            endShape(CLOSE);
            
            pop();
        }
        
        // Power level indicator
        let powerLevel = player.tripleShotTimer / 10000;
        fill(255, 50, 50, uiAlpha * 0.3);
        rect(-arrowSize/2 - 2, -arrowSize/2 - 2, (arrowSize + 4) * powerLevel, arrowSize + 4, 1);
        
        pop();
        powerUpY += 25;
    }
    
    if (player.hasSpeedBoost) {
        push();
        // Draw power-up name
        fill(255, 150, 0, uiAlpha);
        textAlign(LEFT, TOP);
        text('Nitro', 20, powerUpY);
        
        // Draw new nitro indicator (Chevron design)
        translate(100, powerUpY + 10);  // Moved closer to text
        noStroke();
        
        // Draw three chevrons
        let chevronPulse = sin(frameCount * 0.1) * 0.5 + 0.5;
        let chevronSize = 8;
        let spacing = 4;
        
        // Draw chevrons with gradient effect
        for (let i = 0; i < 3; i++) {
            let alpha = uiAlpha * (1 - i * 0.2) * chevronPulse;
            fill(255, 150, 0, alpha);
            
            // Chevron shape
            beginShape();
            vertex(-chevronSize - i * spacing, -chevronSize);
            vertex(-i * spacing, 0);
            vertex(-chevronSize - i * spacing, chevronSize);
            endShape(CLOSE);
        }
        
        // Power level indicator
        let powerLevel = player.speedBoostTimer / 10000;
        fill(255, 150, 0, uiAlpha * 0.3);
        rect(-chevronSize - 2, -chevronSize - 2, (chevronSize * 2 + 4) * powerLevel, chevronSize * 2 + 4, 1);
        
        pop();
        powerUpY += 25;
    }
    
    if (player.hasShield) {
        push();
        // Draw power-up name
        fill(0, 200, 255, uiAlpha);
        textAlign(LEFT, TOP);
        text('Shield', 20, powerUpY);
        
        // Draw shield indicator
        translate(100, powerUpY + 10);  // Moved closer to text
        noStroke();
        
        // Draw hexagonal shield
        let shieldSize = 15;
        let shieldPulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        
        // Shield glow
        fill(0, 200, 255, uiAlpha * 0.3 * shieldPulse);
        beginShape();
        for (let i = 0; i < 6; i++) {
            let angle = (i / 6) * TWO_PI;
            let x = cos(angle) * (shieldSize + 2);
            let y = sin(angle) * (shieldSize + 2);
            vertex(x, y);
        }
        endShape(CLOSE);
        
        // Main shield
        fill(0, 200, 255, uiAlpha * shieldPulse);
        beginShape();
        for (let i = 0; i < 6; i++) {
            let angle = (i / 6) * TWO_PI;
            let x = cos(angle) * shieldSize;
            let y = sin(angle) * shieldSize;
            vertex(x, y);
        }
        endShape(CLOSE);
        
        // Shield power level indicator
        let shieldPower = player.shieldTimer / 10000;
        fill(0, 200, 255, uiAlpha * 0.5);
        beginShape();
        for (let i = 0; i < 6; i++) {
            let angle = (i / 6) * TWO_PI;
            let x = cos(angle) * (shieldSize * shieldPower);
            let y = sin(angle) * (shieldSize * shieldPower);
            vertex(x, y);
        }
        endShape(CLOSE);
        
        pop();
        powerUpY += 25;
    }
    
    // Draw nuclear bomb indicator
    if (player.hasBomb) {
        push();
        // Draw power-up name with count and enter symbol
        fill(50, 255, 50, uiAlpha);
        textAlign(LEFT, TOP);
        text('Nuclear (↵' + player.bombCount + ')', 20, powerUpY);
        
        pop();
        powerUpY += 25;
    }
    
    // Display level announcement
    if (levelDisplayTimer > 0) {
        let levelAlpha = levelDisplayTimer > 120 ? 255 : levelDisplayTimer * 2;
        let levelScale = 1 + sin(frameCount * 0.1) * 0.1;
        
        textAlign(CENTER, CENTER);
        fill(255, 255, 255, levelAlpha);
        textSize(36 * levelScale);
        text('LEVEL ' + level, width/2, height/3);
        
        // Boss level special announcement
        if (level % bossLevelThreshold === 0) {
            textSize(24);
            fill(255, 50, 50, levelAlpha);
            text('DANGER APPROACHING...', width/2, height/3 + 50);
        }
    }
    
    pop();
}

// Display start screen
function displayStartScreen() {
    push();
    
    // Title with glowing effect
    let glowAmount = sin(frameCount * 0.05) * 10;
    for (let i = 5; i > 0; i--) {
        fill(0, 100, 255, 20/i);
        textSize(60 + i*2 + glowAmount);
        textAlign(CENTER, CENTER);
        text('SPACE SHOOTER', width/2, height/5 - i*2);
    }
    
    fill(150, 200, 255);
    textSize(60 + glowAmount);
    textAlign(CENTER, CENTER);
    text('SPACE SHOOTER', width/2, height/5);
    
    // Subtitle
    fill(200, 200, 200);
    textSize(24);
    
    // Instructions - make "Press SPACE to Start" blink
    fill(255);
    textSize(24);
    // Blink effect (visible for 0.8 seconds, invisible for 0.4 seconds)
    if (sin(frameCount * 0.05) > -0.5) {
        text('Press SPACE to Start', width/2, height/2);
    }
    
    // High score display at bottom of screen
    fill(200, 200, 200);
    textSize(18);
    text('HIGH SCORE: 0', width/2, height - 60);
    
    pop();
}

// Display game over screen
function displayGameOverScreen() {
    push();
    
    // Fade in game over screen
    gameOverAlpha = min(255, gameOverAlpha + 2);
    
    // Game over text - smaller as requested
    fill(255, 50, 50, gameOverAlpha);
    textSize(48);
    textAlign(CENTER, CENTER);
    text('GAME OVER', width/2, height/5);
    
    // Final score with blinking effect
    if (gameOverAlpha > 150) {
        // Calculate blinking alpha using sine wave
        let scoreBlinkRate = 0.08; // Controls how fast it blinks
        let scoreBlinkAmount = 50; // Controls how much the opacity changes
        let scoreBlinkingAlpha = gameOverAlpha - abs(sin(frameCount * scoreBlinkRate) * scoreBlinkAmount);
        
        // Add a subtle scale effect while blinking
        let scoreScale = 1 + sin(frameCount * scoreBlinkRate) * 0.05;
        
        // Draw the score with pulsing/blinking effect
        fill(255, 255, 255, scoreBlinkingAlpha);
        textSize(64 * scoreScale);
        textAlign(CENTER, CENTER);
        // Position score with more space from Game Over text
        text(score, width/2, height/3);
    }
    
    // Enhanced buttons with better styling - adjusted positions to prevent overlap
    if (gameOverAlpha > 200) {
        // Play Again button - improved styling with adjusted position
        let buttonY = height/2 + 20; // Updated to match displayGameOverScreen
        let buttonWidth = 250;
        let buttonHeight = 60;
        let buttonX = width/2 - buttonWidth/2;
        
        // Button background with gradient and glow effect
        drawEnhancedButton(
            buttonX, buttonY, 
            buttonWidth, buttonHeight, 
            [60, 100, 200], // Base color
            [80, 120, 220]  // Highlight color
        );
        
        // Button text - improved
        fill(255, 255, 255);
        textSize(22);
        textAlign(CENTER, CENTER);
        text('Play Again (↵)', width/2, buttonY + buttonHeight/2);
        
        // Share button - improved styling
        let shareY = buttonY + buttonHeight + 25;
        let shareWidth = 250;
        let shareX = width/2 - shareWidth/2;
        
        // Share button background with Twitter/X colors and gradient
        drawEnhancedButton(
            shareX, shareY, 
            shareWidth, buttonHeight, 
            [29, 161, 242], // Twitter blue
            [0, 132, 212]   // Darker Twitter blue
        );
        
        // Share button text - updated as requested
        fill(255, 255, 255);
        textSize(22);
        textAlign(CENTER, CENTER);
        text('Share your score on X', width/2, shareY + buttonHeight/2);
    }
    
    // Enable social share button by exposing global variables
    window.gameState = gameState;
    window.score = score;
    window.level = level;
    
    pop();
}

// Helper function to draw enhanced buttons with gradient and glow
function drawEnhancedButton(x, y, width, height, baseColor, highlightColor) {
    // Outer glow
    noFill();
    for (let i = 10; i > 0; i--) {
        let alpha = map(i, 10, 0, 20, 100);
        stroke(baseColor[0], baseColor[1], baseColor[2], alpha);
        strokeWeight(i/2);
        rect(x - i, y - i, width + i*2, height + i*2, 15);
    }
    
    // Button background gradient
    noStroke();
    for (let i = 0; i < height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(
            color(baseColor[0], baseColor[1], baseColor[2], 200 + sin(frameCount * 0.1) * 50),
            color(highlightColor[0], highlightColor[1], highlightColor[2], 200 + sin(frameCount * 0.1) * 50),
            inter
        );
        fill(c);
        rect(x, y + i, width, 1, 15);
    }
    
    // Highlight on top edge
    noFill();
    stroke(255, 255, 255, 100);
    strokeWeight(2);
    line(x + 10, y + 3, x + width - 10, y + 3);
    
    // Add subtle pulsing effect
    let pulseSize = sin(frameCount * 0.05) * 3;
    noFill();
    stroke(255, 255, 255, 30);
    strokeWeight(1);
    rect(x - pulseSize, y - pulseSize, width + pulseSize*2, height + pulseSize*2, 15);
}

// Handle key presses
function keyPressed() {
    if (key === ' ') {
        // Set spacebar flag for continuous shooting
        isSpacebarDown = true;
        
        // Start the game if on start screen only
        if (gameState === 'start') {
            startGame();
        }
        
        // Initial shot when key is first pressed (in playing state)
        if (gameState === 'playing') {
            const playerBullets = player.shoot();
            bullets = bullets.concat(playerBullets);
        }
    } else if (keyCode === ENTER) {
        // Nuclear bomb activation (only during gameplay)
        if (gameState === 'playing' && player.hasBomb) {
            const bombUsed = player.activateBomb();
            if (bombUsed) {
                // Clear all enemies and bullets with spectacular effect
                detonateNuclearBomb();
            }
        } 
        // Alternative way to start/restart
        else if (gameState === 'start' || gameState === 'gameOver') {
            resetGame();
        }
    } else if (key === 's' || key === 'S') {
        // Share shortcut
        if (gameState === 'gameOver' && typeof window.shareScore === 'function') {
            window.shareScore();
        }
    }
}

// Add key released function to track when spacebar is released
function keyReleased() {
    if (key === ' ') {
        isSpacebarDown = false;
    }
    return false; // Prevent default browser behavior
}

// Update mousePressed function to work with the new button dimensions
function mousePressed() {
    if (gameState === 'gameOver') {
        // Check if play again button was clicked - using updated coordinates
        let buttonY = height/2 + 20; // Updated to match displayGameOverScreen
        let buttonWidth = 250;
        let buttonHeight = 60;
        let buttonX = width/2 - buttonWidth/2;
        
        if (mouseX > buttonX && mouseX < buttonX + buttonWidth && 
            mouseY > buttonY && mouseY < buttonY + buttonHeight) {
            resetGame();
            console.log("Play Again button clicked"); // Debug message
        }
        
        // Check if share button was clicked - using updated coordinates
        let shareY = buttonY + buttonHeight + 25;
        let shareWidth = 250;
        let shareX = width/2 - shareWidth/2;
        
        if (mouseX > shareX && mouseX < shareX + shareWidth && 
            mouseY > shareY && mouseY < shareY + buttonHeight) {
            if (typeof window.shareScore === 'function') {
                window.shareScore();
                console.log("Share button clicked"); // Debug message
            } else {
                // Use the provided shortlink with the score
                let tweetText = `I scored ${score} points in Space Shooter! Can you beat my score?`;
                let tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://bibryam.github.io/space-shooter')}`;
                window.open(tweetUrl, '_blank');
            }
        }
    }
}

// Start the game
function startGame() {
    gameState = 'playing';
    score = 0;
    level = 1;  // Changed from wave
    levelStartTime = millis();  // Changed from waveStartTime
    lastEnemySpawn = millis();
    enemySpawnRate = 1000; // Reduced from 2000 to double the initial ship spawn rate
    baseEnemySpeed = 2;
    bossSpawned = false;
    
    // Display level announcement (changed from wave)
    levelDisplayTimer = 180;
}

// Reset the game
function resetGame() {
    // Clear all game objects
    bullets = [];
    enemies = [];
    powerUps = [];
    gameOverAlpha = 0;
    
    // Reset stars and background
    createBackgroundElements();
    
    // Reset player
    player = new Player();
    
    // Start a new game
    startGame();
}

// Nuclear bomb detonation effect
function detonateNuclearBomb() {
    // Screen shake
    screenShake = 30;
    
    // Add points for each enemy destroyed
    enemies.forEach(enemy => {
        score += enemy.points;
    });
    
    // Create intense explosion effect expanding from player
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            // Create concentric explosion rings
            let radius = 50 + (i * 100);
            
            // Main explosion at player position
            particleSystem.createExplosion(
                player.x + player.width/2,
                player.y + player.height/2,
                [255, 200, 50],
                3 + i
            );
            
            // Create explosions in a circular pattern around player
            for (let j = 0; j < 6 + i*2; j++) {
                let angle = (j / (6 + i*2)) * TWO_PI;
                let x = player.x + player.width/2 + cos(angle) * radius;
                let y = player.y + player.height/2 + sin(angle) * radius;
                
                particleSystem.createExplosion(
                    x, y,
                    [255, 100 + random(100), 0],
                    1.5 + random(1.5)
                );
            }
        }, i * 100); // Stagger the explosions
    }
    
    // Clear all enemies and enemy bullets
    enemies = [];
    bullets = bullets.filter(bullet => !bullet.isEnemy);
} 