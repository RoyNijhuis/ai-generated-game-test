class RopeSegment {
    constructor(x, y, length) {
        this.x = x;
        this.y = y;
        this.oldX = x + (Math.random() - 0.5) * 3; // Reduced initial offset
        this.oldY = y;
        this.length = length;
        this.angle = 0;
    }

    update(prevX, prevY, isFirst) {
        if (!isFirst) {
            // Store current position
            const tempX = this.x;
            const tempY = this.y;

            // Verlet integration with stronger damping
            const vx = (this.x - this.oldX) * 0.95; // Increased damping
            const vy = (this.y - this.oldY) * 0.95;
            
            this.x += vx;
            this.y += vy;
            this.y += 0.1; // Reduced gravity

            this.oldX = tempX;
            this.oldY = tempY;
        }

        // Constrain distance to previous point with multiple iterations
        for (let i = 0; i < 2; i++) {
            const dx = this.x - prevX;
            const dy = this.y - prevY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const difference = this.length - distance;
                const percent = difference / distance / 2;
                const offsetX = dx * percent;
                const offsetY = dy * percent;

                if (!isFirst) {
                    this.x += offsetX;
                    this.y += offsetY;
                }
            }
        }

        this.angle = Math.atan2(this.x - prevX, this.y - prevY);
    }
}

class Bird {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.time = Math.random() * Math.PI * 2;
        this.wingTime = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.01 + Math.random() * 0.005;
        this.wingSpeed = 0.05 + Math.random() * 0.02;
        this.floatAmplitude = 2 + Math.random();
        
        // Bird colors
        this.colors = {
            body: '#8B4513',      // Rich brown
            wing: '#A0522D',      // Lighter brown
            highlight: '#DEB887',  // Light wood color
            beak: '#FFD700',      // Gold
            eye: '#000000'        // Black
        };
        
        // Wing properties
        this.wingSpan = size * 2.5;
        this.wingHeight = size * 0.8;
        this.tailLength = size * 1.2;
        
        // Feather details
        this.feathers = [];
        const numFeathers = 12;
        for (let i = 0; i < numFeathers; i++) {
            this.feathers.push({
                angle: (i / numFeathers) * Math.PI - Math.PI/2,
                length: this.wingSpan * 0.4 * (0.7 + Math.random() * 0.3),
                curve: 0.2 + Math.random() * 0.2
            });
        }
    }
    
    update() {
        this.time += this.floatSpeed;
        this.wingTime += this.wingSpeed;
        // Gentle floating motion
        this.currentY = this.y + Math.sin(this.time) * this.floatAmplitude;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.currentY);
        
        // Wing animation
        const wingFlap = Math.sin(this.wingTime) * 0.2;
        
        // Draw tail feathers
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            -this.tailLength * 0.5, this.size * 0.3,
            -this.tailLength, 0
        );
        ctx.quadraticCurveTo(
            -this.tailLength * 0.5, -this.size * 0.3,
            0, 0
        );
        ctx.fillStyle = this.colors.wing;
        ctx.fill();
        
        // Draw wings
        this.drawWing(ctx, 1, wingFlap);  // Right wing
        this.drawWing(ctx, -1, wingFlap); // Left wing
        
        // Draw body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.colors.highlight);
        gradient.addColorStop(0.7, this.colors.body);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw head
        ctx.beginPath();
        ctx.arc(this.size * 0.8, -this.size * 0.2, this.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.body;
        ctx.fill();
        
        // Draw beak
        ctx.beginPath();
        ctx.moveTo(this.size * 1.2, -this.size * 0.2);
        ctx.lineTo(this.size * 1.5, -this.size * 0.1);
        ctx.lineTo(this.size * 1.2, 0);
        ctx.fillStyle = this.colors.beak;
        ctx.fill();
        
        // Draw eye
        ctx.beginPath();
        ctx.arc(this.size * 1.0, -this.size * 0.25, this.size * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.eye;
        ctx.fill();
        
        ctx.restore();
    }
    
    drawWing(ctx, side, flapAmount) {
        ctx.save();
        ctx.rotate(flapAmount * side);
        
        // Create gradient for wing
        const wingGradient = ctx.createLinearGradient(
            0, -this.wingHeight,
            this.wingSpan * side, this.wingHeight
        );
        wingGradient.addColorStop(0, this.colors.wing);
        wingGradient.addColorStop(0.7, this.colors.highlight);
        wingGradient.addColorStop(1, this.colors.wing);

        // Draw main wing shape with a more natural curve
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Upper wing curve
        ctx.bezierCurveTo(
            this.wingSpan * 0.3 * side, -this.wingHeight * 1.2,
            this.wingSpan * 0.6 * side, -this.wingHeight * 0.8,
            this.wingSpan * side, -this.wingHeight * 0.2
        );
        // Wing tip
        ctx.quadraticCurveTo(
            this.wingSpan * 1.1 * side, 0,
            this.wingSpan * side, this.wingHeight * 0.3
        );
        // Lower wing curve
        ctx.bezierCurveTo(
            this.wingSpan * 0.7 * side, this.wingHeight * 0.5,
            this.wingSpan * 0.3 * side, this.wingHeight * 0.3,
            0, 0
        );
        ctx.fillStyle = wingGradient;
        ctx.fill();

        // Draw primary feathers
        const numPrimaryFeathers = 7;
        const featherSpacing = this.wingSpan / numPrimaryFeathers;
        
        for (let i = 0; i < numPrimaryFeathers; i++) {
            const startX = (i * featherSpacing + featherSpacing * 0.5) * side;
            const angle = Math.PI * 0.15 * (i / numPrimaryFeathers) * side;
            const length = this.wingSpan * 0.4 * (1 - i * 0.05);
            
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            // Draw curved feather
            ctx.bezierCurveTo(
                startX + Math.cos(angle) * length * 0.5 * side,
                Math.sin(angle) * length * 0.5,
                startX + Math.cos(angle) * length * 0.8 * side,
                Math.sin(angle) * length * 0.8,
                startX + Math.cos(angle) * length * side,
                Math.sin(angle) * length
            );
            
            ctx.strokeStyle = this.colors.highlight;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw secondary feathers (smaller, overlapping)
        const numSecondaryFeathers = 12;
        for (let i = 0; i < numSecondaryFeathers; i++) {
            const startX = (this.wingSpan * 0.3 + (i * this.wingSpan * 0.05)) * side;
            const startY = -this.wingHeight * 0.3;
            const featherLength = this.wingSpan * 0.25;
            const angle = (Math.PI * 0.7 + (i * Math.PI * 0.02)) * side;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(
                startX + Math.cos(angle) * featherLength * 0.5 * side,
                startY + Math.sin(angle) * featherLength * 0.5,
                startX + Math.cos(angle) * featherLength * 0.8 * side,
                startY + Math.sin(angle) * featherLength * 0.8,
                startX + Math.cos(angle) * featherLength * side,
                startY + Math.sin(angle) * featherLength
            );

            ctx.strokeStyle = this.colors.wing;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Rope {
    constructor(x, y, totalLength, isMoving = true) {
        this.anchorX = x;
        this.anchorY = y;
        this.isMoving = isMoving;
        
        // Create rope segments
        this.segments = [];
        const numSegments = 12; // More segments for smoother rope
        const segmentLength = totalLength / numSegments;
        
        let prevX = x;
        let prevY = y;
        for (let i = 0; i < numSegments; i++) {
            const segment = new RopeSegment(
                prevX + (Math.random() - 0.5) * 2,
                prevY + segmentLength,
                segmentLength
            );
            this.segments.push(segment);
            prevX = segment.x;
            prevY = segment.y;
        }

        // For compatibility with existing code
        this.length = totalLength;
        this.angle = 0;
        this.swingTime = Math.random() * Math.PI * 2;
        this.swingSpeed = 0.02;
        this.swingAmplitude = 0.6;
        this.updateEnd();
        
        // Rope texture properties
        this.ropeWidth = 4;
        this.ropeColor = '#8B4513';  // Wood brown
        this.ropeHighlight = '#DEB887'; // Light wood
        this.ropeShadow = '#654321';   // Dark wood
        this.twistFrequency = 0.2;     // How often the rope twists
        this.twistAmplitude = 2;       // How pronounced the twist is
    }

    update() {
        if (this.isMoving) {
            // Update swing time and keep it within bounds
            this.swingTime = (this.swingTime + this.swingSpeed) % (Math.PI * 2);
            
            // Calculate the base swing angle for the entire rope
            const baseSwingAngle = Math.sin(this.swingTime) * this.swingAmplitude;
            
            // Update all segments based on the swing angle
            for (let i = 0; i < this.segments.length; i++) {
                const segment = this.segments[i];
                const prevX = i === 0 ? this.anchorX : this.segments[i - 1].x;
                const prevY = i === 0 ? this.anchorY : this.segments[i - 1].y;
                
                // Calculate the target position for this segment based on the swing
                const segmentAngle = baseSwingAngle * (1 + i * 0.1); // Slightly increase swing for lower segments
                const swingRadius = segment.length * (i + 1);
                const targetX = this.anchorX + Math.sin(segmentAngle) * swingRadius;
                const targetY = this.anchorY + Math.cos(segmentAngle) * swingRadius;
                
                // Move segment towards target position
                if (!segment.oldX) {
                    segment.oldX = segment.x;
                    segment.oldY = segment.y;
                }
                
                const dx = targetX - segment.x;
                const dy = targetY - segment.y;
                
                segment.x += dx * 0.1;
                segment.y += dy * 0.1;
                
                // Apply constraints
                const actualDx = segment.x - prevX;
                const actualDy = segment.y - prevY;
                const actualDist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);
                
                if (actualDist > 0) {
                    const scale = segment.length / actualDist;
                    if (i > 0) {
                        segment.x = prevX + actualDx * scale;
                        segment.y = prevY + actualDy * scale;
                    }
                }
            }
        }
        this.updateEnd();
    }

    updateEnd() {
        const lastSegment = this.segments[this.segments.length - 1];
        this.endX = lastSegment.x;
        this.endY = lastSegment.y;
        this.angle = Math.atan2(this.endX - this.anchorX, this.endY - this.anchorY);
    }

    draw(ctx) {
        // Draw rope with wooden texture effect
        ctx.save();
        
        // Create main rope path
        const points = [{ x: this.anchorX, y: this.anchorY }];
        this.segments.forEach(segment => {
            points.push({ x: segment.x, y: segment.y });
        });
        
        // Draw base rope
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            
            if (i === 1) {
                ctx.lineTo(curr.x, curr.y);
            } else {
                const mid = {
                    x: (prev.x + curr.x) / 2,
                    y: (prev.y + curr.y) / 2
                };
                ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
            }
        }
        
        ctx.lineCap = 'round';
        ctx.lineWidth = this.ropeWidth;
        ctx.strokeStyle = this.ropeColor;
        ctx.stroke();
        
        // Draw twist pattern
        ctx.beginPath();
        let totalLength = 0;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const segLength = Math.sqrt(dx * dx + dy * dy);
            
            const numTwists = Math.floor(segLength * this.twistFrequency);
            const twistSpacing = segLength / numTwists;
            
            for (let t = 0; t < numTwists; t++) {
                const progress = t / numTwists;
                const x = prev.x + dx * progress;
                const y = prev.y + dy * progress;
                
                // Create diagonal twist pattern
                const angle = totalLength * this.twistFrequency;
                const offset = Math.sin(angle) * this.twistAmplitude;
                
                ctx.moveTo(x - offset, y);
                ctx.lineTo(x + offset, y);
            }
            
            totalLength += segLength;
        }
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.ropeHighlight;
        ctx.stroke();
        
        ctx.restore();
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 0.2;
        this.attachedRope = null;
        this.lastRope = null;
        this.swingAngle = 0;
        this.swingSpeed = 0;
        this.isSwinging = false;
        this.maxReleaseSpeed = 15;
        this.attachmentDistance = 0;
        this.opacity = 1;
        this.isVictorious = false;
        this.victoryFloatSpeed = 0.5;
        this.victoryState = 'floating';
        this.targetX = 0;
        this.targetY = 0;
        this.scale = 1;
        this.targetScale = 1;
        this.exitAngle = 0;
        this.exitSpeed = 0;
        
        // Add pipe-related properties
        this.inPipe = false;
        this.pipeExitX = 0;
        this.pipeExitY = 0;
        this.pipeExitBoost = 0;
    }

    update() {
        if (this.isVictorious) {
            switch(this.victoryState) {
                case 'floating':
                    this.y -= this.victoryFloatSpeed;
                    this.opacity = Math.max(0, this.opacity - 0.005);
                    if (this.opacity <= 0) {
                        this.victoryState = 'preparing';
                        this.opacity = 0;
                        this.targetX = window.innerWidth / 2;
                        this.targetY = window.innerHeight / 2;
                        this.x = this.targetX;
                        this.y = this.targetY;
                        this.targetScale = 4;
                        setTimeout(() => {
                            this.victoryState = 'appearing';
                        }, 500);
                    }
                    break;

                case 'preparing':
                    break;

                case 'appearing':
                    this.opacity = Math.min(1, this.opacity + 0.05);
                    this.scale = this.scale + (this.targetScale - this.scale) * 0.1;
                    if (this.opacity >= 1) {
                        this.victoryState = 'waiting';
                        setTimeout(() => {
                            this.victoryState = 'exiting';
                            this.exitAngle = -Math.PI / 4;
                            this.exitSpeed = 20;
                        }, 2000);
                    }
                    break;

                case 'waiting':
                    break;

                case 'exiting':
                    this.x += Math.cos(this.exitAngle) * this.exitSpeed;
                    this.y += Math.sin(this.exitAngle) * this.exitSpeed;
                    this.exitSpeed *= 1.1;
                    this.opacity = Math.max(0, this.opacity - 0.02);
                    if (this.opacity <= 0) {
                        this.victoryState = 'done';
                    }
                    break;
            }
            return;
        } else if (this.inPipe) {
            // Calculate distance to exit
            const dx = this.pipeExitX - this.x;
            const dy = this.pipeExitY - this.y;
            const distanceToExit = Math.sqrt(dx * dx + dy * dy);

            // Move towards exit with increasing speed
            const speed = Math.max(15, 30 * (1 - distanceToExit / 100));
            const angle = Math.atan2(dy, dx);
            
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;

            // When close to exit, apply boost and exit pipe
            if (distanceToExit < 10) {
                this.inPipe = false;
                // Strong boost in the exit direction
                this.velocityX = Math.cos(angle) * this.pipeExitBoost * 1.5;
                this.velocityY = Math.sin(angle) * this.pipeExitBoost * 1.5;
                // Move slightly past exit point to prevent re-entry
                this.x = this.pipeExitX + Math.cos(angle) * 20;
                this.y = this.pipeExitY + Math.sin(angle) * 20;
                // Set a flag to briefly ignore dune physics
                this.ignoreDunePhysics = 10; // Will count down in frames
            }
            return;
        }

        if (this.ignoreDunePhysics > 0) {
            this.ignoreDunePhysics--;
            // Regular physics without dune interaction
            this.velocityY += this.gravity;
            this.x += this.velocityX;
            this.y += this.velocityY;
            return;
        }

        if (this.isSwinging) {
            // Store previous position for velocity calculation
            this.prevX = this.x;
            this.prevY = this.y;

            // When attached to a moving rope, use the rope's angle
            if (this.attachedRope.isMoving) {
                this.swingAngle = this.attachedRope.angle;
                this.swingSpeed = this.attachedRope.swingSpeed;
            } else {
                // Normal swing physics for static ropes
                this.swingSpeed += Math.sin(this.swingAngle) * 0.001;
                this.swingSpeed *= 0.99;
                this.swingAngle += this.swingSpeed;
            }

            // Update position based on swing, using attachment distance instead of rope length
            this.x = this.attachedRope.anchorX + Math.sin(this.swingAngle) * this.attachmentDistance;
            this.y = this.attachedRope.anchorY + Math.cos(this.swingAngle) * this.attachmentDistance;
        } else {
            // Normal movement
            if (!this.onRamp) {
                this.velocityY += this.gravity;
            }
            
            this.x += this.velocityX;
            this.y += this.velocityY;

            // Check for pipe entry
            if (window.game && window.game.sandDune) {
                const pipeCheck = window.game.sandDune.checkPipeEntry(this);
                if (pipeCheck.entering) {
                    this.inPipe = true;
                    this.pipeExitX = pipeCheck.exitX;
                    this.pipeExitY = pipeCheck.exitY;
                    this.pipeExitBoost = pipeCheck.boost;
                }
            }

            // Check for ramp collision
            if (window.game && window.game.halfPipe) {
                const halfPipe = window.game.halfPipe;
                const { point, distance, index } = halfPipe.findClosestPoint(this.x, this.y);

                if (distance < this.radius + 5) {
                    // We're on the ramp
                    this.onRamp = true;
                    
                    // Get the normal angle at the collision point
                    this.rampNormal = halfPipe.getNormalAngle(index);
                    
                    // Project velocity onto the ramp surface
                    const speed = Math.hypot(this.velocityX, this.velocityY);
                    const velocityAngle = Math.atan2(this.velocityY, this.velocityX);
                    
                    // Calculate the angle difference between velocity and ramp normal
                    const angleDiff = velocityAngle - this.rampNormal;
                    
                    // Reflect velocity around the normal if coming in at a sharp angle
                    if (Math.abs(angleDiff) > Math.PI / 4) {
                        const reflection = 2 * this.rampNormal - velocityAngle;
                        this.velocityX = Math.cos(reflection) * speed * 0.8; // Add some energy loss
                        this.velocityY = Math.sin(reflection) * speed * 0.8;
                    }
                    
                    // Apply ramp physics
                    this.velocityX *= this.rampFriction;
                    this.velocityY *= this.rampFriction;
                    
                    // Add gravity component along the ramp
                    const gravityForce = this.gravity * Math.sin(this.rampNormal - Math.PI/2);
                    this.velocityX += Math.cos(this.rampNormal) * gravityForce;
                    this.velocityY += Math.sin(this.rampNormal) * gravityForce;
                    
                    // Keep player on the ramp surface
                    this.x = point.x;
                    this.y = point.y;
                } else {
                    this.onRamp = false;
                }
            }

            // Apply air resistance
            if (!this.onRamp) {
                this.velocityX *= 0.99;
            }
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.opacity;
        
        // Apply scaling transformation
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.x, -this.y);
        
        // Draw ridiculously large cheeks first (so they appear behind the main face)
        if (this.opacity > 0.1) {
            // Big puffy cheeks (same color as face)
            ctx.fillStyle = '#FFE15C';
            ctx.beginPath();
            // Left cheek (slightly less protruding)
            ctx.arc(this.x - 10, this.y + 2, this.radius * 0.8, 0, Math.PI * 2);
            // Right cheek (slightly less protruding)
            ctx.arc(this.x + 10, this.y + 2, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Add subtle shading to cheeks
            const leftCheekGradient = ctx.createRadialGradient(
                this.x - 10, this.y + 2, 0,
                this.x - 10, this.y + 2, this.radius * 0.8
            );
            leftCheekGradient.addColorStop(0, '#FFE15C');
            leftCheekGradient.addColorStop(1, '#FFD700');
            
            const rightCheekGradient = ctx.createRadialGradient(
                this.x + 10, this.y + 2, 0,
                this.x + 10, this.y + 2, this.radius * 0.8
            );
            rightCheekGradient.addColorStop(0, '#FFE15C');
            rightCheekGradient.addColorStop(1, '#FFD700');

            // Apply subtle gradients to cheeks
            ctx.fillStyle = leftCheekGradient;
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y + 2, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = rightCheekGradient;
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 2, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw main face circle (yellow like emoji)
        ctx.fillStyle = '#FFE15C';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Only draw face features if not completely faded out
        if (this.opacity > 0.1) {
            // Draw eyes (cute closed happy eyes)
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Left eye
            ctx.moveTo(this.x - 8, this.y - 4);
            ctx.quadraticCurveTo(this.x - 5, this.y - 8, this.x - 2, this.y - 4);
            // Right eye
            ctx.moveTo(this.x + 8, this.y - 4);
            ctx.quadraticCurveTo(this.x + 5, this.y - 8, this.x + 2, this.y - 4);
            ctx.stroke();

            // Draw cute smile (slightly adjusted for big cheeks)
            ctx.beginPath();
            ctx.arc(this.x, this.y + 2, 5, 0, Math.PI, false);
            ctx.stroke();

            // Add subtle cheek highlights
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            // Left cheek highlights
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y + 2, this.radius * 0.4, -Math.PI * 0.3, Math.PI * 0.3);
            // Right cheek highlights
            ctx.arc(this.x + 10, this.y + 2, this.radius * 0.4, Math.PI * 0.7, -Math.PI * 0.7);
            ctx.stroke();
        }
        
        ctx.restore(); // Restore the original transformation
        ctx.globalAlpha = 1;
    }

    attachToRope(rope) {
        this.attachedRope = rope;
        this.isSwinging = true;
        this.swingAngle = rope.angle;
        this.swingSpeed = rope.swingSpeed;
        // Calculate attachment distance based on current position
        const dx = this.x - rope.anchorX;
        const dy = this.y - rope.anchorY;
        this.attachmentDistance = Math.sqrt(dx * dx + dy * dy);
    }

    attachToRopeAtPoint(rope, contactAngle) {
        this.attachedRope = rope;
        this.isSwinging = true;
        this.swingAngle = contactAngle;
        this.swingSpeed = 0; // Start with no swing speed at point of contact
        // Calculate attachment distance based on collision point
        const dx = this.x - rope.anchorX;
        const dy = this.y - rope.anchorY;
        this.attachmentDistance = Math.sqrt(dx * dx + dy * dy);
    }

    release() {
        if (this.isSwinging && this.attachedRope) {
            // Store the rope we're detaching from
            this.lastRope = this.attachedRope;
            
            // Clear the last rope after a short delay
            setTimeout(() => {
                this.lastRope = null;
            }, 100);

            // Calculate actual velocities from position change
            const velocityScale = 3;
            
            if (this.prevX !== undefined && this.prevY !== undefined) {
                this.velocityX = (this.x - this.prevX) * velocityScale;
                this.velocityY = (this.y - this.prevY) * velocityScale;
            } else {
                const speed = this.swingSpeed * this.attachedRope.length * velocityScale;
                this.velocityX = Math.cos(this.swingAngle - Math.PI/2) * speed;
                this.velocityY = Math.sin(this.swingAngle - Math.PI/2) * speed;
            }

            // Cap the release speed
            const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            if (currentSpeed > this.maxReleaseSpeed) {
                const scale = this.maxReleaseSpeed / currentSpeed;
                this.velocityX *= scale;
                this.velocityY *= scale;
            }
        }
        this.isSwinging = false;
        this.attachedRope = null;
        this.prevX = undefined;
        this.prevY = undefined;
    }
}

class FinishLine {
    constructor(x, height) {
        this.x = x;
        this.height = height;
        this.width = 80;
        this.lines = [];
        this.sparks = [];
        this.sparkTimer = 0;
        this.ufoY = 50; // UFO position from top
        this.ufoSize = 40;
        this.ufoTime = 0;
        this.ufoHoverAmplitude = 5;
        this.ufoHoverSpeed = 0.03;
        this.beamWidth = this.width * 1.2;
        
        // Create 5 vertical lines (like a music staff)
        const spacing = this.width / 4;
        for (let i = 0; i < 5; i++) {
            this.lines.push({
                baseX: this.x + i * spacing,
                amplitude: 2 + Math.random(),
                frequency: 0.02 + Math.random() * 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    update() {
        this.ufoTime += this.ufoHoverSpeed;
        const currentUfoY = this.ufoY + Math.sin(this.ufoTime) * this.ufoHoverAmplitude;

        // Update each line's position, now emanating from UFO
        this.lines.forEach(line => {
            const newX = line.baseX + Math.sin(line.phase) * line.amplitude;
            line.phase += line.frequency;
            line.currentX = newX;
        });
        
        // Generate sparks from UFO beam
        this.sparkTimer += 1;
        if (this.sparkTimer >= 2) {
            this.sparkTimer = 0;
            
            // Generate sparks along the beam
            const sparkCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < sparkCount; i++) {
                const lineIndex = Math.floor(Math.random() * this.lines.length);
                const line = this.lines[lineIndex];
                const y = currentUfoY + Math.random() * (this.height - currentUfoY);
                
                this.sparks.push({
                    x: line.currentX,
                    y: y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    color: `hsl(${180 + Math.random() * 60}, 100%, 75%)`,
                    life: 1.0,
                    size: 1 + Math.random() * 2
                });
            }
        }
        
        // Update existing sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.life -= 0.015;
            spark.vy -= 0.02;
            spark.vx *= 0.99;
            
            if (spark.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const currentUfoY = this.ufoY + Math.sin(this.ufoTime) * this.ufoHoverAmplitude;

        // Draw beam gradient
        const beamGradient = ctx.createLinearGradient(
            this.x + this.width/2, currentUfoY,
            this.x + this.width/2, this.height
        );
        beamGradient.addColorStop(0, 'rgba(140, 230, 240, 0.3)');
        beamGradient.addColorStop(1, 'rgba(140, 230, 240, 0)');
        
        ctx.beginPath();
        ctx.moveTo(this.x - this.beamWidth/2, currentUfoY + this.ufoSize/2);
        ctx.lineTo(this.x + this.width + this.beamWidth/2, currentUfoY + this.ufoSize/2);
        ctx.lineTo(this.x + this.width, this.height);
        ctx.lineTo(this.x, this.height);
        ctx.closePath();
        ctx.fillStyle = beamGradient;
        ctx.fill();

        // Draw vertical lines with wave effect, now starting from UFO
        this.lines.forEach(line => {
            const x = line.baseX + Math.sin(line.phase) * line.amplitude;
            
            ctx.beginPath();
            ctx.moveTo(x, currentUfoY + this.ufoSize/2);
            
            // Draw wavy line from UFO to bottom
            for (let y = currentUfoY + this.ufoSize/2; y < this.height; y += 5) {
                const waveX = x + Math.sin(y * 0.02 + line.phase) * 1;
                ctx.lineTo(waveX, y);
            }
            
            // Draw line with glow effect
            ctx.strokeStyle = '#4A2810';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(140, 230, 240, 0.3)';
            ctx.lineWidth = 4;
            ctx.stroke();
        });

        // Draw UFO
        ctx.save();
        ctx.translate(this.x + this.width/2, currentUfoY);
        
        // Draw UFO glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.ufoSize * 1.2);
        glowGradient.addColorStop(0, 'rgba(140, 230, 240, 0.3)');
        glowGradient.addColorStop(1, 'rgba(140, 230, 240, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.ufoSize * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Draw UFO dome
        ctx.beginPath();
        ctx.arc(0, -this.ufoSize/4, this.ufoSize/2, Math.PI, 0);
        ctx.fillStyle = 'rgba(180, 240, 250, 0.9)';
        ctx.fill();
        
        // Draw UFO base
        ctx.beginPath();
        ctx.ellipse(0, 0, this.ufoSize, this.ufoSize/3, 0, 0, Math.PI * 2);
        const baseGradient = ctx.createLinearGradient(0, -this.ufoSize/3, 0, this.ufoSize/3);
        baseGradient.addColorStop(0, '#DDD');
        baseGradient.addColorStop(0.5, '#999');
        baseGradient.addColorStop(1, '#666');
        ctx.fillStyle = baseGradient;
        ctx.fill();

        // Draw lights around UFO base
        const numLights = 8;
        for (let i = 0; i < numLights; i++) {
            const angle = (i / numLights) * Math.PI * 2;
            const x = Math.cos(angle) * this.ufoSize * 0.8;
            const y = Math.sin(angle) * this.ufoSize/4;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${(this.ufoTime * 100 + i * 360/numLights) % 360}, 100%, 75%)`;
            ctx.fill();
        }
        
        ctx.restore();
        
        // Draw sparks
        this.sparks.forEach(spark => {
            ctx.globalAlpha = spark.life;
            
            // Inner bright core
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Colored glow
            const glow = ctx.createRadialGradient(
                spark.x, spark.y, 0,
                spark.x, spark.y, spark.size * 4
            );
            glow.addColorStop(0, spark.color);
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
        });
    }
}

class VictoryExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.createParticles();
        this.waveTime = 0;
    }

    createParticles() {
        // Create many more particles with varied effects
        for (let i = 0; i < 1000; i++) { // 10x more particles
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 15; // Higher max speed
            const size = 2 + Math.random() * 8; // Larger particles
            const type = Math.random(); // Particle type for different behaviors
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: `hsl(${Math.random() * 360}, 100%, ${70 + Math.random() * 30}%)`,
                life: 1.0 + Math.random(), // Longer life for some particles
                gravity: 0.05 + Math.random() * 0.15,
                type: type,
                spin: (Math.random() - 0.5) * 0.2,
                trail: []
            });
        }
    }

    update() {
        this.waveTime += 0.1;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Store previous position for trail
            if (particle.type < 0.2) { // 20% of particles have trails
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 5) {
                    particle.trail.shift();
                }
            }
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Different particle behaviors
            if (particle.type < 0.3) {
                // Swirling particles
                particle.vx += Math.sin(this.waveTime + particle.x * 0.02) * 0.2;
                particle.vy += Math.cos(this.waveTime + particle.y * 0.02) * 0.2;
            } else if (particle.type < 0.6) {
                // Floating particles
                particle.vy *= 0.98;
                particle.vy -= 0.1;
            } else {
                // Normal particles with gravity
                particle.vy += particle.gravity;
            }
            
            // Add spin effect
            particle.vx += Math.sin(particle.spin) * 0.3;
            particle.vy += Math.cos(particle.spin) * 0.3;
            
            particle.life -= 0.01; // Slower life decrease
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            
            // Draw trails for some particles
            if (particle.trail.length > 0) {
                ctx.beginPath();
                ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                particle.trail.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.lineTo(particle.x, particle.y);
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = particle.size * 0.5;
                ctx.stroke();
            }
            
            // Draw particle with enhanced glow
            const glow = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );
            glow.addColorStop(0, particle.color);
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bright core
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = 1;
    }

    isFinished() {
        return this.particles.length === 0;
    }
}

class Sea {
    constructor(canvas) {
        this.canvas = canvas;
        this.waves = [];
        this.fishes = [];
        this.tortoises = []; // Add tortoises array
        this.wind = 0;
        this.targetWind = 0.2;
        this.time = 0;
        
        // Create wave points
        const waveSegments = 20;
        for (let i = 0; i <= waveSegments; i++) {
            this.waves.push({
                x: (canvas.width * i) / waveSegments,
                y: canvas.height - 100,
                originalY: canvas.height - 100,
                velocity: 0
            });
        }
        
        // Create fishes with positions relative to canvas bottom
        const numFishes = 8;
        const waterDepth = 100; // Distance from bottom of canvas
        const minDepth = 30; // Minimum distance from water surface
        
        // Define vibrant fish colors
        const fishColors = [
            '#FF6B6B', // Coral red
            '#4ECDC4', // Turquoise
            '#45B7D1', // Sky blue
            '#96CEB4', // Mint
            '#FFBE0B', // Golden
            '#FF006E', // Hot pink
            '#8338EC', // Purple
            '#3A86FF', // Royal blue
            '#FB5607', // Orange
            '#00F5D4'  // Aqua
        ];
        
        for (let i = 0; i < numFishes; i++) {
            const baseColor = fishColors[Math.floor(Math.random() * fishColors.length)];
            this.fishes.push({
                x: Math.random() * canvas.width,
                y: canvas.height - minDepth - Math.random() * (waterDepth - minDepth),
                size: 20 + Math.random() * 25, // Increased fish size (was 10 + random * 15)
                speed: 0.5 + Math.random() * 1,
                direction: Math.random() < 0.5 ? -1 : 1,
                offset: Math.random() * Math.PI * 2,
                color: baseColor,
                glowColor: this.adjustColorBrightness(baseColor, 50),
                depthOffset: minDepth + Math.random() * (waterDepth - minDepth)
            });
        }

        // Create tortoises
        const numTortoises = 4;
        for (let i = 0; i < numTortoises; i++) {
            this.tortoises.push({
                x: Math.random() * canvas.width,
                y: canvas.height - 20 - Math.random() * 40, // Keep tortoises near bottom
                size: 30 + Math.random() * 20,
                speed: 0.2 + Math.random() * 0.3, // Slower than fish
                direction: Math.random() < 0.5 ? -1 : 1,
                shellPattern: Math.random() * Math.PI * 2,
                shellColor: '#8B4513', // Brown base color
                patternColor: '#D2691E', // Lighter brown for patterns
                flapOffset: Math.random() * Math.PI * 2,
                flapSpeed: 0.03 + Math.random() * 0.02
            });
        }
    }

    // Helper function to create brighter version of colors for glow effects
    adjustColorBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.floor((num >> 16) * (1 + percent/100)));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * (1 + percent/100)));
        const b = Math.min(255, Math.floor((num & 0x0000FF) * (1 + percent/100)));
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }
    
    update() {
        this.time += 0.02;
        
        // Smoothly change wind
        this.targetWind = Math.sin(this.time * 0.3) * 0.3;
        this.wind += (this.targetWind - this.wind) * 0.01;
        
        // Update waves
        this.waves.forEach((wave, index) => {
            const force = Math.sin(this.time + index * 0.3) * 0.3;
            wave.velocity += (wave.originalY - wave.y) * 0.02;
            wave.velocity += force + this.wind;
            wave.velocity *= 0.98;
            wave.y += wave.velocity;
        });
        
        // Update fishes
        this.fishes.forEach(fish => {
            fish.x += fish.speed * fish.direction;
            
            const waveIndex = Math.floor((fish.x / this.canvas.width) * (this.waves.length - 1));
            const wave1 = this.waves[waveIndex] || this.waves[this.waves.length - 1];
            const wave2 = this.waves[waveIndex + 1] || wave1;
            const waveX = (fish.x / this.canvas.width) * (this.waves.length - 1) - waveIndex;
            const waveHeight = wave1.y * (1 - waveX) + wave2.y * waveX;
            
            const targetY = waveHeight + fish.depthOffset;
            fish.y += (targetY - fish.y) * 0.1;
            fish.y += Math.sin(this.time * 2 + fish.offset) * 0.3;
            fish.y = Math.min(Math.max(fish.y, waveHeight + 20), this.canvas.height - 10);
            
            if (fish.x < -50) {
                fish.x = this.canvas.width + 50;
            } else if (fish.x > this.canvas.width + 50) {
                fish.x = -50;
            }
        });

        // Update tortoises
        this.tortoises.forEach(tortoise => {
            tortoise.x += tortoise.speed * tortoise.direction;
            tortoise.flapOffset += tortoise.flapSpeed;
            
            // Wrap around screen
            if (tortoise.x < -50) {
                tortoise.x = this.canvas.width + 50;
            } else if (tortoise.x > this.canvas.width + 50) {
                tortoise.x = -50;
            }
        });
    }
    
    draw(ctx) {
        // Draw water background
        const gradient = ctx.createLinearGradient(0, this.canvas.height - 150, 0, this.canvas.height);
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(1, '#1B4F8F');
        ctx.fillStyle = gradient;
        
        // Start the water path
        ctx.beginPath();
        ctx.moveTo(0, this.waves[0].y);
        
        // Draw waves using curve
        for (let i = 0; i < this.waves.length - 1; i++) {
            const xc = (this.waves[i].x + this.waves[i + 1].x) / 2;
            const yc = (this.waves[i].y + this.waves[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.waves[i].x, this.waves[i].y, xc, yc);
        }
        
        const lastWave = this.waves[this.waves.length - 1];
        ctx.quadraticCurveTo(lastWave.x, lastWave.y, this.canvas.width, lastWave.y);
        ctx.lineTo(this.canvas.width, this.canvas.height);
        ctx.lineTo(0, this.canvas.height);
        ctx.closePath();
        ctx.fill();
        
        // Draw wave highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.waves[0].y);
        
        for (let i = 0; i < this.waves.length - 1; i++) {
            const xc = (this.waves[i].x + this.waves[i + 1].x) / 2;
            const yc = (this.waves[i].y + this.waves[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.waves[i].x, this.waves[i].y, xc, yc);
        }
        
        ctx.quadraticCurveTo(lastWave.x, lastWave.y, this.canvas.width, lastWave.y);
        ctx.stroke();

        // Draw tortoises first (they're deeper in the water)
        this.tortoises.forEach(tortoise => {
            ctx.save();
            ctx.translate(tortoise.x, tortoise.y);
            ctx.scale(tortoise.direction, 1);

            // Draw flippers with animation
            const flapAmount = Math.sin(tortoise.flapOffset) * 0.3;
            
            // Back flippers
            this.drawFlipper(ctx, -tortoise.size * 0.4, tortoise.size * 0.2, tortoise.size * 0.4, -flapAmount, tortoise.shellColor);
            this.drawFlipper(ctx, tortoise.size * 0.4, tortoise.size * 0.2, tortoise.size * 0.4, -flapAmount, tortoise.shellColor);
            
            // Draw shell
            ctx.beginPath();
            ctx.ellipse(0, 0, tortoise.size * 0.8, tortoise.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = tortoise.shellColor;
            ctx.fill();
            
            // Draw shell pattern
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + tortoise.shellPattern;
                const x = Math.cos(angle) * tortoise.size * 0.4;
                const y = Math.sin(angle) * tortoise.size * 0.3;
                
                ctx.beginPath();
                ctx.arc(x, y, tortoise.size * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = tortoise.patternColor;
                ctx.fill();
            }
            
            // Front flippers
            this.drawFlipper(ctx, -tortoise.size * 0.6, -tortoise.size * 0.2, tortoise.size * 0.5, flapAmount, tortoise.shellColor);
            this.drawFlipper(ctx, tortoise.size * 0.6, -tortoise.size * 0.2, tortoise.size * 0.5, flapAmount, tortoise.shellColor);
            
            // Draw head
            ctx.beginPath();
            ctx.ellipse(tortoise.size * 0.8, 0, tortoise.size * 0.2, tortoise.size * 0.15, 0, 0, Math.PI * 2);
            ctx.fillStyle = tortoise.shellColor;
            ctx.fill();
            
            // Draw eye
            ctx.beginPath();
            ctx.arc(tortoise.size * 0.9, -tortoise.size * 0.1, tortoise.size * 0.05, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            
            ctx.restore();
        });
        
        // Draw fishes
        this.fishes.forEach(fish => {
            ctx.save();
            ctx.translate(fish.x, fish.y);
            ctx.scale(fish.direction, 1);
            
            // Add glow effect
            ctx.shadowColor = fish.glowColor;
            ctx.shadowBlur = 10;
            
            // Fish body
            ctx.fillStyle = fish.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(fish.size, 0, fish.size, fish.size/2);
            ctx.quadraticCurveTo(fish.size, fish.size, 0, fish.size);
            ctx.quadraticCurveTo(-fish.size/2, fish.size/2, 0, 0);
            ctx.fill();
            
            // Tail
            ctx.beginPath();
            ctx.moveTo(-fish.size/2, fish.size/2);
            ctx.lineTo(-fish.size, 0);
            ctx.lineTo(-fish.size, fish.size);
            ctx.closePath();
            ctx.fill();
            
            // Reset shadow for eye
            ctx.shadowBlur = 0;
            
            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(fish.size/2, fish.size/3, fish.size/6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(fish.size/2, fish.size/3, fish.size/10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    // Helper method for drawing tortoise flippers
    drawFlipper(ctx, x, y, size, angle, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.restore();
    }
}

class FloatingIsland {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.time = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.01 + Math.random() * 0.005;
        this.floatAmplitude = 2 + Math.random();
        
        // Generate random details for the island
        this.grassPatches = [];
        const numPatches = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPatches; i++) {
            this.grassPatches.push({
                x: (Math.random() - 0.5) * size * 1.2,
                height: 5 + Math.random() * 10,
                width: 3 + Math.random() * 4,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Tree properties
        this.hasTree = Math.random() < 0.7; // 70% chance of having a tree
        if (this.hasTree) {
            this.treeHeight = size * (0.6 + Math.random() * 0.4);
            this.treeWidth = this.treeHeight * 0.6;
            this.trunkWidth = this.treeWidth * 0.2;
            this.leafLayers = 3 + Math.floor(Math.random() * 2);
        }
    }
    
    update() {
        this.time += this.floatSpeed;
        // Gentle floating motion
        this.currentY = this.y + Math.sin(this.time) * this.floatAmplitude;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.currentY);
        
        // Draw island base with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, '#8B4513');  // Darker brown at center
        gradient.addColorStop(0.7, '#A0522D'); // Lighter brown
        gradient.addColorStop(1, '#6B4423');   // Darker edge
        
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add some texture/detail to the island
        ctx.beginPath();
        ctx.ellipse(0, -this.size * 0.1, this.size * 0.9, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        
        // Draw grass patches
        this.grassPatches.forEach(patch => {
            const swayAmount = Math.sin(this.time * 2 + patch.swayOffset) * 0.2;
            ctx.save();
            ctx.translate(patch.x, -this.size * 0.3);
            ctx.rotate(swayAmount);
            
            // Draw grass blade
            ctx.beginPath();
            ctx.moveTo(-patch.width/2, 0);
            ctx.quadraticCurveTo(
                0, -patch.height,
                patch.width/2, 0
            );
            ctx.strokeStyle = '#90EE90';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });
        
        // Draw tree if this island has one
        if (this.hasTree) {
            // Draw trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(
                -this.trunkWidth/2,
                -this.size * 0.3 - this.treeHeight,
                this.trunkWidth,
                this.treeHeight * 0.7
            );
            
            // Draw leaf layers
            const leafColor = '#228B22';
            for (let i = 0; i < this.leafLayers; i++) {
                const layerSize = this.treeWidth * (1 - i * 0.2);
                const layerY = -this.size * 0.3 - this.treeHeight * (0.5 + i * 0.25);
                
                ctx.beginPath();
                ctx.arc(0, layerY, layerSize/2, 0, Math.PI * 2);
                ctx.fillStyle = leafColor;
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

class SandDune {
    constructor(x, y, width, height) {
        // Existing dune properties
        this.width = width * (0.8 + Math.random() * 0.4);
        this.height = height * (0.7 + Math.random() * 0.6);
        this.x = x;
        this.y = y;
        this.peakOffset = (Math.random() - 0.5) * (this.width * 0.2);
        this.steepness = 0.8 + Math.random() * 0.4;
        this.friction = 0.95;
        this.gravity = 0.4;
        this.debug = false;
        
        // Sand dune colors
        this.sandBaseColor = '#E6C388';
        this.sandHighlightColor = '#F7E4BF';
        this.sandShadowColor = '#C4A76D';
        this.underwaterColor = '#A89265';
        
        // Pipe properties
        this.pipeRadius = 40; // Increased base size
        this.pipeEntryX = this.x + this.width * 0.2;
        this.pipeExitX = this.x + this.width * 0.8;
        this.pipeY = this.y - this.height * 0.4;
        this.pipeColor = '#4A4A4A';
        this.pipeHighlight = '#6A6A6A';
        this.pipeShadow = '#2A2A2A';
        
        this.curvePoints = this.generateCurvePoints();
    }

    // Add method to check if player is entering the pipe
    checkPipeEntry(player) {
        // Don't allow pipe entry if player is in ignore physics state
        if (player.ignoreDunePhysics > 0) {
            return { entering: false };
        }

        // Check both horizontal and vertical distance separately for more forgiving entry
        const dx = player.x - this.pipeEntryX;
        const dy = player.y - this.pipeY;
        const distanceToEntry = Math.hypot(dx, dy);
        
        // More forgiving entry conditions
        const isNearEntry = distanceToEntry < this.pipeRadius + player.radius;
        const isApproachingFromLeft = player.x < this.pipeEntryX;
        const isInVerticalRange = Math.abs(dy) < this.pipeRadius * 1.2;
        
        if (isNearEntry && isApproachingFromLeft && isInVerticalRange) {
            return {
                entering: true,
                exitX: this.pipeExitX + this.pipeRadius,
                exitY: this.pipeY,
                boost: 20 // Increased boost speed
            };
        }
        
        return { entering: false };
    }

    generateCurvePoints() {
        const points = [];
        const numPoints = 100;
        const extensionWidth = 100;
        
        // Random parameters for the Gaussian curve
        const sigma = this.width / (3 + Math.random() * 2); // Random spread
        const amplitude = this.height * this.steepness;
        const centerX = this.width / 2 + this.peakOffset;

        for (let i = -extensionWidth; i <= this.width + extensionWidth; i += (this.width + 2 * extensionWidth) / numPoints) {
            const x = i;
            // Gaussian function with random variations
            const gaussian = Math.exp(-Math.pow(x - centerX, 2) / (2 * sigma * sigma));
            const y = amplitude * gaussian;
            
            points.push({
                x: this.x + x,
                y: this.y - y
            });
        }
        
        return points;
    }

    // Physics methods remain unchanged
    findClosestPoint(x, y) {
        let closest = this.curvePoints[0];
        let minDist = Infinity;
        let index = 0;

        this.curvePoints.forEach((point, i) => {
            const dist = Math.hypot(x - point.x, y - point.y);
            if (dist < minDist) {
                minDist = dist;
                closest = point;
                index = i;
            }
        });

        return { point: closest, distance: minDist, index };
    }

    getNormalAngle(index) {
        const prev = this.curvePoints[Math.max(0, index - 1)];
        const next = this.curvePoints[Math.min(this.curvePoints.length - 1, index + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        return Math.atan2(-dx, dy);
    }

    getSurfaceNormalAt(x) {
        let closestIndex = 0;
        let minDist = Infinity;
        
        this.curvePoints.forEach((point, i) => {
            const dist = Math.abs(point.x - x);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        });
        
        return this.getNormalAngle(closestIndex);
    }

    containsPoint(x, y, player) {
        // If player is provided and ignoring physics, return false
        if (player && player.ignoreDunePhysics > 0) {
            return false;
        }
        const { distance } = this.findClosestPoint(x, y);
        return distance < 20;
    }

    draw(ctx) {
        // Draw the base sand dune
        ctx.save();
        
        // Create sand gradient
        const sandGradient = ctx.createLinearGradient(
            this.x, this.y - this.height,
            this.x, this.y
        );
        sandGradient.addColorStop(0, this.sandHighlightColor);
        sandGradient.addColorStop(0.4, this.sandBaseColor);
        sandGradient.addColorStop(1, this.sandShadowColor);
        
        // Draw the dune shape
        ctx.beginPath();
        this.curvePoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        
        // Complete the shape
        ctx.lineTo(this.x + this.width + 100, this.y);
        ctx.lineTo(this.x - 100, this.y);
        ctx.closePath();
        
        // Fill the dune
        ctx.fillStyle = sandGradient;
        ctx.fill();
        
        // Draw the pipe
        // Draw shadow/depth first
        ctx.beginPath();
        ctx.ellipse(this.pipeEntryX, this.pipeY, this.pipeRadius, this.pipeRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.pipeShadow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.pipeExitX, this.pipeY, this.pipeRadius, this.pipeRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.pipeShadow;
        ctx.fill();
        
        // Draw pipe body
        ctx.beginPath();
        ctx.moveTo(this.pipeEntryX - this.pipeRadius, this.pipeY);
        ctx.lineTo(this.pipeExitX + this.pipeRadius, this.pipeY);
        ctx.lineWidth = this.pipeRadius * 2;
        ctx.strokeStyle = this.pipeColor;
        ctx.stroke();
        
        // Draw pipe entrances with gradient for depth
        const entryGradient = ctx.createRadialGradient(
            this.pipeEntryX, this.pipeY, 0,
            this.pipeEntryX, this.pipeY, this.pipeRadius
        );
        entryGradient.addColorStop(0, '#000000');
        entryGradient.addColorStop(1, '#1A1A1A');
        
        ctx.beginPath();
        ctx.ellipse(this.pipeEntryX, this.pipeY, this.pipeRadius, this.pipeRadius, 0, 0, Math.PI * 2);
        ctx.fillStyle = entryGradient;
        ctx.fill();
        
        const exitGradient = ctx.createRadialGradient(
            this.pipeExitX, this.pipeY, 0,
            this.pipeExitX, this.pipeY, this.pipeRadius
        );
        exitGradient.addColorStop(0, '#000000');
        exitGradient.addColorStop(1, '#1A1A1A');
        
        ctx.beginPath();
        ctx.ellipse(this.pipeExitX, this.pipeY, this.pipeRadius, this.pipeRadius, 0, 0, Math.PI * 2);
        ctx.fillStyle = exitGradient;
        ctx.fill();
        
        // Add pipe highlights
        ctx.beginPath();
        ctx.ellipse(this.pipeEntryX, this.pipeY - this.pipeRadius * 0.3, this.pipeRadius, this.pipeRadius * 0.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.pipeHighlight;
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.pipeExitX, this.pipeY - this.pipeRadius * 0.3, this.pipeRadius, this.pipeRadius * 0.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.pipeHighlight;
        ctx.fill();
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        // Make the game instance globally accessible
        window.game = this;
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();

        // Initialize sun properties
        this.sun = {
            x: this.canvas.width * 0.85,
            y: this.canvas.height * 0.2,
            radius: 40,
            glowRadius: 100,
            rays: 12,
            rayLength: 60,
            time: 0,
            speed: 0.01
        };

        // Initialize clouds
        this.clouds = [];
        for (let i = 0; i < 12; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 50 + Math.random() * 150,
                speed: 0.1 + Math.random() * 0.1,
                baseSize: 15 + Math.random() * 25,
                numCircles: 3 + Math.floor(Math.random() * 4),
                circles: [],
                details: []
            });

            // Generate fixed circle positions for each cloud
            const cloud = this.clouds[i];
            for (let j = 0; j < cloud.numCircles; j++) {
                const angle = (Math.PI * 2 * j) / cloud.numCircles + Math.random() * 0.5;
                const distance = cloud.baseSize * 0.8;
                cloud.circles.push({
                    offsetX: Math.cos(angle) * distance,
                    offsetY: Math.sin(angle) * distance,
                    size: cloud.baseSize * (0.6 + Math.random() * 0.6)
                });
            }

            // Generate fixed detail positions
            for (let j = 0; j < 2; j++) {
                cloud.details.push({
                    offsetX: (Math.random() - 0.5) * cloud.baseSize,
                    offsetY: (Math.random() - 0.5) * cloud.baseSize,
                    size: cloud.baseSize * 0.4
                });
            }
        }

        // Create instructions element
        this.createInstructions();
        this.hasSwung = false;

        // Initialize sandDune from the bottom of the screen
        this.sandDune = new SandDune(
            this.canvas.width / 2 - 200,  // Center X position
            this.canvas.height + 50,      // Start below screen
            400,                          // Width
            300                           // Increased height to emerge from bottom
        );
        
        // First generate ropes
        this.ropes = this.generateRopes();
        
        // Create finish line on the right side of the screen
        this.finishLine = new FinishLine(this.canvas.width * 0.8, this.canvas.height);
        
        // Create player at the first rope's position
        const firstRope = this.ropes[0];
        this.player = new Player(
            firstRope.anchorX,
            firstRope.anchorY + firstRope.length
        );
        
        // Attach player to the first rope
        this.player.attachToRope(firstRope);
        this.isMouseDown = true;  // Start with mouse down to keep attached

        this.victoryExplosion = null;

        // Add sea after canvas setup
        this.sea = new Sea(this.canvas);

        this.bindEvents();
        this.gameLoop();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth - 40;
        this.canvas.height = window.innerHeight - 40;
    }

    generateRopes() {
        const ropes = [];
        this.birds = [];  // Initialize birds array
        
        // Calculate position for the single rope and bird
        const x = this.canvas.width * 0.2;
        const y = 100;
        
        // Create the single bird
        const birdSize = 30 + Math.random() * 20;
        const bird = new Bird(x, y, birdSize);
        this.birds.push(bird);
        
        // Create the single rope
        const rope = new Rope(x, y, 200);
        ropes.push(rope);
        
        return ropes;
    }

    createInstructions() {
        this.instructionsDiv = document.createElement('div');
        this.instructionsDiv.className = 'instructions';
        this.instructionsDiv.innerHTML = `
            <p>Click and hold to grab the rope and swing!</p>
            <p>Release to let go and try to reach the next rope!</p>
        `;
        document.querySelector('.game-container').appendChild(this.instructionsDiv);
    }

    bindEvents() {
        const handleStart = (e) => {
            this.isMouseDown = true;
            if (!this.player.isSwinging) {
                // Find closest rope
                const mouseX = e.type === 'mousedown' ? e.offsetX : e.touches[0].clientX - this.canvas.offsetLeft;
                const mouseY = e.type === 'mousedown' ? e.offsetY : e.touches[0].clientY - this.canvas.offsetTop;
                
                let closestRope = null;
                let minDist = Infinity;

                this.ropes.forEach(rope => {
                    const dist = Math.hypot(mouseX - this.player.x, mouseY - this.player.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closestRope = rope;
                    }
                });

                if (closestRope && minDist < 100) {
                    this.player.attachToRope(closestRope);
                }
            }
        };

        const handleEnd = () => {
            this.isMouseDown = false;
            this.player.release();
            
            // Hide instructions after first release
            if (!this.hasSwung && this.instructionsDiv) {
                this.instructionsDiv.style.display = 'none';
                this.hasSwung = true;
            }
        };

        // Mouse events
        this.canvas.addEventListener('mousedown', handleStart);
        this.canvas.addEventListener('mouseup', handleEnd);

        // Touch events
        this.canvas.addEventListener('touchstart', handleStart);
        this.canvas.addEventListener('touchend', handleEnd);
    }

    update() {
        // Update sea first
        this.sea.update();

        // Update cloud positions
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.canvas.width + cloud.baseSize * 2) {
                cloud.x = -cloud.baseSize * 2;
            }
        });

        // Update victory explosion if it exists
        if (this.victoryExplosion) {
            this.victoryExplosion.update();
            if (this.victoryExplosion.isFinished() && this.player.victoryState === 'done') {
                this.resetPlayer();
                this.victoryExplosion = null;
            }
            this.player.update();
            return;
        }

        // Update all ropes
        this.ropes.forEach(rope => rope.update());
        this.player.update();
        this.finishLine.update();

        // Check for rope collisions if player is not already swinging
        if (!this.player.isSwinging) {
            this.checkRopeCollisions();
        }

        // Check if player has reached the finish line
        if (this.player.x >= this.finishLine.x && 
            this.player.x <= this.finishLine.x + this.finishLine.width) {
            this.startVictoryAnimation();
        }

        // Check if player is out of bounds
        if (this.player.y > this.canvas.height + 50) {
            this.resetPlayer();
        }

        // Update player physics when on sandDune
        if (!this.player.isSwinging && this.sandDune) {
            const { point, distance, index } = this.sandDune.findClosestPoint(this.player.x, this.player.y);
            
            if (distance < this.player.radius + 10) {
                if (!this.playerRolling) {
                    // Start rolling
                    this.playerRolling = true;
                    this.rollVelocity = Math.hypot(this.player.velocityX, this.player.velocityY);
                    if (this.rollVelocity < this.sandDune.boostSpeed) {
                        this.rollVelocity = this.sandDune.boostSpeed;
                    }
                }
                
                // Get the normal angle at this point
                const normalAngle = this.sandDune.getNormalAngle(index);
                
                // Update player position along the curve
                this.rollVelocity *= this.sandDune.friction;
                this.rollVelocity += Math.sin(normalAngle) * this.sandDune.gravity;
                
                // Calculate next position
                const nextIndex = (this.player.x > point.x) ? 
                    Math.min(index + 1, this.sandDune.curvePoints.length - 1) :
                    Math.max(index - 1, 0);
                    
                const nextPoint = this.sandDune.curvePoints[nextIndex];
                
                // Update player position
                const direction = Math.sign(this.rollVelocity);
                this.player.x += direction * Math.abs(this.rollVelocity) * Math.cos(normalAngle);
                this.player.y = point.y;
                
                // Update roll angle for visual effect
                this.rollAngle += this.rollVelocity * 0.1;
                
                // Zero out normal velocities
                this.player.velocityX = this.rollVelocity * Math.cos(normalAngle);
                this.player.velocityY = this.rollVelocity * Math.sin(normalAngle);
            } else {
                this.playerRolling = false;
            }
        } else {
            this.playerRolling = false;
        }
    }

    checkRopeCollisions() {
        this.ropes.forEach(rope => {
            // Skip if this is the rope we just detached from
            if (rope === this.player.lastRope) return;

            // Calculate vector from rope anchor to player
            const dx = this.player.x - rope.anchorX;
            const dy = this.player.y - rope.anchorY;
            
            // Calculate closest point on rope line segment to player
            const ropeVectorX = rope.endX - rope.anchorX;
            const ropeVectorY = rope.endY - rope.anchorY;
            const ropeLengthSq = ropeVectorX * ropeVectorX + ropeVectorY * ropeVectorY;
            
            // Project player position onto rope vector (clamped between 0 and 1)
            const t = Math.max(0, Math.min(1, (dx * ropeVectorX + dy * ropeVectorY) / ropeLengthSq));
            
            // Calculate the closest point on the rope
            const closestX = rope.anchorX + t * ropeVectorX;
            const closestY = rope.anchorY + t * ropeVectorY;
            
            // Check if player is close enough to the rope
            const distanceToRope = Math.hypot(this.player.x - closestX, this.player.y - closestY);
            
            if (distanceToRope < this.player.radius + 5) {
                // Calculate the angle at the point of contact
                const contactAngle = Math.atan2(closestX - rope.anchorX, closestY - rope.anchorY);
                
                // Attach player to the rope at the point of contact
                this.player.attachToRopeAtPoint(rope, contactAngle);
                this.isMouseDown = true; // Keep player attached
            }
        });
    }

    startVictoryAnimation() {
        this.victoryExplosion = new VictoryExplosion(this.player.x, this.player.y);
        this.player.isVictorious = true;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
    }

    resetPlayer() {
        const firstRope = this.ropes[0];
        this.player.x = firstRope.anchorX;
        this.player.y = firstRope.anchorY + firstRope.length;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isSwinging = true;
        this.player.isVictorious = false;
        this.player.opacity = 1;
        this.player.attachToRope(firstRope);
        this.player.attachmentDistance = firstRope.length;
        this.isMouseDown = true;
    }

    drawSun() {
        const { x, y, radius, glowRadius, rays, rayLength } = this.sun;
        this.sun.time += this.sun.speed;

        // Create sun glow gradient
        const glowGradient = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

        // Draw outer glow
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw sun rays
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.sun.time);

        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            const rayStart = radius + Math.sin(this.sun.time * 3 + i) * 5;
            const rayEnd = rayStart + rayLength + Math.sin(this.sun.time * 2 + i * 2) * 10;

            this.ctx.beginPath();
            this.ctx.moveTo(
                Math.cos(angle) * rayStart,
                Math.sin(angle) * rayStart
            );
            this.ctx.lineTo(
                Math.cos(angle) * rayEnd,
                Math.sin(angle) * rayEnd
            );

            this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        this.ctx.restore();

        // Draw main sun disc with gradient
        const sunGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        sunGradient.addColorStop(0, '#FFF7D6');
        sunGradient.addColorStop(0.7, '#FFE5A3');
        sunGradient.addColorStop(1, '#FFD700');

        this.ctx.fillStyle = sunGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun before clouds
        this.drawSun();

        // Draw background elements
        this.drawClouds();
        
        // Draw sea before ropes
        this.sea.draw(this.ctx);

        // Draw finish line behind ropes
        this.finishLine.draw(this.ctx);

        // Draw sandDune BEFORE birds and ropes for proper layering
        if (this.sandDune) {
            this.ctx.save();
            // Add extra visibility
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 5;
            this.sandDune.draw(this.ctx);
            this.ctx.restore();
        }

        // Draw birds and ropes
        this.birds.forEach(bird => {
            bird.update();
            bird.draw(this.ctx);
        });
        this.ropes.forEach(rope => rope.draw(this.ctx));

        // Draw player with roll animation if rolling
        if (this.playerRolling) {
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);
            this.ctx.rotate(this.rollAngle);
            this.ctx.translate(-this.player.x, -this.player.y);
        }
        
        this.player.draw(this.ctx);
        
        if (this.playerRolling) {
            this.ctx.restore();
        }

        // Draw victory explosion if it exists
        if (this.victoryExplosion) {
            this.victoryExplosion.draw(this.ctx);
        }
    }

    drawClouds() {
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            
            // Draw main circle
            this.ctx.arc(cloud.x, cloud.y, cloud.baseSize, 0, Math.PI * 2);
            
            // Draw the fixed circle positions
            cloud.circles.forEach(circle => {
                this.ctx.arc(
                    cloud.x + circle.offsetX,
                    cloud.y + circle.offsetY,
                    circle.size,
                    0, Math.PI * 2
                );
            });
            
            // Draw the fixed detail positions
            cloud.details.forEach(detail => {
                this.ctx.arc(
                    cloud.x + detail.offsetX,
                    cloud.y + detail.offsetY,
                    detail.size,
                    0, Math.PI * 2
                );
            });
            
            // Fill with slight transparency for a softer look
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fill();
        });
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the window loads
window.onload = () => {
    new Game();
}; 