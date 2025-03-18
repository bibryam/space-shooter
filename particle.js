class Particle {
    constructor(x, y, color, type = 'default') {
        this.position = createVector(x, y);
        this.type = type; // 'default', 'spark', 'smoke', 'debris'
        this.color = color || [255, 255, 255];
        
        // Different behavior based on particle type
        switch(this.type) {
            case 'spark':
                this.velocity = createVector(random(-3, 3), random(-3, 3));
                this.acceleration = createVector(0, 0.05);
                this.lifespan = 100 + random(-20, 20);
                this.size = random(1, 3);
                this.rotationSpeed = random(-0.1, 0.1);
                this.rotation = random(TWO_PI);
                break;
                
            case 'smoke':
                this.velocity = createVector(random(-0.5, 0.5), random(-1, -2));
                this.acceleration = createVector(0, -0.01);
                this.lifespan = 200 + random(-20, 80);
                this.size = random(3, 8);
                this.growRate = random(0.01, 0.03);
                break;
                
            case 'debris':
                this.velocity = createVector(random(-2, 2), random(-2, 2));
                this.acceleration = createVector(0, 0.1);
                this.lifespan = 150 + random(-20, 20);
                this.size = random(2, 4);
                this.rotationSpeed = random(-0.2, 0.2);
                this.rotation = random(TWO_PI);
                break;
                
            default: // Regular particle
                this.velocity = createVector(random(-2, 2), random(-2, 2));
                this.acceleration = createVector(0, 0.05);
                this.lifespan = 255;
                this.size = random(3, 8);
                break;
        }
    }
    
    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        
        // Type-specific updates
        switch(this.type) {
            case 'spark':
                this.lifespan -= 5;
                this.rotation += this.rotationSpeed;
                break;
                
            case 'smoke':
                this.lifespan -= 2;
                this.size += this.growRate;
                // Smoke particles slow down as they rise
                this.velocity.mult(0.98);
                break;
                
            case 'debris':
                this.lifespan -= 4;
                this.rotation += this.rotationSpeed;
                break;
                
            default:
                this.lifespan -= 4;
                break;
        }
    }
    
    display() {
        noStroke();
        
        switch(this.type) {
            case 'spark':
                // Sparks have moving glow effect
                for (let i = 2; i > 0; i--) {
                    fill(this.color[0], this.color[1], this.color[2], this.lifespan / (i * 2));
                    ellipse(this.position.x, this.position.y, this.size * i, this.size * i);
                }
                // Core
                fill(255, 255, 255, this.lifespan);
                ellipse(this.position.x, this.position.y, this.size, this.size);
                break;
                
            case 'smoke':
                // Smoke is semi-transparent and fades gradually
                fill(this.color[0], this.color[1], this.color[2], this.lifespan / 8);
                ellipse(this.position.x, this.position.y, this.size, this.size);
                break;
                
            case 'debris':
                push();
                translate(this.position.x, this.position.y);
                rotate(this.rotation);
                // Irregular shape for debris
                fill(this.color[0], this.color[1], this.color[2], this.lifespan);
                beginShape();
                vertex(-this.size, -this.size);
                vertex(this.size, -this.size / 2);
                vertex(this.size / 2, this.size);
                vertex(-this.size / 2, this.size / 2);
                endShape(CLOSE);
                pop();
                break;
                
            default:
                // Regular particles
                fill(this.color[0], this.color[1], this.color[2], this.lifespan);
                ellipse(this.position.x, this.position.y, this.size, this.size);
                break;
        }
    }
    
    isDead() {
        return this.lifespan < 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addParticles(x, y, count, color, type = 'default') {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, type));
        }
    }
    
    createExplosion(x, y, color, scale = 1.0) {
        // Core bright flash
        for (let i = 0; i < 10 * scale; i++) {
            let flashParticle = new Particle(x, y, [255, 255, 255], 'spark');
            flashParticle.velocity = createVector(random(-3, 3) * scale, random(-3, 3) * scale);
            flashParticle.size = random(2, 5) * scale;
            flashParticle.lifespan = 60 + random(-10, 20);
            this.particles.push(flashParticle);
        }
        
        // Main explosion particles
        for (let i = 0; i < 20 * scale; i++) {
            let p = new Particle(x, y, color, 'spark');
            p.velocity = createVector(random(-4, 4) * scale, random(-4, 4) * scale);
            p.size = random(3, 6) * scale;
            p.lifespan = 100 + random(-20, 50);
            this.particles.push(p);
        }
        
        // Smoke effect
        for (let i = 0; i < 5 * scale; i++) {
            let smokeColor = [min(color[0] + 100, 255), min(color[1] + 100, 255), min(color[2] + 100, 255)];
            let p = new Particle(x, y, smokeColor, 'smoke');
            p.velocity = createVector(random(-1, 1), random(-1, 0));
            p.size = random(10, 20) * scale;
            this.particles.push(p);
        }
        
        // Debris effect
        for (let i = 0; i < 15 * scale; i++) {
            let p = new Particle(x, y, color, 'debris');
            p.velocity = createVector(random(-5, 5) * scale, random(-5, 5) * scale);
            p.size = random(2, 4) * scale;
            this.particles.push(p);
        }
    }
    
    // Create a smaller impact effect for non-destructive hits
    createImpact(x, y, color) {
        // Small particles
        for (let i = 0; i < 8; i++) {
            const angle = random(TWO_PI);
            const distance = random(2, 5);
            const px = x + cos(angle) * distance;
            const py = y + sin(angle) * distance;
            this.particles.push(new Particle(px, py, color));
        }
        
        // Sparks
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, [255, 255, 200], 'spark'));
        }
    }
    
    // Create a thruster effect for ships
    createThruster(x, y, direction = 'down') {
        const thrusterColors = [
            [255, 200, 50],  // Yellow-orange
            [255, 150, 0],   // Orange
            [255, 100, 0]    // Reddish
        ];
        
        // Base direction vector
        let vx = 0;
        let vy = direction === 'down' ? 2 : -2;
        
        // Spread
        for (let i = 0; i < 3; i++) {
            const p = new Particle(
                x + random(-3, 3), 
                y, 
                thrusterColors[floor(random(thrusterColors.length))],
                'spark'
            );
            
            // Override velocity for directional thrust
            p.velocity = createVector(vx + random(-0.5, 0.5), vy + random(-0.3, 0.3));
            p.lifespan = 50 + random(-10, 10);
            
            this.particles.push(p);
        }
    }
    
    run() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.display();
            
            if (p.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
} 