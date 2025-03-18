// Base Enemy class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 2;
        this.points = 10; // Base points for destroying this enemy
        this.health = 1;
        this.frameCount = 0;
        this.animationSpeed = random(0.05, 0.15);
        
        // Add shooting capability to all enemies
        this.canShoot = false;
        this.shootCooldown = 3000; // Base cooldown, will be adjusted by enemy type and level
        this.lastShotTime = 0;
        this.shotPattern = 'straight'; // Default pattern
        this.bulletSpeed = 4;
    }
    
    update() {
        this.y += this.speed;
        // Update animation frame for all enemies
        this.frameCount += this.animationSpeed;
    }
    
    display() {
        // Base display is overridden by child classes
        fill(255, 0, 0);
        rect(this.x, this.y, this.width, this.height);
    }
    
    isOffScreen() {
        return this.y > height;
    }
    
    hit() {
        this.health--;
        return this.health <= 0;
    }
    
    // Chance to drop a power-up when destroyed
    dropPowerUp() {
        const chance = random(1);
        if (chance < 0.2) { // 20% chance
            const typeChance = random(1);
            let type;
            if (typeChance < 0.33) {
                type = 'tripleShot';
            } else if (typeChance < 0.66) {
                type = 'speedBoost';
            } else {
                type = 'shield';
            }
            return new PowerUp(this.x + this.width / 2, this.y + this.height / 2, type);
        }
        return null;
    }
    
    shoot() {
        // Check if this enemy can shoot and cooldown has passed
        if (!this.canShoot) return [];
        
        const currentTime = millis();
        if (currentTime - this.lastShotTime < this.shootCooldown) return [];
        
        this.lastShotTime = currentTime;
        
        let bullets = [];
        
        // Different shooting patterns based on the enemy's shotPattern property
        switch (this.shotPattern) {
            case 'straight':
                // Simple straight shot
                bullets.push(new Bullet(
                    this.x + this.width/2,
                    this.y + this.height,
                    'down',
                    true
                ));
                break;
                
            case 'spread':
                // 3-way spread shot
                for (let i = -1; i <= 1; i++) {
                    let bullet = new Bullet(
                        this.x + this.width/2,
                        this.y + this.height,
                        'down',
                        true
                    );
                    bullet.vx = i * 1.5;
                    bullet.speed = this.bulletSpeed;
                    bullets.push(bullet);
                }
                break;
                
            case 'aimed':
                // Aimed at player if possible
                if (typeof player !== 'undefined') {
                    let dx = (player.x + player.width/2) - (this.x + this.width/2);
                    let dy = (player.y + player.height/2) - (this.y + this.height/2);
                    let angle = atan2(dy, dx);
                    
                    let bullet = new Bullet(
                        this.x + this.width/2,
                        this.y + this.height,
                        'down',
                        true
                    );
                    bullet.vx = cos(angle) * this.bulletSpeed;
                    bullet.vy = sin(angle) * this.bulletSpeed;
                    bullets.push(bullet);
                } else {
                    // Fallback to straight shot
                    bullets.push(new Bullet(
                        this.x + this.width/2,
                        this.y + this.height,
                        'down',
                        true
                    ));
                }
                break;
                
            case 'spiral':
                // Spiral pattern (4 bullets in a spiral)
                for (let i = 0; i < 4; i++) {
                    let angle = (i / 4) * TWO_PI + (frameCount * 0.01);
                    let bullet = new Bullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        'down',
                        true
                    );
                    bullet.vx = cos(angle) * this.bulletSpeed;
                    bullet.vy = sin(angle) * this.bulletSpeed;
                    bullets.push(bullet);
                }
                break;
                
            case 'burst':
                // Burst of bullets (8 in all directions)
                for (let i = 0; i < 8; i++) {
                    let angle = (i / 8) * TWO_PI;
                    let bullet = new Bullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        'down',
                        true
                    );
                    bullet.vx = cos(angle) * this.bulletSpeed;
                    bullet.vy = sin(angle) * this.bulletSpeed;
                    bullets.push(bullet);
                }
                break;
        }
        
        // Add muzzle flash effects if bullets were fired
        if (bullets.length > 0) {
            particleSystem.addParticles(
                this.x + this.width/2,
                this.y + this.height,
                3,
                [255, 100, 50]
            );
        }
        
        return bullets;
    }
}

// Basic enemy that moves straight down - AI Drone
class BasicEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 10;
        this.speed = 2;
        this.engineGlowSize = random(3, 6);
        this.wingAngle = 0;
        
        // Enable shooting based on level (more gradual progression)
        if (level >= 2) {
            this.canShoot = true;
            this.shootCooldown = 3000 - (level * 120); // More gradual cooldown reduction (~10-15% per level)
            this.shotPattern = level >= 6 ? 'spread' : 'straight'; // Delayed pattern upgrade
            this.bulletSpeed = 3 + (level * 0.1); // More gradual bullet speed increase
        }
    }
    
    update() {
        super.update();
        this.wingAngle = sin(this.frameCount * 2) * 0.1;
    }
    
    display() {
        push();
        
        // Main body - more menacing dark red color
        noStroke();
        fill(100, 10, 10);  // Much darker red, almost blood-like
        
        // Alien ship shape - more angular and threatening
        beginShape();
        vertex(this.x + this.width/2, this.y); // top point (sharper)
        vertex(this.x + this.width, this.y + this.height * 0.4); // right point
        vertex(this.x + this.width * 0.7, this.y + this.height); // bottom right
        vertex(this.x + this.width * 0.3, this.y + this.height); // bottom left
        vertex(this.x, this.y + this.height * 0.4); // left point
        endShape(CLOSE);
        
        // Evil-looking "eye" in the center
        fill(255, 0, 0, 150 + sin(this.frameCount * 5) * 100);  // Pulsing red glow
        ellipse(this.x + this.width/2, this.y + this.height * 0.35, this.width * 0.5, this.height * 0.2);
        
        // Creepy inner pupil
        fill(0);
        ellipse(this.x + this.width/2, this.y + this.height * 0.35, this.width * 0.1, this.height * 0.1);
        
        // Side spikes - like alien appendages
        push();
        translate(this.x + this.width/2, this.y + this.height/2);
        rotate(this.wingAngle);
        fill(50, 0, 0);  // Dark red spikes
        
        // Left spikes
        beginShape();
        vertex(-this.width * 0.5, 0);
        vertex(-this.width * 0.9, -this.height * 0.2);
        vertex(-this.width * 0.6, 0.1);
        vertex(-this.width * 0.9, this.height * 0.3);
        endShape(CLOSE);
        
        // Right spikes
        beginShape();
        vertex(this.width * 0.5, 0);
        vertex(this.width * 0.9, -this.height * 0.2);
        vertex(this.width * 0.6, 0.1);
        vertex(this.width * 0.9, this.height * 0.3);
        endShape(CLOSE);
        pop();
        
        // Eerie engine glow
        fill(255, 0, 0, 150 + sin(this.frameCount * 5) * 50);
        let glowSize = this.engineGlowSize + sin(this.frameCount * 0.5) * 2;
        ellipse(this.x + this.width * 0.3, this.y + this.height - 3, glowSize, glowSize);
        ellipse(this.x + this.width * 0.7, this.y + this.height - 3, glowSize, glowSize);
        
        // Alien tech details - strange markings
        stroke(200, 0, 0, 100);
        strokeWeight(1);
        line(this.x + this.width * 0.3, this.y + this.height * 0.6, this.x + this.width * 0.7, this.y + this.height * 0.6);
        line(this.x + this.width * 0.5, this.y + this.height * 0.6, this.x + this.width * 0.5, this.y + this.height * 0.8);
        
        pop();
    }
}

// Fast enemy that moves down quickly - Interceptor
class FastEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 20;
        this.speed = 4;
        this.width = 30;
        this.height = 35;
        this.thrusterSize = random(8, 12);
        this.thrusterAlpha = 200;
        this.rotationAngle = 0;
        
        // Enable shooting based on level (more gradual progression)
        if (level >= 3) {
            this.canShoot = true;
            this.shootCooldown = 2500 - (level * 80); // More gradual cooldown reduction
            this.shotPattern = level >= 7 ? 'aimed' : 'straight'; // Delayed pattern upgrade
            this.bulletSpeed = 4 + (level * 0.15); // More gradual bullet speed increase
        }
    }
    
    update() {
        super.update();
        // Pulsating thruster effect
        this.thrusterAlpha = 150 + sin(this.frameCount * 3) * 50;
        // Add rotation to make it look more menacing
        this.rotationAngle += 0.05;
    }
    
    display() {
        push();
        translate(this.x + this.width/2, this.y + this.height/2);
        rotate(sin(this.rotationAngle) * 0.3); // Wobbling rotation

        // Nightmarish thruster flame
        noStroke();
        fill(100, 0, 0, this.thrusterAlpha); // Blood red
        beginShape();
        for (let i = 0; i < 10; i++) {
            let angle = PI * 0.7 + (i / 10) * PI * 0.6;
            let len = 15 + sin(this.frameCount * 0.3 + i) * 5;
            vertex(sin(angle) * len, len);
        }
        endShape(CLOSE);
        
        // Inner flame (more intense)
        fill(255, 0, 0, this.thrusterAlpha * 0.8); // Brighter red
        beginShape();
        for (let i = 0; i < 8; i++) {
            let angle = PI * 0.75 + (i / 8) * PI * 0.5;
            let len = 10 + sin(this.frameCount * 0.5 + i) * 3;
            vertex(sin(angle) * len, len);
        }
        endShape(CLOSE);
        
        // Ship body (dark metallic with spikes)
        fill(40, 0, 20); // Very dark purple-red
        
        // Insect-like body
        beginShape();
        vertex(0, -this.height/2); // nose
        vertex(-this.width/2, -this.height/4); // left shoulder
        vertex(-this.width/2 - 5, 0); // left spike
        vertex(-this.width/3, this.height/4); // left indent
        vertex(-this.width/3, this.height/2); // left back
        vertex(this.width/3, this.height/2); // right back
        vertex(this.width/3, this.height/4); // right indent
        vertex(this.width/2 + 5, 0); // right spike
        vertex(this.width/2, -this.height/4); // right shoulder
        endShape(CLOSE);
        
        // "Eye" sensors
        fill(200, 0, 0, 150 + sin(this.frameCount) * 100);
        ellipse(-this.width/5, -this.height/4, 5, 5);
        ellipse(this.width/5, -this.height/4, 5, 5);
        
        // Creepy central eye
        fill(255, 255, 0, 170); // Sickly yellow
        ellipse(0, -this.height/6, this.width * 0.3, this.height * 0.15);
        
        // Pupil that follows player (if player exists)
        fill(0);
        let pupilX = 0;
        let pupilY = -this.height/6;
        if (typeof player !== 'undefined') {
            let angle = atan2(player.y - this.y, player.x - this.x);
            pupilX += cos(angle) * 2;
            pupilY += sin(angle) * 2;
        }
        ellipse(pupilX, pupilY, this.width * 0.1, this.height * 0.1);
        
        // Metallic bone-like structure
        stroke(100, 0, 0);
        strokeWeight(1);
        line(-this.width/4, 0, this.width/4, 0);
        line(0, -this.height/4, 0, this.height/4);
        
        pop();
    }
}

// Enemy that moves in a zigzag pattern - Striker
class ZigzagEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 15;
        this.speed = 3;
        this.amplitude = 20; // How far it moves side to side
        this.frequency = 0.05; // How fast it oscillates
        this.centerX = x;
        this.time = 0;
        this.enginePulse = 0;
        this.wingRotation = 0;
        this.tentaclePhase = random(TWO_PI);
        
        // Enable shooting based on level (more gradual progression)
        if (level >= 2) {
            this.canShoot = true;
            this.shootCooldown = 2800 - (level * 100); // More gradual cooldown reduction
            // Use spread pattern that matches zigzag movement
            this.shotPattern = level >= 6 ? 'spiral' : 'spread'; // Delayed pattern upgrade
            this.bulletSpeed = 3.5 + (level * 0.12); // More gradual bullet speed increase
        }
    }
    
    update() {
        this.y += this.speed;
        this.time += 1;
        this.x = this.centerX + sin(this.time * this.frequency) * this.amplitude;
        
        // Update animation variables
        this.enginePulse = (this.enginePulse + 0.1) % 1;
        this.wingRotation = sin(this.time * this.frequency) * 0.3; // More dramatic rotation
        this.tentaclePhase += 0.1;
    }
    
    display() {
        push();
        translate(this.x + this.width/2, this.y + this.height/2);
        rotate(this.wingRotation);
        
        // Ship body - alien/insect hybrid appearance
        noStroke();
        fill(50, 0, 50); // Dark purple main body
        ellipse(0, 0, this.width, this.height * 0.6);
        
        // Horrifying "mouth" in the center 
        fill(100, 0, 0);
        beginShape();
        for (let i = 0; i < 12; i++) {
            let angle = TWO_PI * (i / 12);
            let radius = (this.width/4) * (0.7 + 0.3 * sin(angle * 3 + this.tentaclePhase));
            vertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
        
        // Inner "teeth"
        fill(200, 200, 200); // Bone white
        beginShape();
        for (let i = 0; i < 8; i++) {
            let angle = TWO_PI * (i / 8);
            let radius = (this.width/8) * (0.7 + 0.3 * sin(angle * 4 + this.tentaclePhase));
            vertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
        
        // Alien tentacles / appendages
        fill(80, 0, 80);
        
        // Draw 4 moving tentacles
        for (let i = 0; i < 4; i++) {
            let angle = (TWO_PI * i / 4) + this.tentaclePhase * 0.2;
            let length = this.width * 0.6;
            
            push();
            rotate(angle);
            // Segmented tentacle
            for (let j = 0; j < 3; j++) {
                let segmentLength = length * (3-j) / 6;
                let segmentWidth = this.width * 0.15 * (3-j) / 3;
                let segmentX = length * j / 3;
                let waveOffset = sin(this.tentaclePhase + j) * 5;
                
                // Creepy segmented appendage
                ellipse(segmentX, waveOffset, segmentWidth, segmentLength);
                
                // Claw or barb at the end of each tentacle
                if (j == 2) {
                    fill(130, 0, 0); // Blood red
                    triangle(
                        segmentX - segmentWidth/2, waveOffset,
                        segmentX + segmentWidth/2, waveOffset,
                        segmentX, waveOffset + segmentLength * 1.2
                    );
                }
            }
            pop();
        }
        
        // Pulsating core - looks like a beating heart
        fill(200, 0, 0, 100 + sin(this.tentaclePhase * 2) * 50);
        let pulseSize = 10 + sin(this.tentaclePhase) * 3;
        ellipse(0, 0, pulseSize, pulseSize);
        
        // Alien tech details - strange, incomprehensible symbols
        stroke(150, 0, 150, 100 + sin(this.tentaclePhase) * 50);
        strokeWeight(0.5);
        for (let i = 0; i < 3; i++) {
            let angle = this.tentaclePhase + i;
            let x1 = cos(angle) * (this.width/4);
            let y1 = sin(angle) * (this.width/4);
            let x2 = cos(angle + PI) * (this.width/4);
            let y2 = sin(angle + PI) * (this.width/4);
            line(x1, y1, x2, y2);
        }
        
        pop();
    }
}

// Enemy that shoots at the player - Assault Cruiser
class ShootingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 25;
        this.speed = 2;
        this.canShoot = true; // Always can shoot
        this.shootCooldown = 2000 - (level * 90); // More gradual cooldown reduction
        this.lastShotTime = 0;
        this.health = 1 + Math.floor(level / 4); // More gradual health scaling
        this.gunRotation = 0;
        this.barrelFlash = 0;
        this.eyeBlinkTimer = 0;
        
        // Advanced shooting patterns based on level (more gradual progression)
        if (level >= 8) { // Delayed pattern upgrade
            this.shotPattern = 'burst';
            this.bulletSpeed = 4.2;
        } else if (level >= 6) { // Delayed pattern upgrade
            this.shotPattern = 'aimed';
            this.bulletSpeed = 3.8;
        } else {
            this.shotPattern = 'spread';
            this.bulletSpeed = 3.5;
        }
    }
    
    update() {
        super.update();
        
        // Rotate gun turrets aggressively as if targeting
        this.gunRotation = sin(this.frameCount * 0.2) * 0.3;
        
        // Decay barrel flash after shooting
        if (this.barrelFlash > 0) {
            this.barrelFlash -= 0.1;
        }
        
        // Blink timer for evil eyes
        this.eyeBlinkTimer = max(0, this.eyeBlinkTimer - 0.05);
        if (random(100) < 1) {
            this.eyeBlinkTimer = 1;
        }
    }
    
    display() {
        push();
        
        // Main ship body - darker, metallic look
        noStroke();
        fill(30, 30, 40); // Almost black with slight blue tint
        
        // More angular/asymmetric threatening shape
        beginShape();
        vertex(this.x + this.width/2, this.y); // top point
        vertex(this.x + this.width * 0.8, this.y + this.height * 0.3); // right shoulder
        vertex(this.x + this.width + 10, this.y + this.height * 0.5); // right spike
        vertex(this.x + this.width * 0.9, this.y + this.height * 0.7); // right lower corner
        vertex(this.x + this.width * 0.7, this.y + this.height); // right bottom
        vertex(this.x + this.width * 0.3, this.y + this.height); // left bottom
        vertex(this.x + this.width * 0.1, this.y + this.height * 0.7); // left lower corner
        vertex(this.x - 10, this.y + this.height * 0.5); // left spike
        vertex(this.x + this.width * 0.2, this.y + this.height * 0.3); // left shoulder
        endShape(CLOSE);
        
        // Armored plates with "bone" like appearance
        fill(20, 20, 25);
        quad(
            this.x + this.width * 0.3, this.y + this.height * 0.2,
            this.x + this.width * 0.7, this.y + this.height * 0.2,
            this.x + this.width * 0.6, this.y + this.height * 0.5,
            this.x + this.width * 0.4, this.y + this.height * 0.5
        );
        
        // Evil looking "eyes" or sensors
        if (this.eyeBlinkTimer < 0.1) {
            // Eyes open - bright red
            fill(255, 0, 0, 200);
            ellipse(this.x + this.width * 0.35, this.y + this.height * 0.3, 8, 5);
            ellipse(this.x + this.width * 0.65, this.y + this.height * 0.3, 8, 5);
        } else {
            // Eyes in "blink" state
            stroke(255, 0, 0, 100);
            strokeWeight(1);
            line(this.x + this.width * 0.3, this.y + this.height * 0.3, 
                 this.x + this.width * 0.4, this.y + this.height * 0.3);
            line(this.x + this.width * 0.6, this.y + this.height * 0.3, 
                 this.x + this.width * 0.7, this.y + this.height * 0.3);
            noStroke();
        }
        
        // Gun turrets like alien appendages
        push();
        translate(this.x + 15, this.y + this.height * 0.7);
        rotate(this.gunRotation);
        fill(30, 10, 10); // Very dark red
        // Organic-looking gun base
        ellipse(0, 0, 15, 12);
        // Weapon barrel
        fill(10, 10, 10);
        rect(-3, 0, 6, 15, 1);
        // Barrel flash with more alien appearance
        if (this.barrelFlash > 0) {
            fill(255, 50, 0, this.barrelFlash * 255);
            beginShape();
            for (let i = 0; i < 8; i++) {
                let angle = TWO_PI * i / 8;
                let radius = 3 + sin(angle * 3) * 2 + random(2) * this.barrelFlash;
                vertex(radius * cos(angle), 15 + radius * sin(angle));
            }
            endShape(CLOSE);
        }
        pop();
        
        // Second gun turret
        push();
        translate(this.x + this.width - 15, this.y + this.height * 0.7);
        rotate(-this.gunRotation);
        fill(30, 10, 10);
        ellipse(0, 0, 15, 12);
        fill(10, 10, 10);
        rect(-3, 0, 6, 15, 1);
        if (this.barrelFlash > 0) {
            fill(255, 50, 0, this.barrelFlash * 255);
            beginShape();
            for (let i = 0; i < 8; i++) {
                let angle = TWO_PI * i / 8;
                let radius = 3 + sin(angle * 3) * 2 + random(2) * this.barrelFlash;
                vertex(radius * cos(angle), 15 + radius * sin(angle));
            }
            endShape(CLOSE);
        }
        pop();
        
        // Engine exhausts - eerie supernatural glow
        fill(100, 0, 50, 150 + sin(this.frameCount * 3) * 50);
        beginShape();
        for (let i = 0; i < 6; i++) {
            let x = this.x + 10 + i * 5;
            let y = this.y + this.height + sin(this.frameCount * 0.1 + i) * 3;
            vertex(x, y);
        }
        endShape(CLOSE);
        
        // Alien tech markings - like ritual symbols
        stroke(100, 0, 0, 150);
        strokeWeight(1);
        // Strange geometric pattern on the ship hull
        line(this.x + this.width * 0.3, this.y + this.height * 0.6, 
             this.x + this.width * 0.7, this.y + this.height * 0.6);
        line(this.x + this.width * 0.5, this.y + this.height * 0.4, 
             this.x + this.width * 0.5, this.y + this.height * 0.8);
        noFill();
        ellipse(this.x + this.width * 0.5, this.y + this.height * 0.6, 20, 20);
        
        // Health indicator - looks like alien blood vessel
        if (this.health == 2) {
            fill(200, 0, 0, 150);
        } else {
            fill(100, 0, 0, 150);
        }
        // Pulsating health bar
        let healthPulse = 1 + sin(this.frameCount * 0.2) * 0.1;
        rect(this.x + 10, this.y - 5, (this.width - 20) * (this.health / 2) * healthPulse, 3, 1);
        
        pop();
    }
    
    shoot() {
        const currentTime = millis();
        if (currentTime - this.lastShotTime > this.shootCooldown) {
            this.lastShotTime = currentTime;
            this.barrelFlash = 1; // Activate barrel flash
            
            // Add muzzle flash particles
            particleSystem.addParticles(
                this.x + 10, 
                this.y + this.height * 0.7 + 15, 
                3, 
                [255, 200, 100]
            );
            
            particleSystem.addParticles(
                this.x + this.width - 10, 
                this.y + this.height * 0.7 + 15, 
                3, 
                [255, 200, 100]
            );
            
            let bullets = [];
            
            // Different shooting patterns based on level
            switch (this.shotPattern) {
                case 'spread':
                    // Two guns firing spread shots
                    for (let i = -1; i <= 1; i++) {
                        let leftBullet = new Bullet(
                            this.x + 10,
                            this.y + this.height * 0.7 + 15,
                            'down',
                            true
                        );
                        leftBullet.vx = i * 0.7;
                        leftBullet.speed = this.bulletSpeed;
                        
                        let rightBullet = new Bullet(
                            this.x + this.width - 10,
                            this.y + this.height * 0.7 + 15,
                            'down',
                            true
                        );
                        rightBullet.vx = i * 0.7;
                        rightBullet.speed = this.bulletSpeed;
                        
                        bullets.push(leftBullet, rightBullet);
                    }
                    break;
                    
                case 'aimed':
                    // Two guns firing aimed shots
                    if (typeof player !== 'undefined') {
                        let angle = atan2(
                            (player.y + player.height/2) - (this.y + this.height * 0.7),
                            (player.x + player.width/2) - (this.x + this.width/2)
                        );
                        
                        let leftBullet = new Bullet(
                            this.x + 10,
                            this.y + this.height * 0.7 + 15,
                            'down',
                            true
                        );
                        leftBullet.vx = cos(angle - 0.2) * this.bulletSpeed;
                        leftBullet.vy = sin(angle - 0.2) * this.bulletSpeed;
                        
                        let rightBullet = new Bullet(
                            this.x + this.width - 10,
                            this.y + this.height * 0.7 + 15,
                            'down',
                            true
                        );
                        rightBullet.vx = cos(angle + 0.2) * this.bulletSpeed;
                        rightBullet.vy = sin(angle + 0.2) * this.bulletSpeed;
                        
                        bullets.push(leftBullet, rightBullet);
                    } else {
                        // Fallback to basic shots
                        bullets.push(
                            new Bullet(this.x + 10, this.y + this.height * 0.7 + 15, 'down', true),
                            new Bullet(this.x + this.width - 10, this.y + this.height * 0.7 + 15, 'down', true)
                        );
                    }
                    break;
                    
                case 'burst':
                    // Burst fire in multiple directions
                    for (let i = 0; i < 6; i++) {
                        let angle = (i / 6) * PI + PI/2; // Forward hemisphere
                        
                        let leftBullet = new Bullet(
                            this.x + 10,
                            this.y + this.height * 0.7 + 10,
                            'down',
                            true
                        );
                        leftBullet.vx = cos(angle) * this.bulletSpeed;
                        leftBullet.vy = sin(angle) * this.bulletSpeed;
                        
                        let rightBullet = new Bullet(
                            this.x + this.width - 10,
                            this.y + this.height * 0.7 + 10,
                            'down',
                            true
                        );
                        rightBullet.vx = cos(angle) * this.bulletSpeed;
                        rightBullet.vy = sin(angle) * this.bulletSpeed;
                        
                        bullets.push(leftBullet, rightBullet);
                    }
                    break;
                    
                default:
                    // Simple two bullet pattern as fallback
                    bullets.push(
                        new Bullet(this.x + 10, this.y + this.height * 0.7 + 15, 'down', true),
                        new Bullet(this.x + this.width - 10, this.y + this.height * 0.7 + 15, 'down', true)
                    );
                    break;
            }
            
            // Add muzzle flash effects
            if (bullets.length > 0) {
                if (this.shotPattern === 'spread' || this.shotPattern === 'aimed' || this.shotPattern === 'burst') {
                    particleSystem.addParticles(
                        this.x + this.width * 0.5,
                        this.y + this.height * 0.6,
                        5,
                        [200, 230, 255]
                    );
                } else if (this.shotPattern === 'spiral') {
                    for (let i = 0; i < 4; i++) {
                        particleSystem.addParticles(
                            this.x + this.width * 0.5,
                            this.y + this.height * 0.5,
                            3,
                            [200, 230, 255]
                        );
                    }
                }
            }
            
            return bullets;
        }
        return [];
    }
    
    hit() {
        this.health--;
        // Flash the ship when hit
        particleSystem.addParticles(
            this.x + this.width/2, 
            this.y + this.height/2, 
            5, 
            [255, 255, 255]
        );
        return this.health <= 0;
    }
}

// New elite enemy type for higher levels
class EliteEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 35;
        this.speed = 1.5;
        this.width = 60;
        this.height = 60;
        this.health = 2 + Math.floor(level / 4); // More gradual health scaling
        this.canShoot = true;
        this.shootCooldown = 1800 - (level * 70); // More gradual cooldown reduction
        this.lastShotTime = 0;
        this.shotPattern = level >= 9 ? 'burst' : (level >= 7 ? 'spiral' : 'aimed'); // Delayed pattern upgrades
        this.bulletSpeed = 4 + (level * 0.15); // More gradual bullet speed increase
        
        // Visual effects
        this.rotationAngle = 0;
        this.pulsePhase = random(TWO_PI);
        this.glowSize = random(10, 15);
    }
    
    update() {
        super.update();
        this.rotationAngle += 0.02;
        this.pulsePhase += 0.05;
        
        // Elite ships hover for a bit before continuing down
        if (this.y < height * 0.3) {
            this.y += this.speed;
        } else {
            this.y += this.speed * 0.3;
            // Side to side movement when hovering
            this.x += sin(this.pulsePhase) * 1.5;
            // Keep within screen bounds
            this.x = constrain(this.x, 0, width - this.width);
        }
    }
    
    display() {
        push();
        translate(this.x + this.width/2, this.y + this.height/2);
        rotate(sin(this.rotationAngle) * 0.2);
        
        // Dark energy aura
        noStroke();
        for (let i = 3; i > 0; i--) {
            let alpha = 50 / i;
            fill(100, 0, 150, alpha);
            let pulseSize = 5 + sin(this.pulsePhase) * 3;
            ellipse(0, 0, this.width + i * pulseSize, this.height + i * pulseSize);
        }
        
        // Main body - more complex alien shape
        fill(40, 0, 60);
        beginShape();
        for (let i = 0; i < 8; i++) {
            let angle = i / 8 * TWO_PI;
            let radius = this.width * 0.4 * (1 + 0.3 * sin(angle * 3 + this.pulsePhase));
            vertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
        
        // Inner core - pulsating energy
        fill(150, 0, 200, 150 + sin(this.pulsePhase) * 50);
        beginShape();
        for (let i = 0; i < 6; i++) {
            let angle = i / 6 * TWO_PI;
            let radius = this.width * 0.25 * (1 + 0.2 * sin(angle * 2 + this.pulsePhase * 2));
            vertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
        
        // Central "eye" - follows player
        fill(255, 50, 0, 200);
        let eyeSize = 15 + sin(this.pulsePhase * 2) * 3;
        ellipse(0, 0, eyeSize, eyeSize);
        
        // Pupil that follows player
        fill(0);
        let pupilX = 0;
        let pupilY = 0;
        if (typeof player !== 'undefined') {
            let angle = atan2(player.y - this.y, player.x - this.x);
            pupilX = cos(angle) * 5;
            pupilY = sin(angle) * 5;
        }
        ellipse(pupilX, pupilY, eyeSize * 0.4, eyeSize * 0.4);
        
        // Weapon pods around the body
        for (let i = 0; i < 4; i++) {
            let angle = (i / 4) * TWO_PI + this.rotationAngle;
            let podX = cos(angle) * this.width * 0.35;
            let podY = sin(angle) * this.width * 0.35;
            
            // Pod base
            fill(70, 0, 100);
            ellipse(podX, podY, 12, 12);
            
            // Weapon barrel
            fill(40, 0, 60);
            let barrelLength = 8 + sin(this.pulsePhase + i) * 2;
            let barrelDir = 0;
            if (typeof player !== 'undefined') {
                barrelDir = atan2(player.y - this.y, player.x - this.x);
            }
            // Point slightly toward player
            push();
            translate(podX, podY);
            rotate(barrelDir);
            rect(-2, 0, 4, barrelLength, 1);
            pop();
            
            // Weapon glow
            fill(255, 50, 0, 100 + sin(this.pulsePhase * 2) * 50);
            ellipse(podX, podY, 6, 6);
        }
        
        // Floating crystal fragments around ship
        for (let i = 0; i < 6; i++) {
            let angle = (i / 6) * TWO_PI + this.rotationAngle * 1.5;
            let orbitRadius = this.width * 0.5 + sin(this.pulsePhase + i) * 5;
            let fragX = cos(angle) * orbitRadius;
            let fragY = sin(angle) * orbitRadius;
            
            fill(150, 50, 200, 150);
            let fragSize = 5 + i % 3;
            // Crystal shard shape
            beginShape();
            vertex(fragX, fragY - fragSize);
            vertex(fragX + fragSize/2, fragY);
            vertex(fragX, fragY + fragSize);
            vertex(fragX - fragSize/2, fragY);
            endShape(CLOSE);
        }
        
        // Energy tendrils
        stroke(200, 50, 255, 100);
        strokeWeight(1);
        for (let i = 0; i < 8; i++) {
            let angle = (i / 8) * TWO_PI;
            let startX = cos(angle) * this.width * 0.25;
            let startY = sin(angle) * this.width * 0.25;
            
            let endAngle = angle + sin(this.pulsePhase + i) * 0.5;
            let endX = cos(endAngle) * this.width * 0.45;
            let endY = sin(endAngle) * this.width * 0.45;
            
            // Draw tendril as bezier curve
            noFill();
            bezier(
                startX, startY,
                startX * 1.5, startY * 1.5,
                endX * 0.8, endY * 0.8,
                endX, endY
            );
        }
        
        // Health indicator - arcane runes
        stroke(150, 0, 200, 200);
        strokeWeight(1);
        noFill();
        // Draw health as glowing runes around the ship
        for (let i = 0; i < this.health; i++) {
            let angle = (i / this.health) * TWO_PI;
            let runeX = cos(angle) * this.width * 0.3;
            let runeY = sin(angle) * this.width * 0.3;
            
            push();
            translate(runeX, runeY);
            rotate(angle + this.pulsePhase);
            
            // Draw a mystical rune symbol
            line(-3, -3, 3, 3);
            line(-3, 3, 3, -3);
            ellipse(0, 0, 8, 8);
            pop();
        }
        
        pop();
    }
}

// New boss enemy class - fixed to properly spawn and attack
class BossEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 120 + (level * 3); // More gradual size scaling
        this.height = 80 + (level * 2);
        this.speed = 0.7;
        this.points = 100 + (level * 15); // More gradual points scaling
        this.health = 8 + (level * 1.5); // More gradual health scaling
        this.maxHealth = this.health;
        
        // Movement pattern
        this.targetY = height * 0.2; // Boss stops at 20% down the screen
        this.phase = 'approach'; // approach, attack, retreat
        
        // Attack pattern variables
        this.attackCooldown = 2000 - (level * 70); // More gradual cooldown reduction
        this.lastAttackTime = millis(); // Initialize to current time
        this.attackPattern = 0; // 0, 1, 2 - different attack patterns
        this.patternStep = 0;
        this.lastPatternChange = millis();
        this.patternChangeCooldown = 8000; // Change patterns every 8 seconds
        
        // Visual effects
        this.shieldAlpha = 0; // Shield visual effect
        this.thrusterAngle = 0;
        this.weaponCharge = 0; // For charging weapon effect
        this.structuralDamage = 0;
        
        // Effects for scarier appearance
        this.tentaclePhase = 0;
        this.eyePhase = 0;
        this.mouthOpen = 0;
        this.bodyPulse = 0;
    }
    
    update() {
        this.frameCount += this.animationSpeed;
        
        // Update visual effects
        this.thrusterAngle = (this.thrusterAngle + 0.05) % TWO_PI;
        this.tentaclePhase = (this.tentaclePhase + 0.03) % TWO_PI;
        this.eyePhase = (this.eyePhase + 0.01) % TWO_PI;
        this.bodyPulse = (this.bodyPulse + 0.02) % TWO_PI;
        
        // Mouth opens when attacking or taking damage
        if (this.weaponCharge > 0 || this.shieldAlpha > 0) {
            this.mouthOpen = min(1, this.mouthOpen + 0.1);
        } else {
            this.mouthOpen = max(0, this.mouthOpen - 0.05);
        }
        
        // Movement based on phase
        if (this.phase === 'approach') {
            // Move down to target position
            this.y = min(this.y + this.speed, this.targetY);
            if (this.y >= this.targetY) {
                this.phase = 'attack';
                this.lastAttackTime = millis(); // Reset attack timer when reaching position
            }
        } else if (this.phase === 'attack') {
            // More aggressive movement at higher levels
            let moveFactor = 1 + (level * 0.2);
            // Move side to side during attack phase
            this.x += sin(this.frameCount * 0.02) * 1.5 * moveFactor;
            
            // Keep within screen bounds
            this.x = constrain(this.x, 0, width - this.width);
            
            // Update shield effect if damaged
            this.shieldAlpha = max(0, this.shieldAlpha - 0.01);
            
            // Change attack patterns periodically
            const currentTime = millis();
            if (currentTime - this.lastPatternChange > this.patternChangeCooldown) {
                this.lastPatternChange = currentTime;
                this.attackPattern = (this.attackPattern + 1) % 4; // Add a 4th pattern
                // Reset pattern step
                this.patternStep = 0;
            }
            
            // Generate attack based on current pattern
            if (currentTime - this.lastAttackTime > this.attackCooldown) {
                this.lastAttackTime = currentTime;
                this.patternStep = (this.patternStep + 1) % 6; // More steps for complex patterns
                this.weaponCharge = 1; // Start weapon charging effect
            }
            
            // Update weapon charge effect
            if (this.weaponCharge > 0) {
                this.weaponCharge = max(0, this.weaponCharge - 0.02);
            }
            
            // If health is critical, occasionally retreat and come back
            if (this.health <= this.maxHealth * 0.3 && random() < 0.001) {
                this.phase = 'retreat';
            }
        } else if (this.phase === 'retreat') {
            // Retreat upward
            this.y -= this.speed * 1.5;
            
            // If offscreen, reposition and approach again
            if (this.y < -this.height) {
                this.x = random(width - this.width);
                this.y = -this.height;
                this.phase = 'approach';
                
                // Regain some health during retreat
                this.health = min(this.maxHealth, this.health + 2);
            }
        }
    }
    
    display() {
        push();
        
        // Demonic shadow effect
        noStroke();
        fill(0, 0, 30, 80);
        beginShape();
        for (let i = 0; i < 20; i++) {
            let angle = i / 20 * TWO_PI;
            let radius = this.width * 0.6 + sin(angle * 3 + this.tentaclePhase) * 10;
            vertex(this.x + this.width/2 + cos(angle) * radius + 5, 
                   this.y + this.height/2 + sin(angle) * radius * 0.7 + 5);
        }
        endShape(CLOSE);
        
        // Eerie engine glow - pulsating with alien energy
        let engineGlow = 150 + sin(this.frameCount * 2) * 50;
        for (let i = 0; i < 3; i++) {
            let size = map(i, 0, 2, 40, 20);
            let alpha = map(i, 0, 2, 100, 200);
            fill(150, 0, 100, alpha); // Unsettling purple glow
            
            // Jagged, asymmetric thruster flame
            beginShape();
            for (let j = 0; j < 8; j++) {
                let angle = PI * 0.7 + (j / 8) * PI * 0.6;
                let len = 20 + sin(this.frameCount * 0.2 + j) * 8;
                vertex(this.x + this.width * 0.5 + cos(angle) * len,
                       this.y + this.height + sin(angle) * len);
            }
            endShape(CLOSE);
        }
        
        // Side thrusters with tentacle-like appearance
        fill(100, 0, 80, engineGlow);
        for (let side = -1; side <= 1; side += 2) {
            beginShape();
            for (let i = 0; i < 5; i++) {
                let x = this.x + this.width * 0.5 + side * this.width * 0.4;
                let y = this.y + this.height - 5 + sin(this.frameCount * 0.1 + i) * 5;
                vertex(x + sin(i) * 5, y + i * 2);
            }
            endShape(CLOSE);
        }
        
        // Main hull structure - biomechanical horror
        fill(40, 0, 30); // Very dark, almost black with slight red tint
        beginShape();
        for (let i = 0; i < 20; i++) {
            let angle, radius;
            if (i < 10) { // Top half of the ship
                angle = map(i, 0, 9, PI, TWO_PI);
                // More angular, threatening shape
                radius = this.width * 0.5 + sin(angle * 5 + this.bodyPulse) * 5;
                if (i == 0 || i == 9) radius *= 1.2; // Sharper corners
            } else { // Bottom half - more organic
                angle = map(i, 10, 19, 0, PI);
                radius = this.width * 0.5 + sin(angle * 3 + this.bodyPulse) * 8;
                if (i == 10 || i == 19) radius *= 0.8; // Indent at bottom sides
            }
            vertex(this.x + this.width/2 + cos(angle) * radius,
                   this.y + this.height/2 + sin(angle) * radius * 0.7);
        }
        endShape(CLOSE);
        
        // Spine-like central ridge
        fill(60, 0, 40);
        beginShape();
        for (let i = 0; i < 10; i++) {
            let xCenter = this.x + this.width * 0.5;
            let yStart = this.y + 5;
            let yEnd = this.y + this.height - 10;
            let y = map(i, 0, 9, yStart, yEnd);
            let xOffset = sin(i * 0.5 + this.bodyPulse) * 5;
            
            // Left vertex of segment
            vertex(xCenter - 10 + xOffset, y);
            // Right vertex of segment 
            vertex(xCenter + 10 + xOffset, y);
        }
        endShape(CLOSE);
        
        // Horrifying central "eye/mouth" organ
        // Outer rim
        fill(80, 0, 0);
        beginShape();
        for (let i = 0; i < 16; i++) {
            let angle = i / 16 * TWO_PI;
            let radius = 25 + sin(angle * 4 + this.eyePhase) * 5;
            // Open/close animation
            radius *= (1 - this.mouthOpen * 0.3);
            vertex(this.x + this.width * 0.5 + cos(angle) * radius,
                   this.y + this.height * 0.4 + sin(angle) * radius);
        }
        endShape(CLOSE);
        
        // Inner "iris" - glowing, pulsing
        fill(200, 0, 0, 150 + sin(this.frameCount) * 50);
        beginShape();
        for (let i = 0; i < 12; i++) {
            let angle = i / 12 * TWO_PI;
            let radius = 15 * (1 - this.mouthOpen * 0.5) + sin(angle * 3 + this.eyePhase * 2) * 3;
            vertex(this.x + this.width * 0.5 + cos(angle) * radius,
                   this.y + this.height * 0.4 + sin(angle) * radius);
        }
        endShape(CLOSE);
        
        // Central pupil/maw - deep void
        fill(0);
        ellipse(this.x + this.width * 0.5, 
                this.y + this.height * 0.4,
                10 + this.mouthOpen * 15, 
                10 + this.mouthOpen * 15);
        
        // When mouth opens, show inner teeth
        if (this.mouthOpen > 0.3) {
            stroke(200, 200, 200, this.mouthOpen * 255); // Bone white
            strokeWeight(1);
            for (let i = 0; i < 8; i++) {
                let angle = i / 8 * TWO_PI;
                line(this.x + this.width * 0.5, 
                     this.y + this.height * 0.4,
                     this.x + this.width * 0.5 + cos(angle) * (8 + this.mouthOpen * 8),
                     this.y + this.height * 0.4 + sin(angle) * (8 + this.mouthOpen * 8));
            }
            noStroke();
        }
        
        // Alien weapon systems - asymmetric and organic
        // Draw 3 pairs of weapon pods
        for (let i = 0; i < 3; i++) {
            let baseX = this.x + this.width * (0.2 + i * 0.3);
            let baseY = this.y + this.height * 0.6;
            
            // Weapon pod - organic/fluid shape
            fill(50, 0, 50);
            beginShape();
            for (let j = 0; j < 8; j++) {
                let angle = j / 8 * TWO_PI;
                let radius = 8 + sin(angle * 3 + this.frameCount * 0.1 + i) * 2;
                vertex(baseX + cos(angle) * radius,
                       baseY + sin(angle) * radius);
            }
            endShape(CLOSE);
            
            // Weapon "eye" - glowing
            if (this.weaponCharge > 0) {
                fill(255, 0, 0, this.weaponCharge * 255);
                ellipse(baseX, baseY, 10 * this.weaponCharge, 10 * this.weaponCharge);
            } else {
                fill(150, 0, 0, 100);
                ellipse(baseX, baseY, 5, 5);
            }
        }
        
        // Writhing tentacles along the sides
        for (let i = 0; i < 5; i++) {
            let startX = this.x + (i < 3 ? 10 : this.width - 10);
            let startY = this.y + 20 + i * 15;
            
            // More tentacles when severely damaged
            if (this.structuralDamage > 0.5 || i < 3) {
                stroke(70, 0, 50);
                strokeWeight(3);
                noFill();
                
                beginShape();
                for (let j = 0; j < 4; j++) {
                    let len = 15 + i * 3;
                    let angle = (i < 3 ? 0 : PI) + sin(this.tentaclePhase + i) * 0.5;
                    let segX = startX + cos(angle + j * 0.3) * len * (j+1)/4;
                    let segY = startY + sin(angle + j * 0.3) * len * (j+1)/4;
                    curveVertex(segX, segY);
                }
                endShape();
                
                // Claw/hook at the end
                if (this.structuralDamage > 0.3) {
                    fill(100, 0, 0);
                    noStroke();
                    let endX = startX + (i < 3 ? 40 : -40) + sin(this.tentaclePhase + i * 2) * 5;
                    let endY = startY + sin(this.tentaclePhase + i) * 10;
                    triangle(
                        endX, endY,
                        endX + (i < 3 ? 8 : -8), endY - 5,
                        endX + (i < 3 ? 8 : -8), endY + 5
                    );
                }
            }
        }
        
        // Shield effect when hit - energy field with runes
        if (this.shieldAlpha > 0) {
            noFill();
            stroke(200, 0, 100, this.shieldAlpha * 255);
            strokeWeight(3);
            
            // Eldritch rune shield
            beginShape();
            for (let i = 0; i < 20; i++) {
                let angle = i / 20 * TWO_PI;
                let radius = this.width * 0.7 + sin(angle * 8) * 10;
                vertex(this.x + this.width/2 + cos(angle) * radius,
                       this.y + this.height/2 + sin(angle) * radius * 0.7);
            }
            endShape(CLOSE);
            
            // Pulsing internal runic lines
            stroke(255, 0, 150, this.shieldAlpha * 150);
            strokeWeight(1);
            for (let i = 0; i < 4; i++) {
                let angle = this.frameCount * 0.01 + i * PI/2;
                line(
                    this.x + this.width/2, 
                    this.y + this.height/2,
                    this.x + this.width/2 + cos(angle) * this.width * 0.8,
                    this.y + this.height/2 + sin(angle) * this.height * 0.8
                );
            }
        }
        
        // Structural damage effects based on health percentage
        this.structuralDamage = map(this.health, this.maxHealth, 0, 0, 1);
        if (this.structuralDamage > 0.3) {
            // Wounds showing inner flesh/machinery
            noStroke();
            let damagePoints = floor(this.structuralDamage * 8);
            for (let i = 0; i < damagePoints; i++) {
                // Outer wound
                fill(80, 0, 0);
                let dx = this.x + random(20, this.width - 20);
                let dy = this.y + random(20, this.height - 20);
                let woundSize = 10 + random(10);
                
                beginShape();
                for (let j = 0; j < 8; j++) {
                    let angle = j / 8 * TWO_PI;
                    let radius = woundSize * 0.5 + random(3);
                    vertex(dx + cos(angle) * radius, dy + sin(angle) * radius);
                }
                endShape(CLOSE);
                
                // Inner flesh
                fill(150, 0, 0);
                beginShape();
                for (let j = 0; j < 6; j++) {
                    let angle = j / 6 * TWO_PI;
                    let radius = woundSize * 0.3 + random(2);
                    vertex(dx + cos(angle) * radius, dy + sin(angle) * radius);
                }
                endShape(CLOSE);
            }
            
            // Smoke/fluid particles from heavily damaged areas
            if (this.structuralDamage > 0.6 && frameCount % 5 == 0) {
                let smokeX = this.x + random(this.width);
                let smokeY = this.y + random(this.height * 0.5, this.height);
                let smokeColor = random() < 0.5 ? 
                    [100, 100, 100, 100] : // Dark smoke
                    [150, 0, 0, 150];      // Blood/fluid
                particleSystem.addParticles(smokeX, smokeY, 2, smokeColor);
            }
        }
        
        // Health bar - looks like a corrupted life force
        noStroke();
        // Background
        fill(30, 0, 20, 150);
        rect(this.x, this.y - 15, this.width, 5, 2);
        
        // Health level with pulsating effect
        let healthPercentage = this.health / this.maxHealth;
        let healthPulse = 1 + sin(this.frameCount * 0.1) * 0.1;
        
        // Color based on health level
        let healthColor;
        if (healthPercentage > 0.7) {
            healthColor = color(200, 0, 0, 200); // Deep red
        } else if (healthPercentage > 0.3) {
            healthColor = color(255, 50, 0, 200); // Bright red-orange
        } else {
            healthColor = color(255, 150, 0, 200); // Fiery orange
        }
        
        fill(healthColor);
        
        // Draw segmented health bar with gaps
        let segWidth = 10;
        let numSegs = floor((this.width * healthPercentage * healthPulse) / segWidth);
        for (let i = 0; i < numSegs; i++) {
            rect(this.x + i * segWidth, this.y - 15, segWidth - 1, 5, 1);
        }
        
        pop();
    }
    
    shoot() {
        const currentTime = millis();
        if (this.phase === 'attack' && currentTime - this.lastAttackTime > this.attackCooldown / 4 && this.weaponCharge > 0.2) {
            // Different attack patterns
            let bullets = [];
            
            // More complex patterns based on level and current attackPattern
            switch(this.attackPattern) {
                case 0: // Spread shot from main cannon
                    // More gradual bullet count increase
                    let spreadCount = 3 + Math.floor(level / 4);
                    for (let i = -(spreadCount/2); i <= (spreadCount/2); i++) {
                        let bullet = new Bullet(
                            this.x + this.width * 0.5,
                            this.y + this.height * 0.6,
                            'down',
                            true
                        );
                        bullet.speed = 4 + (level * 0.2); // More gradual speed increase
                        // Add spread angle
                        bullet.vx = i * 0.8;
                        bullets.push(bullet);
                    }
                    break;
                    
                case 1: // Side cannons firing
                    // More gradual side cannon count increase
                    let sideCount = 2 + Math.floor(level / 5);
                    for (let i = 0; i < sideCount; i++) {
                        // Left side
                        let leftBullet = new Bullet(
                            this.x + this.width * 0.25 - 15 + (i * 10) + 4,
                            this.y + this.height * 0.5 + 15,
                            'down',
                            true
                        );
                        // Right side
                        let rightBullet = new Bullet(
                            this.x + this.width * 0.75 - 15 + (i * 10) + 4,
                            this.y + this.height * 0.5 + 15,
                            'down',
                            true
                        );
                        leftBullet.speed = 3.5 + (level * 0.15); // More gradual speed increase
                        rightBullet.speed = 3.5 + (level * 0.15); // More gradual speed increase
                        bullets.push(leftBullet, rightBullet);
                    }
                    break;
                    
                case 2: // Aimed shot at player with prediction
                    if (typeof player !== 'undefined') {
                        // Try to predict where player will be
                        let predictX = player.x;
                        if (keyIsDown(LEFT_ARROW)) predictX -= 50;
                        if (keyIsDown(RIGHT_ARROW)) predictX += 50;
                        
                        let dx = (predictX + player.width/2) - (this.x + this.width/2);
                        let dy = (player.y + player.height/2) - (this.y + this.height/2);
                        let angle = atan2(dy, dx);
                        
                        // Multiple aimed shots
                        let aimCount = 1 + Math.floor(level / 2);
                        for (let i = 0; i < aimCount; i++) {
                            let angleOffset = map(i, 0, aimCount-1, -0.2, 0.2);
                            let bullet = new Bullet(
                                this.x + this.width * 0.5,
                                this.y + this.height * 0.6,
                                'down',
                                true
                            );
                            bullet.speed = 6 + (level * 0.3);
                            bullet.vx = cos(angle + angleOffset) * bullet.speed;
                            bullet.vy = sin(angle + angleOffset) * bullet.speed;
                            bullets.push(bullet);
                        }
                    } else {
                        // Fallback if player variable isn't accessible
                        let bullet = new Bullet(
                            this.x + this.width * 0.5,
                            this.y + this.height * 0.6,
                            'down',
                            true
                        );
                        bullets.push(bullet);
                    }
                    break;
                    
                case 3: // New spiral pattern (higher levels only)
                    if (level >= 5) {
                        // Number of bullets scales with level
                        let bulletCount = 6 + Math.floor(level / 2);
                        for (let i = 0; i < bulletCount; i++) {
                            // Create spiral pattern
                            let angle = (i / bulletCount) * TWO_PI + (this.patternStep * PI/3);
                            let bullet = new Bullet(
                                this.x + this.width * 0.5,
                                this.y + this.height * 0.5,
                                'down',
                                true
                            );
                            bullet.speed = 4 + (level * 0.2);
                            bullet.vx = cos(angle) * bullet.speed;
                            bullet.vy = sin(angle) * bullet.speed;
                            bullets.push(bullet);
                        }
                    } else {
                        // Fallback for lower levels
                        for (let i = -2; i <= 2; i++) {
                            let bullet = new Bullet(
                                this.x + this.width * 0.5,
                                this.y + this.height * 0.6,
                                'down',
                                true
                            );
                            bullet.vx = i * 1.2;
                            bullets.push(bullet);
                        }
                    }
                    break;
            }
            
            // Add muzzle flash effects
            if (bullets.length > 0) {
                if (this.attackPattern === 0 || this.attackPattern === 2 || this.attackPattern === 3) {
                    particleSystem.addParticles(
                        this.x + this.width * 0.5,
                        this.y + this.height * 0.6,
                        5,
                        [200, 230, 255]
                    );
                } else if (this.attackPattern === 1) {
                    for (let i = 0; i < 3; i++) {
                        particleSystem.addParticles(
                            this.x + this.width * 0.25 - 15 + (i * 10) + 4,
                            this.y + this.height * 0.5 + 15,
                            3,
                            [200, 230, 255]
                        );
                        particleSystem.addParticles(
                            this.x + this.width * 0.75 - 15 + (i * 10) + 4,
                            this.y + this.height * 0.5 + 15,
                            3,
                            [200, 230, 255]
                        );
                    }
                }
            }
            
            return bullets;
        }
        return [];
    }
    
    hit() {
        this.health--;
        this.shieldAlpha = 1; // Flash shield effect when hit
        
        // Add particle effects based on hit location
        let hitX = random(this.x, this.x + this.width);
        let hitY = random(this.y, this.y + this.height);
        particleSystem.addParticles(hitX, hitY, 10, [255, 255, 255]);
        
        // Flash effect
        particleSystem.addParticles(
            this.x + this.width/2,
            this.y + this.height/2,
            5,
            [100, 200, 255]
        );
        
        return this.health <= 0;
    }
    
    isOffScreen() {
        // Boss only considered off screen if completely above the canvas
        return this.y + this.height < 0;
    }
} 