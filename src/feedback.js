import * as THREE from 'three';

export class FeedbackSystem {
    constructor(scene3D) {
        this.scene = scene3D;
        this.particles = [];
        this.motionTrails = [];
        this.messageTimeout = null;
    }

    showMessage(text, color = '#00ffff') {
        const feedbackElement = document.getElementById('interaction-feedback');
        feedbackElement.textContent = text;
        feedbackElement.style.color = color;
        feedbackElement.classList.add('show');

        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            feedbackElement.classList.remove('show');
        }, 1500);
    }

    createParticles(position, color = '#00ffff') {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 2 + 1,
                z: (Math.random() - 0.5) * 2
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: new THREE.Color(color),
            size: 0.05,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        this.particles.push({
            system: particleSystem,
            velocities: velocities,
            lifetime: 1.0,
            maxLifetime: 1.0
        });
    }

    createMotionTrail(position, color = '#00ffff') {
        const geometry = new THREE.SphereGeometry(0.03, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const trail = new THREE.Mesh(geometry, material);
        trail.position.set(position.x, position.y, position.z);
        this.scene.add(trail);

        this.motionTrails.push({
            mesh: trail,
            lifetime: 0.5,
            maxLifetime: 0.5
        });
    }

    createRipple(position, color = '#00ffff') {
        const geometry = new THREE.RingGeometry(0.1, 0.15, 32);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const ripple = new THREE.Mesh(geometry, material);
        ripple.position.set(position.x, position.y, position.z);
        ripple.lookAt(this.scene.getCamera().position);
        this.scene.add(ripple);

        const startTime = Date.now();
        const duration = 800;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = 1 + progress * 3;
                ripple.scale.set(scale, scale, 1);
                ripple.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ripple);
                ripple.geometry.dispose();
                ripple.material.dispose();
            }
        };

        animate();
    }

    update(deltaTime) {
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.lifetime -= deltaTime;

            if (particle.lifetime <= 0) {
                this.scene.remove(particle.system);
                particle.system.geometry.dispose();
                particle.system.material.dispose();
                return false;
            }

            const positions = particle.system.geometry.attributes.position.array;
            particle.velocities.forEach((velocity, index) => {
                positions[index * 3] += velocity.x * deltaTime;
                positions[index * 3 + 1] += velocity.y * deltaTime;
                positions[index * 3 + 2] += velocity.z * deltaTime;

                velocity.y -= 9.82 * deltaTime; // Gravity
            });

            particle.system.geometry.attributes.position.needsUpdate = true;
            particle.system.material.opacity = particle.lifetime / particle.maxLifetime;

            return true;
        });

        // Update motion trails
        this.motionTrails = this.motionTrails.filter(trail => {
            trail.lifetime -= deltaTime;

            if (trail.lifetime <= 0) {
                this.scene.remove(trail.mesh);
                trail.mesh.geometry.dispose();
                trail.mesh.material.dispose();
                return false;
            }

            const scale = trail.lifetime / trail.maxLifetime;
            trail.mesh.scale.setScalar(scale);
            trail.mesh.material.opacity = scale * 0.6;

            return true;
        });
    }
}
