class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = 3;
        this.type = type; // 'tripleShot', 'speedBoost', 'shield'
        this.colors = {
            tripleShot: [0, 255, 0],    // Green
            speedBoost: [255, 255, 0],  // Yellow
            shield: [0, 200, 255]       // Blue
        };
        
        // Visual effect properties
        this.angle = random(TWO_PI); // Rotation angle
        this.rotationSpeed = random(0.02, 0.05); // How fast it rotates
        this.pulseAmount = random(0.5, 1.5); // How much it pulses
        this.pulseSpeed = random(0.05, 0.1); // How fast it pulses
        this.glowSize = 0; // Size of the glow effect
        this.glowSpeed = 0.05; // Speed of the glow animation
        this.sparkleTimer = 0; // Timer for sparkle effect
        this.orbitRadius = random(3, 8); // Radius of orbiting particles
        this.orbitSpeed = random(0.05, 0.1); // Speed of orbiting particles
    }
    
    update() {
        this.y += this.speed;
        
        // Update visual effects
        this.angle += this.rotationSpeed;
        this.glowSize = 5 + sin(frameCount * this.pulseSpeed) * this.pulseAmount;
        this.sparkleTimer += 0.1;
        
        // Add trailing particles occasionally
        if (random() < 0.1 && typeof particleSystem !== 'undefined') {
            particleSystem.addParticles(
                this.x, 
                this.y, 
                1, 
                this.colors[this.type],
                'spark'
            );
        }
    }
    
    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        // Draw glow effect
        noStroke();
        const color = this.colors[this.type];
        for (let i = 3; i > 0; i--) {
            fill(color[0], color[1], color[2], 50 / i);
            ellipse(0, 0, this.width + this.glowSize * i, this.height + this.glowSize * i);
        }
        
        // Draw power-up shape
        fill(color[0], color[1], color[2], 200);
        
        // Different shapes based on power-up type
        switch (this.type) {
            case 'tripleShot':
                // Triple bullet symbol
                ellipse(0, 0, this.width, this.height);
                fill(255);
                rect(-8, -2, 5, 4);
                rect(-1.5, -2, 5, 4);
                rect(5, -2, 5, 4);
                break;
                
            case 'speedBoost':
                // Flame symbol
                beginShape();
                vertex(0, -10);  // Top
                vertex(-8, 5);   // Bottom left
                vertex(0, 0);    // Middle indent
                vertex(8, 5);    // Bottom right
                endShape(CLOSE);
                
                // Inner flame
                fill(255, 255, 200);
                beginShape();
                vertex(0, -5);   // Top
                vertex(-4, 3);   // Bottom left
                vertex(0, 0);    // Middle indent
                vertex(4, 3);    // Bottom right
                endShape(CLOSE);
                break;
                
            case 'shield':
                // Shield shape
                beginShape();
                for (let a = 0; a < TWO_PI; a += 0.25) {
                    let r = 10 + sin(a * 3) * 3;
                    let x = cos(a) * r;
                    let y = sin(a) * r;
                    vertex(x, y);
                }
                endShape(CLOSE);
                
                // Inner shield detail
                fill(255, 255, 255, 120);
                beginShape();
                for (let a = 0; a < TWO_PI; a += 0.5) {
                    let r = 6 + sin(a * 2) * 1;
                    let x = cos(a) * r;
                    let y = sin(a) * r;
                    vertex(x, y);
                }
                endShape(CLOSE);
                break;
        }
        
        // Draw orbiting particles
        for (let i = 0; i < 3; i++) {
            let orbitAngle = this.angle * 2 + i * TWO_PI / 3;
            let ox = cos(orbitAngle) * this.orbitRadius;
            let oy = sin(orbitAngle) * this.orbitRadius;
            
            fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 50);
            ellipse(ox, oy, 3, 3);
        }
        
        // Draw occasional sparkles
        if (random() < 0.1) {
            stroke(255, 255, 255, 200);
            strokeWeight(0.5);
            let sx = random(-this.width/2, this.width/2);
            let sy = random(-this.height/2, this.height/2);
            let sparkSize = random(3, 6);
            line(sx - sparkSize/2, sy, sx + sparkSize/2, sy);
            line(sx, sy - sparkSize/2, sx, sy + sparkSize/2);
        }
        
        pop();
    }
    
    isOffScreen() {
        return this.y > height;
    }
    
    collidesWith(player) {
        return (
            this.x + this.width / 2 > player.x &&
            this.x - this.width / 2 < player.x + player.width &&
            this.y + this.height / 2 > player.y &&
            this.y - this.height / 2 < player.y + player.height
        );
    }
    
    apply(player) {
        // Create visual effect for power-up collection
        if (typeof particleSystem !== 'undefined') {
            // Create explosion of particles matching power-up color
            for (let i = 0; i < 20; i++) {
                let px = this.x + random(-20, 20);
                let py = this.y + random(-20, 20);
                particleSystem.addParticles(px, py, 1, this.colors[this.type], 'spark');
            }
        }
        
        // Apply power-up effect and show appropriate notification
        switch (this.type) {
            case 'tripleShot':
                player.activateTripleShot();
                // Show notification for triple shot
                if (typeof showSideNotification === 'function') {
                    showSideNotification(
                        "BURST FIRE ACQUIRED!", 
                        null, // Remove subtitle text
                        [255, 50, 50], 
                        120
                    );
                }
                break;
                
            case 'speedBoost':
                player.activateSpeedBoost();
                // Show notification for speed boost
                if (typeof showSideNotification === 'function') {
                    showSideNotification(
                        "NITRO BOOST ACQUIRED!", 
                        null, // Remove subtitle text
                        [255, 150, 0], 
                        120
                    );
                }
                break;
                
            case 'shield':
                player.activateShield();
                // Show notification for shield
                if (typeof showSideNotification === 'function') {
                    showSideNotification(
                        "SHIELD ACTIVATED!", 
                        null, // Remove subtitle text
                        [0, 200, 255], 
                        120
                    );
                }
                break;
        }
    }
} 