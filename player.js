class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = width / 2 - this.width / 2;
        this.y = height - this.height - 60;
        this.speed = 5;
        this.lives = 3;
        
        // Power-up states
        this.hasTripleShot = false;
        this.hasSpeedBoost = false;
        this.hasShield = false;
        
        // Special nuclear bomb
        this.hasBomb = false;
        this.bombAnimationTimer = 0;
        
        // Power-up timers
        this.tripleShotTimer = 0;
        this.speedBoostTimer = 0;
        
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
        
        // Add muzzle flash effect
        particleSystem.addParticles(
            this.x + this.width / 2, 
            this.y, 
            5, 
            [0, 255, 255]
        );
        
        return bullets;
    }
    
    activateTripleShot() {
        this.hasTripleShot = true;
        this.tripleShotTimer = 10000; // 10 seconds
    }
    
    activateSpeedBoost() {
        this.hasSpeedBoost = true;
        this.speedBoostTimer = 5000; // 5 seconds
    }
    
    activateShield() {
        this.hasShield = true;
    }
    
    activateBomb() {
        if (this.hasBomb) {
            this.hasBomb = false;
            this.bombAnimationTimer = 60; // 1 second animation
            return true; // Bomb was used successfully
        }
        return false; // No bomb available
    }
    
    hit() {
        // If player has shield, consume shield instead of losing a life
        if (this.hasShield) {
            this.hasShield = false;
            return false; // Player not destroyed
        } else {
            this.lives--;
            return this.lives <= 0; // Return true if player is destroyed
        }
    }
    
    update(deltaTime) {
        // Update thruster animation
        this.thrusterAnimation = (this.thrusterAnimation + 0.2) % 1;
        
        // Reset movement flag (will be set to true if player is actively moving)
        this.isMoving = false;
        
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
            
            // Add speed trail particles when speed boost is active
            if (random() < 0.5) {
                particleSystem.addParticles(
                    this.x + random(this.width), 
                    this.y + this.height - 5, 
                    1, 
                    [100, 100, 255, 100]
                );
            }
        }
        
        // Update bomb animation timer
        if (this.bombAnimationTimer > 0) {
            this.bombAnimationTimer--;
        }
    }
    
    display() {
        push();
        
        // Draw thruster flames when moving
        if (this.isMoving || frameCount % 3 == 0) {
            // Thruster base
            fill(255, 150, 0, 200);
            let thrusterHeight = 15 + sin(frameCount * 0.2) * 5;
            let thrusterWidth = 12;
            
            // Left thruster
            triangle(
                this.x + this.width * 0.3, this.y + this.height,
                this.x + this.width * 0.3 - thrusterWidth/2, this.y + this.height + thrusterHeight,
                this.x + this.width * 0.3 + thrusterWidth/2, this.y + this.height + thrusterHeight
            );
            
            // Right thruster
            triangle(
                this.x + this.width * 0.7, this.y + this.height,
                this.x + this.width * 0.7 - thrusterWidth/2, this.y + this.height + thrusterHeight,
                this.x + this.width * 0.7 + thrusterWidth/2, this.y + this.height + thrusterHeight
            );
            
            // Inner flame (more yellow)
            fill(255, 255, 0, 150);
            thrusterHeight = 10 + sin(frameCount * 0.3) * 3;
            thrusterWidth = 6;
            
            // Left inner flame
            triangle(
                this.x + this.width * 0.3, this.y + this.height,
                this.x + this.width * 0.3 - thrusterWidth/2, this.y + this.height + thrusterHeight,
                this.x + this.width * 0.3 + thrusterWidth/2, this.y + this.height + thrusterHeight
            );
            
            // Right inner flame
            triangle(
                this.x + this.width * 0.7, this.y + this.height,
                this.x + this.width * 0.7 - thrusterWidth/2, this.y + this.height + thrusterHeight,
                this.x + this.width * 0.7 + thrusterWidth/2, this.y + this.height + thrusterHeight
            );
        }
        
        // Main ship body - futuristic design
        noStroke();
        
        // Ship body (metallic blue)
        fill(100, 130, 230);
        rect(this.x, this.y, this.width, this.height, 5);
        
        // Ship front (nose cone)
        fill(80, 100, 200);
        triangle(
            this.x + this.width / 2, this.y,
            this.x + 10, this.y + 20,
            this.x + this.width - 10, this.y + 20
        );
        
        // Cockpit
        fill(200, 230, 255, 180);
        ellipse(this.x + this.width / 2, this.y + 15, 20, 10);
        
        // Wing details
        fill(60, 80, 180);
        // Left wing
        quad(
            this.x, this.y + this.height - 15,
            this.x - 10, this.y + this.height - 5,
            this.x - 5, this.y + this.height,
            this.x + 10, this.y + this.height
        );
        
        // Right wing
        quad(
            this.x + this.width, this.y + this.height - 15,
            this.x + this.width + 10, this.y + this.height - 5,
            this.x + this.width + 5, this.y + this.height,
            this.x + this.width - 10, this.y + this.height
        );
        
        // Engine glow
        if (frameCount % 2 == 0) {
            fill(0, 150, 255, 50);
            ellipse(this.x + this.width * 0.3, this.y + this.height - 5, 10, 6);
            ellipse(this.x + this.width * 0.7, this.y + this.height - 5, 10, 6);
        }
        
        // Accent lines
        stroke(200, 220, 255);
        strokeWeight(1);
        line(this.x + 15, this.y + 25, this.x + this.width - 15, this.y + 25);
        line(this.x + 10, this.y + 35, this.x + this.width - 10, this.y + 35);
        
        // Draw shield if active
        if (this.hasShield) {
            noFill();
            strokeWeight(2);
            // Pulsating shield effect
            let shieldSize = 20 + sin(frameCount * 0.1) * 3;
            let shieldAlpha = 150 + sin(frameCount * 0.2) * 50;
            
            // Shield gradient effect
            for (let i = 0; i < 3; i++) {
                stroke(0, 255, 255, shieldAlpha - i * 40);
                ellipse(
                    this.x + this.width / 2, 
                    this.y + this.height / 2, 
                    this.width + shieldSize - i * 5, 
                    this.height + shieldSize - i * 5
                );
            }
            
            // Shield ripple effect on hit (would be triggered by hit)
            if (frameCount % 30 < 5) {
                stroke(255, 255, 255, 100);
                ellipse(
                    this.x + this.width / 2, 
                    this.y + this.height / 2, 
                    this.width + shieldSize + 10,
                    this.height + shieldSize + 10
                );
            }
        }
        
        // Speed boost visual effect
        if (this.hasSpeedBoost) {
            noFill();
            stroke(255, 255, 0, 100 + sin(frameCount * 0.2) * 50);
            strokeWeight(2);
            arc(
                this.x + this.width / 2, 
                this.y + this.height / 2, 
                this.width + 30, 
                this.height + 30, 
                PI, TWO_PI
            );
        }
        
        pop();
    }
} 