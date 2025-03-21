class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = width / 2 - this.width / 2;
        this.y = height - this.height - 60;
        this.speed = 5;
        this.lives = 4;
        
        // Flag to track when player just lost a life (for UI feedback)
        this.justLostLife = false;
        this.lostLifeTimer = 0;
        
        // Invincibility after death
        this.isInvincible = false;
        this.invincibilityDuration = 120; // 2 seconds at 60fps (with deltaTime=1)
        this.invincibilityTimer = 0;
        this.blinkRate = 6; // Increased blink rate for more visibility
        this.isVisible = true; // For blinking effect
        
        // Power-up states
        this.hasTripleShot = false;
        this.hasSpeedBoost = false;
        this.hasShield = false;
        
        // Special nuclear bomb
        this.hasBomb = false;
        this.bombCount = 0; // Added to track number of bombs
        this.bombAnimationTimer = 0;
        
        // Power-up timers
        this.tripleShotTimer = 0;
        this.speedBoostTimer = 0;
        this.shieldTimer = 0;  // Added shield timer
        
        // Shooting cooldown - reduced to allow faster firing
        this.lastShotTime = 0;
        this.shotCooldown = 200; // reduced from 500 milliseconds
        
        // Animation variables
        this.thrusterAnimation = 0;
        this.isMoving = false;
        this.lastDirection = null;
        this.thrusterColor = [0, 150, 255];
        
        // Load player spaceship image
        this.loadImages();
    }
    
    loadImages() {
        // In a production game, you would load actual images
        // this.image = loadImage('assets/spaceship.png');
        // this.shieldImage = loadImage('assets/shield.png');
    }
    
    move(direction) {
        this.isMoving = true;
        this.lastDirection = direction;
        const effectiveSpeed = this.hasSpeedBoost ? this.speed * 2 : this.speed;
        
        if (direction === 'left') {
            this.x = max(0, this.x - effectiveSpeed);
        } else if (direction === 'right') {
            this.x = min(width - this.width, this.x + effectiveSpeed);
        } else if (direction === 'up') {
            // Allow player to move up but stay within the bottom 2/3 of the screen
            this.y = max(height / 3, this.y - effectiveSpeed);
        } else if (direction === 'down') {
            // Prevent player from going off the bottom of the screen
            this.y = min(height - this.height - 20, this.y + effectiveSpeed);
        }
    }
    
    shoot() {
        const currentTime = millis();
        // Remove cooldown check so player can shoot continuously
        // if (currentTime - this.lastShotTime < this.shotCooldown) {
        //     return [];
        // }
        
        this.lastShotTime = currentTime;
        
        // Calculate rocket size based on level (global variable)
        // Start with base size and increase with each level
        let rocketWidth = 6 + (level * 0.5); // Increases with level
        let rocketHeight = 20 + (level * 1); // Increases with level
        
        // Create bullets with enhanced visual properties
        let bullets = [];
        if (this.hasTripleShot) {
            bullets = [
                new Bullet(this.x + this.width / 2 - 20, this.y, 'up', false, rocketWidth, rocketHeight),
                new Bullet(this.x + this.width / 2, this.y, 'up', false, rocketWidth, rocketHeight),
                new Bullet(this.x + this.width / 2 + 20, this.y, 'up', false, rocketWidth, rocketHeight)
            ];
        } else {
            bullets = [new Bullet(this.x + this.width / 2, this.y, 'up', false, rocketWidth, rocketHeight)];
        }
        
        // Add muzzle flash effect - REDUCED from 5 to 2 particles
        particleSystem.addParticles(
            this.x + this.width / 2, 
            this.y, 
            2, 
            [0, 255, 255]
        );
        
        return bullets;
    }
    
    activateTripleShot() {
        // Only update the state - don't show notification here
        this.hasTripleShot = true;
        this.tripleShotTimer = 10000; // 10 seconds
    }
    
    activateSpeedBoost() {
        // Only update the state - don't show notification here
        this.hasSpeedBoost = true;
        this.speedBoostTimer = 10000; // Changed to 10 seconds
    }
    
    activateShield() {
        // Only update the state - don't show notification here
        this.hasShield = true;
        this.shieldTimer = 10000; // 10 seconds
    }
    
    activateBomb() {
        if (this.bombCount > 0) {
            this.bombCount--;
            this.hasBomb = this.bombCount > 0; // Update hasBomb based on remaining bombs
            this.bombAnimationTimer = 60; // 1 second animation
            return true; // Bomb was used successfully
        }
        return false; // No bomb available
    }
    
    addBomb() {
        this.bombCount++;
        this.hasBomb = true;
        
        // Show notification for nuclear bomb using side notification
        if (typeof showSideNotification === 'function') {
            showSideNotification(
                "☢ NUCLEAR ACQUIRED!", 
                "Press ↵ to detonate", 
                [255, 50, 50], 
                120
            );
        }
    }
    
    hit() {
        // If player is invincible, ignore the hit
        if (this.isInvincible) {
            console.log("Hit ignored - player invincible (current timer: " + this.invincibilityTimer + ")"); // Debug info
            return false; // Player not destroyed
        }
        
        // If player has shield, consume shield instead of losing a life
        if (this.hasShield) {
            this.hasShield = false;
            return false; // Player not destroyed
        } else {
            this.lives--;
            console.log("Player hit! Lives remaining: " + this.lives); // Debug info
            
            // Set the flag for UI feedback (blinking hearts)
            this.justLostLife = true;
            this.lostLifeTimer = 60; // About 1 second at 60fps
            
            // Make player invincible for a short time after losing a life
            if (this.lives > 0) {
                this.isInvincible = true;
                this.invincibilityTimer = this.invincibilityDuration;
                console.log("Player now invincible for " + (this.invincibilityDuration / 60) + " seconds (timer: " + this.invincibilityTimer + ")"); // Debug info
                
                // Remove notification for invincibility
            }
            
            return this.lives <= 0; // Return true if player is destroyed
        }
    }
    
    // Helper method to check if player can be hit (used by collision detection)
    canBeHit() {
        return !this.isInvincible;
    }
    
    update(deltaTime) {
        // Update thruster animation
        this.thrusterAnimation = (this.thrusterAnimation + 0.2) % 1;
        
        // Reset movement flag (will be set to true if player is actively moving)
        this.isMoving = false;
        
        // Update the lost life timer and clear flag when done
        if (this.justLostLife) {
            this.lostLifeTimer -= deltaTime;
            if (this.lostLifeTimer <= 0) {
                this.justLostLife = false;
            }
        }
        
        // Update invincibility timer and handle blinking effect
        if (this.isInvincible) {
            this.invincibilityTimer -= deltaTime;
            
            // Log invincibility status every second for debugging
            if (frameCount % 60 === 0) {
                console.log("Player invincible: " + this.isInvincible + ", timer: " + this.invincibilityTimer.toFixed(1));
            }
            
            // Create faster, more obvious blinking effect
            // Blink more rapidly (10 times per second)
            this.isVisible = (frameCount % 6 < 3);
            
            // End invincibility when timer expires
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
                this.isVisible = true; // Make sure player is visible when invincibility ends
                console.log("Invincibility ended"); // Debug info
            }
        }
        
        // Update power-up timers
        if (this.hasTripleShot) {
            this.tripleShotTimer -= deltaTime;
            if (this.tripleShotTimer <= 0) {
                this.hasTripleShot = false;
            }
        }
        
        if (this.hasSpeedBoost) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.hasSpeedBoost = false;
            }
        }
        
        // Update shield timer
        if (this.hasShield) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
            }
        }
        
        // Update bomb animation timer
        if (this.bombAnimationTimer > 0) {
            this.bombAnimationTimer--;
        }
    }
    
    display() {
        // If invincible and in invisible phase, don't draw the ship at all
        if (this.isInvincible && !this.isVisible) {
            return;
        }
        
        push();
        
        // Draw thruster flames with animation
        noStroke();
        let flameSize = this.hasSpeedBoost ? 2 : 1; // Reduced flame size multiplier for speed boost
        
        // Engine glow effect (2 main engines instead of 4)
        for (let i = 0; i < 2; i++) {
            let engineX = this.x + (i === 0 ? this.width * 0.35 : this.width * 0.65);
            let engineY = this.y + this.height - 5;
            
            // Outer engine glow (subtle red)
            fill(255, 50, 0, this.hasSpeedBoost ? 60 : 40);
            let glowSize = (6 + sin(frameCount * 0.2) * 2) * (this.hasSpeedBoost ? 1.2 : 1);
            ellipse(engineX, engineY, glowSize, glowSize);
            
            // Dynamic flame effect
            fill(255, 50, 0, this.hasSpeedBoost ? 220 : 180); // More red flames during speed boost
            let flameHeight = (12 + sin(this.thrusterAnimation * PI * 2) * 4) * flameSize;
            let flameWidth = (5 * flameSize) + (this.hasSpeedBoost ? 2 : 0); // Wider flames during speed boost
            
            beginShape();
            vertex(engineX - flameWidth/2, engineY);
            vertex(engineX + flameWidth/2, engineY);
            vertex(engineX + sin(frameCount * 0.1) * 2, engineY + flameHeight);
            vertex(engineX - sin(frameCount * 0.1) * 2, engineY + flameHeight);
            endShape(CLOSE);
            
            // Inner flame (more intense during speed boost)
            fill(255, 200, 0, this.hasSpeedBoost ? 200 : 150);
            let innerFlameWidth = flameWidth * 0.6;
            beginShape();
            vertex(engineX - innerFlameWidth/2, engineY);
            vertex(engineX + innerFlameWidth/2, engineY);
            vertex(engineX + sin(frameCount * 0.1), engineY + flameHeight * 0.8);
            vertex(engineX - sin(frameCount * 0.1), engineY + flameHeight * 0.8);
            endShape(CLOSE);
        }
        
        // Change ship color during invincibility - alternate between red and white
        if (this.isInvincible) {
            // Blink between red and white
            if (frameCount % 6 < 3) {
                // Bright red during half the blink cycle
                fill(255, 0, 0);
            } else {
                // Pure white during other half
                fill(255, 255, 255);
            }
        } else {
            // Main fuselage (regular color when not invincible)
            fill(180, 180, 180);
        }
        
        // Nose cone
        beginShape();
        vertex(this.x + this.width/2, this.y); // Tip
        vertex(this.x + this.width * 0.7, this.y + this.height * 0.3);
        vertex(this.x + this.width * 0.7, this.y + this.height * 0.8);
        vertex(this.x + this.width * 0.3, this.y + this.height * 0.8);
        vertex(this.x + this.width * 0.3, this.y + this.height * 0.3);
        endShape(CLOSE);
        
        // X-wing foils (wings)
        if (this.isInvincible) {
            // Wings should also have the same invincibility color (red/white blinking)
            if (frameCount % 6 < 3) {
                fill(255, 0, 0);
            } else {
                fill(255, 255, 255);
            }
        } else {
            fill(150, 150, 150);
        }
        noStroke(); // Add this to prevent any red lines from previous drawing
        
        // Upper left wing
        beginShape();
        vertex(this.x + this.width * 0.3, this.y + this.height * 0.3);
        vertex(this.x - 5, this.y + this.height * 0.2);
        vertex(this.x - 10, this.y + this.height * 0.4);
        vertex(this.x + this.width * 0.2, this.y + this.height * 0.5);
        endShape(CLOSE);
        
        // Upper right wing
        beginShape();
        vertex(this.x + this.width * 0.7, this.y + this.height * 0.3);
        vertex(this.x + this.width + 5, this.y + this.height * 0.2);
        vertex(this.x + this.width + 10, this.y + this.height * 0.4);
        vertex(this.x + this.width * 0.8, this.y + this.height * 0.5);
        endShape(CLOSE);
        
        // Lower left wing
        beginShape();
        vertex(this.x + this.width * 0.3, this.y + this.height * 0.6);
        vertex(this.x - 5, this.y + this.height * 0.7);
        vertex(this.x - 10, this.y + this.height * 0.9);
        vertex(this.x + this.width * 0.2, this.y + this.height);
        endShape(CLOSE);
        
        // Lower right wing
        beginShape();
        vertex(this.x + this.width * 0.7, this.y + this.height * 0.6);
        vertex(this.x + this.width + 5, this.y + this.height * 0.7);
        vertex(this.x + this.width + 10, this.y + this.height * 0.9);
        vertex(this.x + this.width * 0.8, this.y + this.height);
        endShape(CLOSE);
        
        // Cockpit (red tinted like X-wing)
        fill(255, 50, 50, 100);
        beginShape();
        vertex(this.x + this.width * 0.4, this.y + this.height * 0.2);
        vertex(this.x + this.width * 0.6, this.y + this.height * 0.2);
        vertex(this.x + this.width * 0.55, this.y + this.height * 0.4);
        vertex(this.x + this.width * 0.45, this.y + this.height * 0.4);
        endShape(CLOSE);
        
        // Red stripes (X-wing detail) - Only draw if not in triple shot mode
        if (!this.hasTripleShot) {
            stroke(255, 0, 0);
            strokeWeight(2);
            line(this.x - 10, this.y + this.height * 0.4, this.x + 5, this.y + this.height * 0.4);
            line(this.x + this.width - 5, this.y + this.height * 0.4, this.x + this.width + 10, this.y + this.height * 0.4);
        }
        
        // Triple shot weapon systems
        if (this.hasTripleShot) {
            // Draw additional weapon pods on wings
            noStroke();
            fill(100, 100, 100);
            
            // Left wing weapon
            rect(this.x - 5, this.y + this.height * 0.3, 8, 15, 2);
            // Center weapon
            rect(this.x + this.width * 0.45, this.y + 5, 10, 20, 2);
            // Right wing weapon
            rect(this.x + this.width - 3, this.y + this.height * 0.3, 8, 15, 2);
            
            // Weapon glow
            fill(0, 255, 255, 50 + sin(frameCount * 0.2) * 30);
            ellipse(this.x - 1, this.y + this.height * 0.3 + 7, 6, 6);
            ellipse(this.x + this.width * 0.5, this.y + 15, 6, 6);
            ellipse(this.x + this.width + 1, this.y + this.height * 0.3 + 7, 6, 6);
        }
        
        // Shield effect
        if (this.hasShield) {
            noFill();
            // Outer shield bubble
            for (let i = 0; i < 3; i++) {
                let shieldPulse = sin(frameCount * 0.1) * 0.5 + 0.5;
                let alpha = map(i, 0, 2, 150, 50) * shieldPulse;
                strokeWeight(3 - i);
                stroke(0, 200, 255, alpha);
                
                // Shield ellipse
                ellipse(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    this.width * 1.5 + i * 10,
                    this.height * 1.5 + i * 10
                );
                
                // Shield hexagon effect
                beginShape();
                for (let j = 0; j < 6; j++) {
                    let angle = j * TWO_PI / 6;
                    let radius = (this.width + i * 10) * 0.8;
                    let x = this.x + this.width/2 + cos(angle + frameCount * 0.02) * radius;
                    let y = this.y + this.height/2 + sin(angle + frameCount * 0.02) * radius;
                    vertex(x, y);
                }
                endShape(CLOSE);
            }
        }
        
        pop();
    }
} 