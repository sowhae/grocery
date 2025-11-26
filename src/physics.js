import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = null;
        this.bodies = new Map();
        this.init();
    }

    init() {
        // Create physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // Better collision detection
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;

        // Default contact material
        const defaultMaterial = new CANNON.Material('default');
        const defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.4,
                restitution: 0.3
            }
        );
        this.world.addContactMaterial(defaultContactMaterial);
        this.world.defaultContactMaterial = defaultContactMaterial;
    }

    createBody(options) {
        const {
            mass = 1,
            position = { x: 0, y: 0, z: 0 },
            shape,
            material
        } = options;

        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: material
        });

        this.world.addBody(body);
        return body;
    }

    createBoxBody(options) {
        const { size, ...bodyOptions } = options;
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        return this.createBody({ ...bodyOptions, shape });
    }

    createSphereBody(options) {
        const { radius, ...bodyOptions } = options;
        const shape = new CANNON.Sphere(radius);
        return this.createBody({ ...bodyOptions, shape });
    }

    createCylinderBody(options) {
        const { radiusTop, radiusBottom, height, numSegments = 8, ...bodyOptions } = options;
        const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
        return this.createBody({ ...bodyOptions, shape });
    }

    removeBody(body) {
        this.world.removeBody(body);
    }

    update(deltaTime) {
        // Fixed time step for stable physics
        const fixedTimeStep = 1 / 60;
        this.world.step(fixedTimeStep, deltaTime, 3);
    }

    getWorld() {
        return this.world;
    }
}
