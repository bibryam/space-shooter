class Bullet {
    constructor(x, y, direction, isEnemy = false, customWidth = null, customHeight = null) {
        this.x = x;
        this.y = y;
        this.width = customWidth || 5;
        this.height = customHeight || 15;
        this.speed = 7;
        this.direction = direction; // 'up' or 'down'
        this.isEnemy = isEnemy;
        
        // Visual effect properties
        this.glowAlpha = 255;
        this.glowSize = this.isEnemy ? 1.5 : 2;
        this.trailTimer = 0;
        
        // Velocity components for angled bullets (used by boss)
        this.vx = 0;
        this.vy = this.direction === 'up' ? -this.speed : this.speed;
        
        // Color based on type
        if (this.isEnemy) {
            this.color = [255, 100, 0]; // Orange for enemy bullets
            this.glowColor = [255, 150, 50]; // Lighter orange glow
        } else {
            // For player rockets, use more intense colors based on size
            const sizeMultiplier = (this.width > 5) ? this.width / 5 : 1;
            this.color = [0, 220 - sizeMultiplier * 20, 255]; // Adjust color based on rocket size
            this.glowColor = [100, 255, 255]; // Lighter cyan glow
        }
        
        // If this is a rocket (larger player bullet), add special effects
        this.isRocket = !isEnemy && (customWidth > 5 || customHeight > 15);
    }
    
    update() {
        // Use velocity components if available
        if (this.vx !== 0) {
            this.x += this.vx;
            this.y += this.vy;
        } else {
            // Otherwise use simple up/down movement
            if (this.direction === 'up') {
                this.y -= this.speed;
            } else if (this.direction === 'down') {
                this.y += this.speed;
            }
        }
        
        // Create trail particles occasionally
        this.trailTimer++;
        if (this.trailTimer > 5) {
            this.trailTimer = 0;
            
            // Add a trail particle
            if (typeof particleSystem !== 'undefined') {
                let trailColor = [...this.color, 150]; // Semi-transparent
                
                // For rockets, create more substantial trail
                if (this.isRocket) {
                    // Add rocket exhaust trail - reduced from 2 to 1 particles
                    for (let i = 0; i < 1; i++) {
                        particleSystem.addParticles(
                            this.x + random(-this.width/2, this.width/2),
                            this.direction === 'up' ? this.y + this.height : this.y,
                            1,
                            [255, 200, 50, 150], // Rocket exhaust color
                            'smoke'
                        );
                    }
                } else {
                    // Regular bullet trail - emit particles less frequently
                    // Only add trail particles when random chance happens (50% chance)
                    if (random() < 0.5) {
                        particleSystem.addParticles(
                            this.x,
                            this.direction === 'up' ? this.y + this.height : this.y,
                            1,
                            trailColor
                        );
                    }
                }
            }
        }
    }
    
    display() {
        push();
        
        // Draw glow effect
        noStroke();
        
        // Outer glow
        for (let i = 3; i > 0; i--) {
            let size = i * this.glowSize;
            let alpha = this.glowAlpha / (i * 2);
            
            fill(this.glowColor[0], this.glowColor[1], this.glowColor[2], alpha);
            
            // Elliptical glow, elongated in direction of travel
            if (this.direction === 'up') {
                ellipse(this.x, this.y + this.height/2, this.width + size, this.height + size * 1.5);
            } else {
                ellipse(this.x, this.y + this.height/2, this.width + size, this.height + size * 1.5);
            }
        }
        
        // Main bullet body
        fill(this.color[0], this.color[1], this.color[2]);
        
        if (this.isEnemy) {
            // Enemy bullets - diamond shape
            beginShape();
            vertex(this.x, this.y); // top
            vertex(this.x + this.width/2, this.y + this.height/2); // right
            vertex(this.x, this.y + this.height); // bottom
            vertex(this.x - this.width/2, this.y + this.height/2); // left
            endShape(CLOSE);
        } else if (this.isRocket) {
            // Player rockets - more detailed rocket shape
            // Rocket body
            rect(this.x - this.width/2, this.y, this.width, this.height * 0.8, 2);
            
            // Rocket nose
            fill(220, 220, 220);
            triangle(
                this.x - this.width/2, this.y + this.height * 0.2,
                this.x + this.width/2, this.y + this.height * 0.2,
                this.x, this.y
            );
            
            // Rocket fins
            fill(50, 100, 200);
            // Left fin
            triangle(
                this.x - this.width/2, this.y + this.height * 0.8,
                this.x - this.width/2, this.y + this.height,
                this.x - this.width, this.y + this.height
            );
            // Right fin
            triangle(
                this.x + this.width/2, this.y + this.height * 0.8,
                this.x + this.width/2, this.y + this.height,
                this.x + this.width, this.y + this.height
            );
            
            // Rocket exhaust
            fill(255, 200, 50, 150 + sin(frameCount * 0.5) * 50);
            ellipse(this.x, this.y + this.height, this.width * 0.6, this.height * 0.3);
        } else {
            // Regular player bullets - energy bolt shape
            beginShape();
            vertex(this.x, this.y); // top
            vertex(this.x + this.width/2, this.y + this.height/3); // right upper
            vertex(this.x + this.width/3, this.y + this.height/2); // right middle
            vertex(this.x + this.width/2, this.y + this.height * 2/3); // right lower
            vertex(this.x, this.y + this.height); // bottom
            vertex(this.x - this.width/2, this.y + this.height * 2/3); // left lower
            vertex(this.x - this.width/3, this.y + this.height/2); // left middle
            vertex(this.x - this.width/2, this.y + this.height/3); // left upper
            endShape(CLOSE);
            
            // Energy pulse effect inside player bullets
            let pulseSize = 2 + sin(frameCount * 0.3) * 1;
            fill(255, 255, 255, 150);
            ellipse(this.x, this.y + this.height/2, pulseSize, pulseSize * 2);
        }
        
        pop();
    }
    
    isOffScreen() {
        return this.y < -this.height || this.y > height || this.x < -this.width || this.x > width + this.width;
    }
    
    hits(target) {
        // Skip collision if target is a player and is invincible
        if (target.canBeHit !== undefined && !target.canBeHit()) {
            console.log("Bullet.hits() detected invincibility, skipping collision"); // Debug info
            return false;
        }
        
        // Simple AABB collision detection
        return (
            this.x + this.width / 2 > target.x &&
            this.x - this.width / 2 < target.x + target.width &&
            this.y < target.y + target.height &&
            this.y + this.height > target.y
        );
    }
} 