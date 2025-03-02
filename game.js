class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');

        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 600;

        // Mobile control properties
        this.isMobile = 'ontouchstart' in window;
        this.tiltSensitivity = 2.5;
        this.tiltThreshold = 2;

        // Game properties
        this.score = 0;
        this.gravity = 3.6;  // Increased from 2.4 for even faster falling
        this.isGameOver = false;
        this.lastTime = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS

        // Minigame properties
        this.inMinigame = false;
        this.minigameTimer = 0;
        this.minigameDuration = 5000; // 5 seconds
        this.enteringMinigame = false;
        this.enterMinigameTimer = 0;
        this.enterMinigameDuration = 1000; // 1 second animation
        this.enterMinigameStartPos = { x: 0, y: 0 };
        this.enterMinigameTargetPos = { x: 0, y: 0 };
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
            velocityX: 0,
            velocityY: 0
        };
        this.beam = {
            width: 120,
            height: 10,
            angle: 0,
            maxAngle: Math.PI / 6, // 30 degrees
            tiltSpeed: 0.003,
            minWidth: 40, // Minimum width the beam can shrink to
            initialWidth: 120 // Store initial width for shrinking effect
        };

        // Platform properties
        this.platforms = [];
        this.platformWidth = 60;
        this.platformHeight = 15;
        this.platformCount = 7;
        this.specialPlatformInterval = 5; // Every 5th platform is special
        this.lastSpecialPlatform = 0;

        // Player properties
        this.player = {
            width: 30,
            height: 30,
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            velocityX: 0,
            velocityY: -0.6,
            jumpForce: -5.7, // Increased from -3.8 (1.5x stronger)
            speed: 180, // Increased from 120 (1.5x faster)
            isJumping: false
        };

        // Input handling
        this.keys = {
            left: false,
            right: false
        };

        // Animation properties
        this.rocketBoost = {
            active: false,
            duration: 2000, // 2 seconds animation
            timer: 0,
            targetY: 0,
            startY: 0,
            particles: [],
            scoreGained: 0
        };
        
        // Add falling animation properties
        this.fallingAnimation = {
            active: false,
            duration: 2000, // 2 seconds animation
            timer: 0,
            targetY: 0,
            startY: 0
        };

        // Initialize game
        this.setupEventListeners();
        this.generateInitialPlatforms();
        
        // Ensure player starts on a platform
        this.createStartPlatform();
        
        // Start game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    createStartPlatform() {
        // Create a platform directly under the player
        const startPlatform = {
            x: this.player.x - this.platformWidth / 2,
            y: this.player.y + this.player.height
        };
        this.platforms[0] = startPlatform;
    }

    setupEventListeners() {
        // Keyboard controls for desktop
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
        });

        // Mobile controls using device orientation
        if ('ontouchstart' in window) {
            // Request permission for device orientation on iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.body.addEventListener('click', () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                this.enableDeviceOrientation();
                            }
                        })
                        .catch(console.error);
                }, { once: true });
            } else {
                // Android and older iOS versions
                this.enableDeviceOrientation();
            }
        }
    }

    enableDeviceOrientation() {
        window.addEventListener('deviceorientation', (e) => {
            // gamma is the left-to-right tilt in degrees
            const tilt = e.gamma;
            this.lastTilt = tilt; // Store tilt value for sensitivity calculations
            
            // Clear existing input
            this.keys.left = false;
            this.keys.right = false;
            
            // Apply tilt controls with threshold
            if (Math.abs(tilt) > this.tiltThreshold) {
                if (tilt < -this.tiltThreshold) {
                    this.keys.left = true;
                } else if (tilt > this.tiltThreshold) {
                    this.keys.right = true;
                }
            }
        });
    }

    generateInitialPlatforms() {
        for (let i = 0; i < this.platformCount; i++) {
            this.platforms.push({
                x: Math.random() * (this.canvas.width - this.platformWidth),
                y: i * (this.canvas.height / this.platformCount),
                isSpecial: false
            });
        }
    }

    startMinigame() {
        // Start enter animation
        this.enteringMinigame = true;
        this.enterMinigameTimer = 0;
        this.enterMinigameStartPos = {
            x: this.player.x,
            y: this.player.y
        };
        
        // Find the special platform that triggered this
        const specialPlatform = this.platforms.find(p => p.isSpecial);
        if (specialPlatform) {
            this.enterMinigameTargetPos = {
                x: specialPlatform.x + this.platformWidth / 2,
                y: specialPlatform.y + this.platformHeight / 2
            };
        }
    }

    updateMinigame(deltaTime) {
        // Update minigame timer
        this.minigameTimer += deltaTime;

        // Use fixed time step for physics
        const fixedDelta = this.fixedTimeStep / 1000;

        // Calculate difficulty progression (0 to 1)
        const difficultyProgress = Math.min(this.minigameTimer / this.minigameDuration, 1);

        // Dynamic difficulty adjustments
        const currentGravity = 8.0 + (difficultyProgress * 4.0); // Gravity increases from 8.0 to 12.0
        const currentTiltSpeed = this.beam.tiltSpeed * (1 + difficultyProgress * 2); // Tilt speed increases up to 3x
        
        // Shrink beam width over time
        this.beam.width = this.beam.initialWidth - (difficultyProgress * (this.beam.initialWidth - this.beam.minWidth));

        // If this is the first frame of the minigame, set a random initial angle
        if (this.minigameTimer <= deltaTime) {
            this.beam.angle = (Math.random() * 2 - 1) * this.beam.maxAngle;
        }

        // Update beam angle based on input with dynamic tilt speed
        if (this.keys.left) {
            const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
            this.beam.angle = Math.max(-this.beam.maxAngle, this.beam.angle - currentTiltSpeed * fixedDelta * 1000 * tiltMultiplier);
        } else if (this.keys.right) {
            const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
            this.beam.angle = Math.min(this.beam.maxAngle, this.beam.angle + currentTiltSpeed * fixedDelta * 1000 * tiltMultiplier);
        }

        // Apply gravity
        this.ball.velocityY += currentGravity * fixedDelta;
        
        // Update ball position
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;

        // Check ball collision with beam
        const beamY = this.canvas.height / 2 + 50;
        const beamLeft = this.canvas.width / 2 - this.beam.width / 2;
        const beamRight = this.canvas.width / 2 + this.beam.width / 2;

        // Calculate beam height at ball's x position
        const relativeX = this.ball.x - this.canvas.width / 2;
        const beamHeightAtX = Math.sin(this.beam.angle) * relativeX;
        const beamYAtX = beamY + beamHeightAtX;

        // Ball-beam collision with elastic bounce
        if (this.ball.x >= beamLeft && this.ball.x <= beamRight &&
            Math.abs(this.ball.y - beamYAtX) < this.ball.radius + this.beam.height / 2) {
            this.ball.y = beamYAtX - this.ball.radius;
            
            // Stop vertical movement when on beam
            this.ball.velocityY = 0;
            
            // Only apply horizontal force when ball is on the beam
            this.ball.velocityX += Math.sin(this.beam.angle) * currentGravity * fixedDelta;
        }

        // Check for failure (ball outside screen)
        if (this.ball.x < -this.ball.radius || 
            this.ball.x > this.canvas.width + this.ball.radius || 
            this.ball.y < -this.ball.radius ||
            this.ball.y > this.canvas.height + this.ball.radius) {
            this.endMinigame(false);
        }

        // Check for success (time's up)
        if (this.minigameTimer >= this.minigameDuration) {
            this.endMinigame(true);
        }
    }

    endMinigame(success) {
        this.inMinigame = false;
        if (success) {
            // Start rocket boost animation
            this.rocketBoost.active = true;
            this.rocketBoost.timer = 0;
            this.rocketBoost.startY = this.player.y;
            this.rocketBoost.targetY = this.player.y - 200;
            this.rocketBoost.particles = [];
            this.rocketBoost.scoreGained = 0;
            // Create initial particles
            for (let i = 0; i < 20; i++) {
                this.rocketBoost.particles.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() * 5 + 5),
                    life: Math.random() * 0.5 + 0.5
                });
            }
            } else {
            // Start falling animation
            this.fallingAnimation.active = true;
            this.fallingAnimation.timer = 0;
            this.fallingAnimation.startY = this.player.y;
            this.fallingAnimation.targetY = this.player.y + 200;
            
            // Deduct points
            const fallDistance = Math.min(200, this.score);
            this.score = Math.max(0, this.score - fallDistance);
            this.scoreElement.textContent = this.score;
        }
    }

    drawMinigame() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw timer
        const timeLeft = (this.minigameDuration - this.minigameTimer) / 1000;
        this.ctx.fillStyle = '#333';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Time: ${timeLeft.toFixed(1)}s`, 10, 30);

        // Draw beam with dynamic width
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.rotate(this.beam.angle);
        
        // Beam shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(-this.beam.width / 2 + 5, 5, this.beam.width, this.beam.height);
        
        // Golden beam with gradient and pulsing effect
        const timeScale = Date.now() / 500;
        const pulseIntensity = 0.1 * Math.sin(timeScale);
        const gradient = this.ctx.createLinearGradient(-this.beam.width / 2, 0, this.beam.width / 2, this.beam.height);
        gradient.addColorStop(0, `hsl(51, 100%, ${60 + pulseIntensity * 10}%)`);
        gradient.addColorStop(0.5, `hsl(51, 100%, ${75 + pulseIntensity * 10}%)`);
        gradient.addColorStop(1, `hsl(51, 100%, ${60 + pulseIntensity * 10}%)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-this.beam.width / 2, 0, this.beam.width, this.beam.height);
        
        this.ctx.restore();

        // Draw ball with shadow
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        const ballGradient = this.ctx.createRadialGradient(
            this.ball.x - this.ball.radius/3, 
            this.ball.y - this.ball.radius/3, 
            0,
            this.ball.x,
            this.ball.y,
            this.ball.radius
        );
        ballGradient.addColorStop(0, '#FFFFFF');
        ballGradient.addColorStop(1, '#87CEEB');
        this.ctx.fillStyle = ballGradient;
        this.ctx.fill();
    }

    update(deltaTime) {
        if (this.isGameOver) return;

        // Handle minigame enter animation
        if (this.enteringMinigame) {
            this.enterMinigameTimer += deltaTime;
            const progress = Math.min(this.enterMinigameTimer / this.enterMinigameDuration, 1);
            
            // Ease-in-out function for smooth animation
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Move player to center of special platform
            this.player.x = this.enterMinigameStartPos.x + (this.enterMinigameTargetPos.x - this.enterMinigameStartPos.x) * easeProgress;
            this.player.y = this.enterMinigameStartPos.y + (this.enterMinigameTargetPos.y - this.enterMinigameStartPos.y) * easeProgress;
            
            // When animation is complete, start the actual minigame
            if (progress >= 1) {
                this.enteringMinigame = false;
                this.inMinigame = true;
                this.minigameTimer = 0;
                this.ball = {
                    x: this.canvas.width / 2,
                    y: this.canvas.height / 2 - 100,
                    radius: 10,
                    velocityX: 0,
                    velocityY: 0
                };
                this.beam.angle = 0;
            }
            return;
        }

        if (this.inMinigame) {
            this.updateMinigame(deltaTime);
            return;
        }

        // Use fixed time step for physics
        const fixedDelta = this.fixedTimeStep / 1000;

        // Handle falling animation
        if (this.fallingAnimation.active) {
            this.fallingAnimation.timer += deltaTime;
            
            // Update player position with easing
            const progress = Math.min(this.fallingAnimation.timer / this.fallingAnimation.duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Calculate movement for this frame
            const fallSpeed = 0.5; // Base speed in pixels per millisecond
            const moveThisFrame = fallSpeed * deltaTime;
            const platformSpacing = this.canvas.height / this.platformCount;
            
            // Handle horizontal movement during fall
            if (this.keys.left) {
                const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
                this.player.x -= this.player.speed * tiltMultiplier * fixedDelta;
            } else if (this.keys.right) {
                const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
                this.player.x += this.player.speed * tiltMultiplier * fixedDelta;
            }
            
            // Screen wrapping during fall
            if (this.player.x > this.canvas.width) {
                this.player.x = 0;
            } else if (this.player.x < 0) {
                this.player.x = this.canvas.width;
            }
            
            // Move platforms up to create downward movement illusion
            for (let platform of this.platforms) {
                platform.y -= moveThisFrame;
            }

            // Remove platforms that are too high up
            this.platforms = this.platforms.filter(platform => platform.y > -platformSpacing);

            // Track the lowest platform
            let lowestPlatform = -Infinity;
            for (let platform of this.platforms) {
                lowestPlatform = Math.max(lowestPlatform, platform.y);
            }
            
            // Add platforms at the bottom if needed
            while (lowestPlatform < this.canvas.height + platformSpacing) {
                this.platforms.push({
                    x: Math.random() * (this.canvas.width - this.platformWidth),
                    y: lowestPlatform + platformSpacing,
                    isSpecial: false
                });
                lowestPlatform += platformSpacing;
            }

            // End animation
            if (this.fallingAnimation.timer >= this.fallingAnimation.duration) {
                this.fallingAnimation.active = false;
                this.player.velocityY = 0.2; // Gentle downward velocity for smooth transition
            }

            return;
        }

        // Handle rocket boost animation
        if (this.rocketBoost.active) {
            this.rocketBoost.timer += deltaTime;
            
            // Update player position with easing
            const progress = Math.min(this.rocketBoost.timer / this.rocketBoost.duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Calculate movement for this frame
            const boostSpeed = 0.5; // Base speed in pixels per millisecond
            const moveThisFrame = boostSpeed * deltaTime;
            const platformSpacing = this.canvas.height / this.platformCount;
            
            // Handle horizontal movement during boost
            if (this.keys.left) {
                const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
                this.player.x -= this.player.speed * tiltMultiplier * fixedDelta;
            } else if (this.keys.right) {
                const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
                this.player.x += this.player.speed * tiltMultiplier * fixedDelta;
            }
            
            // Screen wrapping during boost
            if (this.player.x > this.canvas.width) {
                this.player.x = 0;
            } else if (this.player.x < 0) {
                this.player.x = this.canvas.width;
            }
            
            // Move platforms down to create upward movement illusion
            for (let platform of this.platforms) {
                platform.y += moveThisFrame;
                
                // Add points when platform moves off screen
                if (platform.y > this.canvas.height + platformSpacing) {
                    this.score += 10;
                    this.scoreElement.textContent = this.score;
                }
            }

            // Remove platforms that are too far down
            this.platforms = this.platforms.filter(platform => platform.y < this.canvas.height + platformSpacing);

            // Track the highest platform
            let highestPlatform = Infinity;
            for (let platform of this.platforms) {
                highestPlatform = Math.min(highestPlatform, platform.y);
            }
            
            // Add platforms at the top if needed
            while (highestPlatform > -platformSpacing) {
                this.platforms.push({
                    x: Math.random() * (this.canvas.width - this.platformWidth),
                    y: highestPlatform - platformSpacing,
                    isSpecial: false
                });
                highestPlatform -= platformSpacing;
            }

            // Update particles
            for (let i = this.rocketBoost.particles.length - 1; i >= 0; i--) {
                const particle = this.rocketBoost.particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy; // Changed from -= to += for downward movement
                particle.life -= deltaTime / 1000;
                if (particle.life <= 0) {
                    this.rocketBoost.particles.splice(i, 1);
                }
            }

            // Add new particles
            if (this.rocketBoost.timer < this.rocketBoost.duration) {
                for (let i = 0; i < 2; i++) {
                    this.rocketBoost.particles.push({
                        x: this.player.x + this.player.width / 2,
                        y: this.player.y + this.player.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() * 5 + 5), // Changed to positive for upward movement
                        life: Math.random() * 0.5 + 0.5
                    });
                }
            }

            // End animation
            if (this.rocketBoost.timer >= this.rocketBoost.duration) {
                this.rocketBoost.active = false;
                this.player.velocityY = -0.2; // Very gentle upward velocity for smooth transition
                
                // No need to generate new platforms - they're already generated during the boost
            }

            return;
        }

        // Update player horizontal movement with tilt sensitivity
        if (this.keys.left) {
            const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
            this.player.velocityX = -this.player.speed * tiltMultiplier * fixedDelta;
        } else if (this.keys.right) {
            const tiltMultiplier = this.isMobile ? (Math.abs(this.lastTilt) / 45) * this.tiltSensitivity : 1;
            this.player.velocityX = this.player.speed * tiltMultiplier * fixedDelta;
        } else {
            this.player.velocityX = 0;
        }

        // Apply gravity with fixed time step
        this.player.velocityY += this.gravity * fixedDelta;

        // Update player position with fixed time step
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Screen wrapping
        if (this.player.x > this.canvas.width) {
            this.player.x = 0;
        } else if (this.player.x < 0) {
            this.player.x = this.canvas.width;
        }

        // Check platform collisions
        for (let platform of this.platforms) {
            // Check if player overlaps with platform at all (from any direction)
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + this.platformWidth &&
                this.player.y + this.player.height > platform.y &&
                this.player.y < platform.y + this.platformHeight
            ) {
                if (platform.isSpecial) {
                    this.startMinigame();
                    return;
                }
                // Only bounce if hitting from above
                if (this.player.velocityY > 0) {
                    this.player.velocityY = this.player.jumpForce;
                    this.player.isJumping = true;
                }
            }
        }

        // Move view up and generate new platforms
        if (this.player.y < this.canvas.height / 3) {
            let offset = this.canvas.height / 3 - this.player.y;
            this.player.y += offset;
            
            for (let platform of this.platforms) {
                platform.y += offset;
                
                // Remove platforms that are off screen and create new ones
                if (platform.y > this.canvas.height) {
                    let index = this.platforms.indexOf(platform);
                    this.lastSpecialPlatform++;
                    this.platforms[index] = {
                        x: Math.random() * (this.canvas.width - this.platformWidth),
                        y: 0,
                        isSpecial: this.lastSpecialPlatform >= this.specialPlatformInterval
                    };
                    if (this.platforms[index].isSpecial) {
                        this.lastSpecialPlatform = 0;
                    }
                    // Increase score
                    this.score += 10;
                    this.scoreElement.textContent = this.score;
                }
            }
        }

        // Check game over - only when completely below screen
        if (this.player.y - this.player.height > this.canvas.height) {
            this.gameOver();
        }
    }

    draw() {
        if (this.inMinigame) {
            this.drawMinigame();
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw platforms
        for (let platform of this.platforms) {
            if (platform.isSpecial) {
                // Draw black hole effect for special platforms
                const centerX = platform.x + this.platformWidth / 2;
                const centerY = platform.y + this.platformHeight / 2;

        // Draw outer glow
                const glowGradient = this.ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, this.platformWidth / 1.5
                );
                glowGradient.addColorStop(0, 'rgba(75, 0, 130, 0.6)');
                glowGradient.addColorStop(0.6, 'rgba(138, 43, 226, 0.4)');
                glowGradient.addColorStop(1, 'rgba(147, 112, 219, 0)');
                
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, this.platformWidth / 1.5, 0, Math.PI * 2);
        this.ctx.fill();

                // Draw spiral effect
                const time = Date.now() / 1000;
        this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(time * 2);
                
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
            this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.arc(0, 0, this.platformWidth / 2, angle, angle + 0.3);
                    this.ctx.lineTo(0, 0);
                    this.ctx.fillStyle = 'rgba(138, 43, 226, 0.7)';
                    this.ctx.fill();
        }
        this.ctx.restore();

                // Draw core
        this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, this.platformWidth / 4, 0, Math.PI * 2);
                this.ctx.fillStyle = 'black';
        this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(platform.x, platform.y, this.platformWidth, this.platformHeight);
            }
        }

        // Draw player with rotation during minigame entry
        if (this.enteringMinigame) {
            const progress = this.enterMinigameTimer / this.enterMinigameDuration;
            const scale = 1 - progress * 0.7; // Shrink to 30% of original size
            const rotation = progress * Math.PI * 4; // Rotate 720 degrees
            
            this.ctx.save();
            this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
            this.ctx.rotate(rotation);
            this.ctx.scale(scale, scale);
            this.ctx.fillStyle = '#FF5722';
            this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);
            this.ctx.restore();
        } else {
            // Normal player drawing
            this.ctx.fillStyle = '#FF5722';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }

        // Draw rocket particles
        if (this.rocketBoost.active) {
            for (const particle of this.rocketBoost.particles) {
                this.ctx.beginPath();
                const gradient = this.ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, 5
                );
                gradient.addColorStop(0, `rgba(255, 100, 0, ${particle.life})`);
                gradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw rocket flames
            const flameHeight = 20;
            const flameWidth = 10;
            const centerX = this.player.x + this.player.width / 2;
            const bottomY = this.player.y + this.player.height;

            // Draw flame
            const flameGradient = this.ctx.createLinearGradient(
                centerX, bottomY,
                centerX, bottomY + flameHeight
            );
            flameGradient.addColorStop(0, '#FF4500');
            flameGradient.addColorStop(0.6, '#FF8C00');
            flameGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');

            this.ctx.beginPath();
            this.ctx.moveTo(centerX - flameWidth, bottomY);
            this.ctx.lineTo(centerX, bottomY + flameHeight);
            this.ctx.lineTo(centerX + flameWidth, bottomY);
            this.ctx.fillStyle = flameGradient;
            this.ctx.fill();
        }
    }

    gameLoop(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update with fixed time step
        this.update(Math.min(deltaTime, this.fixedTimeStep));
        this.draw();

        if (!this.isGameOver) {
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.gameOverElement.style.display = 'block';
        this.finalScoreElement.textContent = this.score;
    }
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    new Game();
}

// Start the game when the window loads
window.onload = () => {
    new Game();
}; 