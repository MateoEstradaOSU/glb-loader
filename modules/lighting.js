// Lighting controls and light sphere management
import * as THREE from "three";

export class LightingManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        this.directionalLight = sceneManager.directionalLight;
        
        this.lightSphere = null;
        this.lightPosition = { x: 5, y: 10, z: 5 };
        this.lightSphereVisible = true;
        this.shadowsEnabled = true;
        
        this.init();
    }
    
    init() {
        this.createLightSphere();
        this.setupEventListeners();
    }
    
    createLightSphere() {
        const lightSphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const lightSphereMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.8 
        });
        this.lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
        this.lightSphere.position.copy(this.directionalLight.position);
        this.scene.add(this.lightSphere);
    }
    
    updateLightPosition() {
        // Update directional light position
        this.directionalLight.position.set(this.lightPosition.x, this.lightPosition.y, this.lightPosition.z);
        
        // Update light sphere position
        this.lightSphere.position.copy(this.directionalLight.position);
        
        // Make the light look at the center of the scene
        this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.target.updateMatrixWorld();
        
        console.log(`Light position updated: x=${this.lightPosition.x}, y=${this.lightPosition.y}, z=${this.lightPosition.z}`);
    }
    
    toggleLightSphere() {
        this.lightSphereVisible = !this.lightSphereVisible;
        this.lightSphere.visible = this.lightSphereVisible;
        console.log(`Light sphere ${this.lightSphereVisible ? 'shown' : 'hidden'}`);
        
        // Update button if it exists
        const toggleSphereBtn = document.getElementById('toggle-light-sphere-btn');
        if (toggleSphereBtn) {
            toggleSphereBtn.textContent = this.lightSphereVisible ? 'Hide Light Sphere' : 'Show Light Sphere';
            toggleSphereBtn.style.background = this.lightSphereVisible ? '#ffff99' : '#dddddd';
        }
    }
    
    toggleShadows(modelManager) {
        this.shadowsEnabled = !this.shadowsEnabled;
        
        // Toggle renderer shadow map
        this.sceneManager.renderer.shadowMap.enabled = this.shadowsEnabled;
        
        // Update the button appearance
        const toggleBtn = document.getElementById('toggle-shadows-btn');
        if (toggleBtn) {
            if (this.shadowsEnabled) {
                toggleBtn.textContent = 'ON';
                toggleBtn.style.background = '#90EE90'; // Light green
            } else {
                toggleBtn.textContent = 'OFF';
                toggleBtn.style.background = '#FFB6C1'; // Light pink
            }
        }
        
        // Toggle shadows on all loaded models
        if (modelManager && modelManager.loadedModels) {
            modelManager.loadedModels.forEach(modelData => {
                this.toggleModelShadows(modelData.model, this.shadowsEnabled);
            });
        }
        
        console.log(`Shadows ${this.shadowsEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleModelShadows(model, enabled) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = enabled;
                child.receiveShadow = enabled;
            }
        });
    }
    
    enableShadowsOnModel(model) {
        // Recursively enable shadows on all meshes in the model
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Ensure materials support shadows
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.isMeshBasicMaterial) {
                                // Convert MeshBasicMaterial to MeshLambertMaterial for shadow support
                                const newMaterial = new THREE.MeshLambertMaterial({
                                    map: mat.map,
                                    color: mat.color,
                                    transparent: mat.transparent,
                                    opacity: mat.opacity
                                });
                                mat = newMaterial;
                            }
                        });
                    } else {
                        if (child.material.isMeshBasicMaterial) {
                            // Convert MeshBasicMaterial to MeshLambertMaterial for shadow support
                            const newMaterial = new THREE.MeshLambertMaterial({
                                map: child.material.map,
                                color: child.material.color,
                                transparent: child.material.transparent,
                                opacity: child.material.opacity
                            });
                            child.material = newMaterial;
                        }
                    }
                }
            }
        });
    }
    
    resetToDefault() {
        // Reset to default values
        this.lightPosition = { x: 5, y: 10, z: 5 };
        
        // Update sliders
        const xSlider = document.getElementById('light-x-slider');
        const ySlider = document.getElementById('light-y-slider');
        const zSlider = document.getElementById('light-z-slider');
        const xValue = document.getElementById('light-x-value');
        const yValue = document.getElementById('light-y-value');
        const zValue = document.getElementById('light-z-value');
        
        if (xSlider) xSlider.value = this.lightPosition.x;
        if (ySlider) ySlider.value = this.lightPosition.y;
        if (zSlider) zSlider.value = this.lightPosition.z;
        
        // Update value displays
        if (xValue) xValue.textContent = this.lightPosition.x.toFixed(1);
        if (yValue) yValue.textContent = this.lightPosition.y.toFixed(1);
        if (zValue) zValue.textContent = this.lightPosition.z.toFixed(1);
        
        // Update light position
        this.updateLightPosition();
        
        console.log('Light position reset to default');
    }
    
    setupEventListeners() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLightControls();
        });
        
        // If DOM is already ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupLightControls();
            });
        } else {
            this.setupLightControls();
        }
    }
    
    setupLightControls() {
        const xSlider = document.getElementById('light-x-slider');
        const ySlider = document.getElementById('light-y-slider');
        const zSlider = document.getElementById('light-z-slider');
        const xValue = document.getElementById('light-x-value');
        const yValue = document.getElementById('light-y-value');
        const zValue = document.getElementById('light-z-value');
        const resetBtn = document.getElementById('reset-light-btn');
        const toggleSphereBtn = document.getElementById('toggle-light-sphere-btn');
        
        // X position slider
        if (xSlider) {
            xSlider.addEventListener('input', (e) => {
                this.lightPosition.x = parseFloat(e.target.value);
                if (xValue) xValue.textContent = this.lightPosition.x.toFixed(1);
                this.updateLightPosition();
            });
        }
        
        // Y position slider
        if (ySlider) {
            ySlider.addEventListener('input', (e) => {
                this.lightPosition.y = parseFloat(e.target.value);
                if (yValue) yValue.textContent = this.lightPosition.y.toFixed(1);
                this.updateLightPosition();
            });
        }
        
        // Z position slider
        if (zSlider) {
            zSlider.addEventListener('input', (e) => {
                this.lightPosition.z = parseFloat(e.target.value);
                if (zValue) zValue.textContent = this.lightPosition.z.toFixed(1);
                this.updateLightPosition();
            });
        }
        
        // Reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefault();
            });
        }
        
        // Toggle light sphere button
        if (toggleSphereBtn) {
            toggleSphereBtn.addEventListener('click', () => {
                this.toggleLightSphere();
            });
        }
    }
}
