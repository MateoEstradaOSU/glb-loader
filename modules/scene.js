// Scene setup, camera, renderer, and basic lighting
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.hemisphereLight = null;
        this.directionalLight = null;
        this.fillLight = null;
        this.ambientLight = null;
        this.ground = null;
        this.axesHelper = null;
        this.labels = [];
        
        this.groundTexture = null; // Holds the current ground texture
        this.groundMaterial = null;
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLighting();
        this.createGround();
        this.createAxisHelper();
        this.createControls();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x3333333);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1, 3);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        document.body.appendChild(this.renderer.domElement);
    }
    
    createLighting() {
        // Hemisphere light
        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.hemisphereLight.position.set(0, 20, 0);
        this.scene.add(this.hemisphereLight);

        // Main directional light with shadows
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.directionalLight.position.set(5, 10, 5);
        this.directionalLight.castShadow = true;
        this.configureShadowCamera();
        this.scene.add(this.directionalLight);

        // Fill light
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        this.fillLight.position.set(-5, 8, -5);
        this.scene.add(this.fillLight);

        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(this.ambientLight);
    }
    
    configureShadowCamera() {
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -10;
        this.directionalLight.shadow.camera.right = 10;
        this.directionalLight.shadow.camera.top = 10;
        this.directionalLight.shadow.camera.bottom = -10;
        this.directionalLight.shadow.bias = -0.0001;
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const textureLoader = new THREE.TextureLoader();
        // Use the current groundTexture if set, otherwise load the default
        let groundTexture = this.groundTexture;
        if (!groundTexture) {
            groundTexture = textureLoader.load('assets/grass.jpeg');
            groundTexture.wrapS = THREE.RepeatWrapping;
            groundTexture.wrapT = THREE.RepeatWrapping;
            groundTexture.repeat.set(8, 8);
        }
        this.groundMaterial = new THREE.MeshLambertMaterial({ 
            map: groundTexture
        });
        this.ground = new THREE.Mesh(groundGeometry, this.groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.01;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    // Allow setting the ground texture from a File or URL
    setGroundTexture(fileOrUrl) {
        const textureLoader = new THREE.TextureLoader();
        let url;
        if (fileOrUrl instanceof File) {
            url = URL.createObjectURL(fileOrUrl);
        } else {
            url = fileOrUrl;
        }
        const newTexture = textureLoader.load(url, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(8, 8);
            this.groundMaterial.map = texture;
            this.groundMaterial.needsUpdate = true;
            this.groundTexture = texture;
        });
    }
    
    createAxisHelper() {
        this.axesHelper = new THREE.AxesHelper(5);
        this.scene.add(this.axesHelper);
        
        // Create axis labels
        const xLabel = this.createTextSprite('X', '#ff0000');
        xLabel.position.set(5.5, 0, 0);
        this.scene.add(xLabel);
        this.labels.push(xLabel);

        const yLabel = this.createTextSprite('Y', '#00ff00');
        yLabel.position.set(0, 5.5, 0);
        this.scene.add(yLabel);
        this.labels.push(yLabel);

        const zLabel = this.createTextSprite('Z', '#0000ff');
        zLabel.position.set(0, 0, 5.5);
        this.scene.add(zLabel);
        this.labels.push(zLabel);
    }
    
    createTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        context.font = '48px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.fillText(text, 32, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.5, 0.5, 1);
        
        return sprite;
    }
    
    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0);
    }
    
    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    toggleAxisHelper() {
        if (this.axesHelper) {
            this.axesHelper.visible = !this.axesHelper.visible;
            // Also toggle axis labels if present
            if (this.labels && this.labels.length) {
                this.labels.forEach(label => label.visible = this.axesHelper.visible);
            }
        }
    }
    isAxisVisible() {
        return this.axesHelper && this.axesHelper.visible;
    }
}
