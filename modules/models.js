// Model loading, management, and security sanitization
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ModelManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        
        this.dozerModel = null;
        this.currentModel = null;
        this.loadedModels = [];
        this.activeModelIndex = 0;
        this.moveSpeed = 0.01;
        this.isMoving = false;
        this.moveDirection = { x: 0, z: 0 };
        this.scoopRotation = 0;
        
        this.loader = new GLTFLoader();
    }
    
    loadModel(modelPath, addToExisting = false, fileName = null) {
        // Clear all models if not adding to existing
        if (!addToExisting) {
            this.loadedModels.forEach(modelData => {
                this.scene.remove(modelData.model);
            });
            this.loadedModels = [];
            this.activeModelIndex = 0;
            this.currentModel = null;
            this.dozerModel = null;
        }
        
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Sanitize the loaded model
                    this.sanitizeModel(model);
                    
                    // Enable shadows on the model
                    this.enableShadowsOnModel(model);
                    
                    this.scene.add(model);
                    
                    // Determine model name
                    let modelName;
                    if (fileName) {
                        // Remove file extension and use the filename
                        modelName = fileName.replace(/\.[^/.]+$/, "");
                    } else if (modelPath.includes('/')) {
                        // Extract name from path
                        const pathParts = modelPath.split('/');
                        modelName = pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, "");
                    } else {
                        modelName = `Model ${this.loadedModels.length + 1}`;
                    }
                    
                    // Create model data object
                    const modelData = {
                        model: model,
                        name: modelName,
                        path: modelPath,
                        visible: true
                    };
                    
                    this.loadedModels.push(modelData);
                    
                    // Set as active model if it's the first one or if not adding to existing
                    if (this.loadedModels.length === 1 || !addToExisting) {
                        this.dozerModel = model;
                        this.currentModel = model;
                        this.activeModelIndex = this.loadedModels.length - 1;
                    }
                    
                    // Reset rotation
                    this.scoopRotation = 0;
                    
                    console.log(`Loaded model: ${modelName}`);
                    resolve(modelData);
                },
                undefined,
                (error) => {
                    console.error("An error happened while loading the model:", error);
                    reject(error);
                }
            );
        });
    }
    
    loadModelWithFolder(gltfFile, fileMap) {
        // Clear the previous model if it exists
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel = null;
            this.dozerModel = null;
        }
        
        // Set up custom resource loading
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url, path) => {
            // Try to find the resource in our file map
            const foundFile = fileMap.get(url) || fileMap.get(url.split('/').pop());
            if (foundFile) {
                return foundFile;
            }
            return url;
        });
        
        this.loader.setManager(manager);
        
        const gltfUrl = URL.createObjectURL(gltfFile);
        
        return new Promise((resolve, reject) => {
            this.loader.load(
                gltfUrl,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Sanitize the loaded model
                    this.sanitizeModel(model);
                    
                    // Enable shadows on the model
                    this.enableShadowsOnModel(model);
                    
                    this.scene.add(model);
                    this.dozerModel = model;
                    this.currentModel = model;
                    // Reset rotation
                    this.scoopRotation = 0;
                    
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.error("An error happened while loading the model:", error);
                    reject(error);
                }
            );
        });
    }
    
    selectModel(index) {
        if (index >= 0 && index < this.loadedModels.length) {
            this.activeModelIndex = index;
            this.currentModel = this.loadedModels[index].model;
            this.dozerModel = this.currentModel; // For movement controls
            
            console.log(`Selected model: ${this.loadedModels[index].name}`);
            return this.loadedModels[index];
        }
        return null;
    }
    
    removeModel(index) {
        if (index >= 0 && index < this.loadedModels.length) {
            const modelData = this.loadedModels[index];
            
            // Remove from scene
            this.scene.remove(modelData.model);
            
            // Remove from array
            this.loadedModels.splice(index, 1);
            
            // Update active model index
            if (this.loadedModels.length === 0) {
                this.activeModelIndex = 0;
                this.currentModel = null;
                this.dozerModel = null;
            } else {
                // If we removed the active model, select the first available model
                if (index === this.activeModelIndex) {
                    this.activeModelIndex = 0;
                    this.selectModel(0);
                } else if (index < this.activeModelIndex) {
                    // Adjust active index if we removed a model before the active one
                    this.activeModelIndex--;
                }
            }
            
            console.log(`Removed model at index ${index}`);
            return true;
        }
        return false;
    }
    
    toggleModelVisibility(index) {
        if (index >= 0 && index < this.loadedModels.length) {
            const modelData = this.loadedModels[index];
            modelData.visible = !modelData.visible;
            modelData.model.visible = modelData.visible;
            return modelData.visible;
        }
        return false;
    }
    
    // Movement controls
    startMovement(direction) {
        this.moveDirection = direction;
        this.isMoving = true;
    }
    
    stopMovement() {
        this.isMoving = false;
        this.moveDirection = { x: 0, z: 0 };
    }
    
    updateMovement() {
        // Move the active model
        if (this.dozerModel && this.isMoving) {
            this.dozerModel.position.x += this.moveDirection.x * this.moveSpeed;
            this.dozerModel.position.z += this.moveDirection.z * this.moveSpeed;
        }
    }
    
    // Security sanitization functions
    sanitizeModel(model) {
        console.log('Sanitizing model for security...');
        
        const traverse = (object) => {
            // Remove any script-like properties or functions
            const dangerousProps = [
                'onBeforeRender', 'onAfterRender', 'onBeforeCompile',
                'callback', 'script', 'eval', 'innerHTML', 'outerHTML'
            ];
            
            dangerousProps.forEach(prop => {
                if (object.hasOwnProperty(prop)) {
                    console.warn(`Removing potentially dangerous property: ${prop}`);
                    delete object[prop];
                }
            });
            
            // Sanitize materials
            if (object.material) {
                this.sanitizeMaterial(object.material);
            }
            
            // Sanitize geometry
            if (object.geometry) {
                this.sanitizeGeometry(object.geometry);
            }
            
            // Remove any userData that might contain scripts
            if (object.userData && typeof object.userData === 'object') {
                object.userData = this.sanitizeUserData(object.userData);
            }
            
            // Recursively sanitize children
            if (object.children && object.children.length > 0) {
                object.children.forEach(child => traverse(child));
            }
        };
        
        traverse(model);
        console.log('Model sanitization complete.');
    }
    
    sanitizeMaterial(material) {
        if (Array.isArray(material)) {
            material.forEach(mat => this.sanitizeMaterial(mat));
            return;
        }
        
        // Remove potentially dangerous material properties
        const dangerousProps = [
            'onBeforeCompile', 'customProgramCacheKey', 'onBeforeRender'
        ];
        
        dangerousProps.forEach(prop => {
            if (material.hasOwnProperty(prop)) {
                console.warn(`Removing dangerous material property: ${prop}`);
                delete material[prop];
            }
        });
        
        // Sanitize shader uniforms if present
        if (material.uniforms) {
            material.uniforms = this.sanitizeUniforms(material.uniforms);
        }
    }
    
    sanitizeGeometry(geometry) {
        // Remove any potentially dangerous geometry properties
        const dangerousProps = ['onDispose', 'callback'];
        
        dangerousProps.forEach(prop => {
            if (geometry.hasOwnProperty(prop)) {
                console.warn(`Removing dangerous geometry property: ${prop}`);
                delete geometry[prop];
            }
        });
    }
    
    sanitizeUserData(userData) {
        if (!userData || typeof userData !== 'object') {
            return {};
        }
        
        const sanitized = {};
        
        for (const [key, value] of Object.entries(userData)) {
            // Only allow safe data types
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                // Additional string sanitization
                if (typeof value === 'string') {
                    // Remove any script-like content
                    const cleanValue = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                          .replace(/javascript:/gi, '')
                                          .replace(/on\w+\s*=/gi, '');
                    sanitized[key] = cleanValue;
                } else {
                    sanitized[key] = value;
                }
            } else if (Array.isArray(value)) {
                // Recursively sanitize arrays of safe values
                sanitized[key] = value.filter(item => 
                    typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
                );
            }
            // Skip functions, objects, and other potentially dangerous types
        }
        
        return sanitized;
    }
    
    sanitizeUniforms(uniforms) {
        if (!uniforms || typeof uniforms !== 'object') {
            return {};
        }
        
        const sanitized = {};
        
        for (const [key, uniform] of Object.entries(uniforms)) {
            if (uniform && typeof uniform === 'object' && uniform.value !== undefined) {
                // Only allow safe uniform types
                const value = uniform.value;
                if (typeof value === 'number' || 
                    (Array.isArray(value) && value.every(v => typeof v === 'number')) ||
                    (value && value.isVector2) ||
                    (value && value.isVector3) ||
                    (value && value.isVector4) ||
                    (value && value.isMatrix3) ||
                    (value && value.isMatrix4) ||
                    (value && value.isTexture)) {
                    sanitized[key] = uniform;
                }
            }
        }
        
        return sanitized;
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
    
    // Utility methods for other modules
    getAllMeshes(object, meshes = []) {
        if (object.isMesh) {
            meshes.push(object);
        }
        
        if (object.children) {
            object.children.forEach(child => this.getAllMeshes(child, meshes));
        }
        
        return meshes;
    }
    
    findParentModel(object) {
        // Check if this object is one of our loaded models
        for (const modelData of this.loadedModels) {
            if (this.isDescendantOf(object, modelData.model)) {
                return modelData.model;
            }
        }
        return null;
    }
    
    isDescendantOf(child, parent) {
        let current = child;
        while (current) {
            if (current === parent) return true;
            current = current.parent;
        }
        return false;
    }
    
    // New method to scale the current model
    scaleCurrentModel(factor) {
        if (this.currentModel) {
            // Clamp scale to avoid disappearing or being too huge
            const minScale = 0.05;
            const maxScale = 10;
            const currentScale = this.currentModel.scale.x;
            let newScale = currentScale * factor;
            newScale = Math.max(minScale, Math.min(maxScale, newScale));
            this.currentModel.scale.set(newScale, newScale, newScale);
        }
    }
}
