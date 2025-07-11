// UI management, event listeners, and DOM manipulation
export class UIManager {
    constructor(modelManager, lightingManager) {
        this.modelManager = modelManager;
        this.lightingManager = lightingManager;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCustomEventListeners();
    }
    
    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupControls();
            });
        } else {
            this.setupControls();
        }
    }
    
    setupControls() {
        this.setupMovementControls();
        this.setupFileControls();
        this.setupShadowControls();
        this.setupGroundTextureControl();
        this.setupScaleControls();
        this.setupAxisToggleControl();
        this.setupRotateControls();
    }
    
    setupMovementControls() {
        // Movement controls
        const forwardBtn = document.getElementById("forward-btn");
        const backwardBtn = document.getElementById("backward-btn");
        const leftBtn = document.getElementById("left-btn");
        const rightBtn = document.getElementById("right-btn");
        const stopBtn = document.getElementById("stop-btn");
        
        if (forwardBtn) {
            forwardBtn.addEventListener("click", () => {
                this.modelManager.startMovement({ x: 0, z: -1 });
            });
        }
        
        if (backwardBtn) {
            backwardBtn.addEventListener("click", () => {
                this.modelManager.startMovement({ x: 0, z: 1 });
            });
        }
        
        if (leftBtn) {
            leftBtn.addEventListener("click", () => {
                this.modelManager.startMovement({ x: -1, z: 0 });
            });
        }
        
        if (rightBtn) {
            rightBtn.addEventListener("click", () => {
                this.modelManager.startMovement({ x: 1, z: 0 });
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener("click", () => {
                this.modelManager.stopMovement();
            });
        }
    }
    
    setupFileControls() {
        // GLB file upload handling
        const fileUpload = document.getElementById("file-upload");
        if (fileUpload) {
            fileUpload.addEventListener("change", async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        const url = URL.createObjectURL(file);
                        const modelData = await this.modelManager.loadModel(url, false, file.name);
                        this.updateModelList();
                        this.dispatchNodeDiscoveryEvent(modelData.model);
                    } catch (error) {
                        alert("Failed to load the model. Please try:\\n1. Use a GLB file instead (self-contained)\\n2. Make sure all texture files are in the same folder\\n3. Check the browser console for details");
                    }
                }
            });
        }
        
        // Add Another Model button handling
        const addFileBtn = document.getElementById("add-file-btn");
        if (addFileBtn) {
            addFileBtn.addEventListener("click", () => {
                // Create a hidden file input
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.glb';
                fileInput.style.display = 'none';
                
                fileInput.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        try {
                            const url = URL.createObjectURL(file);
                            const modelData = await this.modelManager.loadModel(url, true, file.name);
                            this.updateModelList();
                            if (modelData.model === this.modelManager.currentModel) {
                                this.dispatchNodeDiscoveryEvent(modelData.model);
                            }
                        } catch (error) {
                            alert("Failed to load the model. Please check the console for details.");
                        }
                    }
                    // Remove the temporary input
                    document.body.removeChild(fileInput);
                });
                
                // Add to DOM, click, and remove
                document.body.appendChild(fileInput);
                fileInput.click();
            });
        }
    }
    
    setupShadowControls() {
        // Shadow toggle button
        const toggleShadowsBtn = document.getElementById('toggle-shadows-btn');
        if (toggleShadowsBtn) {
            toggleShadowsBtn.addEventListener('click', () => {
                this.lightingManager.toggleShadows(this.modelManager);
            });
        }
    }
    
    setupGroundTextureControl() {
        // Add a file input for ground texture if not present
        let groundInput = document.getElementById('ground-texture-upload');
        if (!groundInput) {
            groundInput = document.createElement('input');
            groundInput.type = 'file';
            groundInput.accept = 'image/*';
            groundInput.id = 'ground-texture-upload';
            groundInput.style.marginBottom = '10px';
            groundInput.style.display = 'block';
            // Insert into the File Management panel
            const filePanel = document.getElementById('file-panel');
            if (filePanel) {
                filePanel.insertBefore(groundInput, filePanel.firstChild);
                // Add a label
                const label = document.createElement('label');
                label.textContent = '🌱 Ground Texture:';
                label.style.fontSize = '12px';
                label.style.fontWeight = 'bold';
                label.style.display = 'block';
                label.style.marginBottom = '2px';
                filePanel.insertBefore(label, groundInput);
            }
        }
        // Wire up the input
        groundInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && window.sceneManager && typeof window.sceneManager.setGroundTexture === 'function') {
                window.sceneManager.setGroundTexture(file);
            }
        });
    }
    
    setupScaleControls() {
        const scaleUpBtn = document.getElementById('scale-up-btn');
        const scaleDownBtn = document.getElementById('scale-down-btn');
        if (scaleUpBtn) {
            scaleUpBtn.addEventListener('click', () => {
                this.modelManager.scaleCurrentModel(1.1); // Scale up by 10%
            });
        }
        if (scaleDownBtn) {
            scaleDownBtn.addEventListener('click', () => {
                this.modelManager.scaleCurrentModel(0.9); // Scale down by 10%
            });
        }
    }
    
    setupAxisToggleControl() {
        const axisBtn = document.getElementById('toggle-axis-btn');
        if (axisBtn) {
            axisBtn.addEventListener('click', () => {
                if (window.sceneManager) {
                    window.sceneManager.toggleAxisHelper();
                    // Update button text
                    axisBtn.textContent = window.sceneManager.isAxisVisible() ? 'Hide Axis' : 'Show Axis';
                }
            });
            // Set initial button text
            if (window.sceneManager && !window.sceneManager.isAxisVisible()) {
                axisBtn.textContent = 'Show Axis';
            }
        }
    }
    
    setupRotateControls() {
        const rotateLeftBtn = document.getElementById('rotate-left-btn');
        const rotateRightBtn = document.getElementById('rotate-right-btn');
        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => {
                this.modelManager.rotateCurrentModel(-Math.PI / 12); // Rotate left by 15 degrees
            });
        }
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => {
                this.modelManager.rotateCurrentModel(Math.PI / 12); // Rotate right by 15 degrees
            });
        }
    }
    
    setupCustomEventListeners() {
        // Listen for model selection events from interaction manager
        document.addEventListener('modelSelected', (event) => {
            this.updateModelList();
            this.dispatchNodeDiscoveryEvent(event.detail.modelData.model);
        });
        
        // Listen for light toggle events from interaction manager
        document.addEventListener('lightToggleRequested', () => {
            this.lightingManager.toggleLightSphere();
        });
    }
    
    updateModelList() {
        const modelList = document.getElementById('model-list');
        const modelsContent = document.getElementById('models-content');
        
        if (!modelList || !modelsContent) return;
        
        if (this.modelManager.loadedModels.length === 0) {
            modelList.style.display = 'none';
            return;
        }
        
        modelsContent.innerHTML = '';
        
        this.modelManager.loadedModels.forEach((modelData, index) => {
            const modelDiv = document.createElement('div');
            modelDiv.style.display = 'flex';
            modelDiv.style.justifyContent = 'space-between';
            modelDiv.style.alignItems = 'center';
            modelDiv.style.marginBottom = '5px';
            modelDiv.style.padding = '5px';
            modelDiv.style.backgroundColor = index === this.modelManager.activeModelIndex ? '#d0e7ff' : '#f8f8f8';
            modelDiv.style.border = index === this.modelManager.activeModelIndex ? '2px solid #0066cc' : '1px solid #ccc';
            modelDiv.style.borderRadius = '3px';
            modelDiv.style.cursor = 'pointer';
            
            const modelInfo = document.createElement('div');
            modelInfo.style.fontSize = '12px';
            modelInfo.style.fontWeight = index === this.modelManager.activeModelIndex ? 'bold' : 'normal';
            modelInfo.textContent = `${index === this.modelManager.activeModelIndex ? '▶ ' : '  '}${modelData.name} ${modelData.visible ? '👁️' : '🚫'}`;
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '5px';
            
            // Visibility toggle button
            const visibilityBtn = document.createElement('button');
            visibilityBtn.textContent = modelData.visible ? 'Hide' : 'Show';
            visibilityBtn.style.padding = '2px 6px';
            visibilityBtn.style.fontSize = '10px';
            visibilityBtn.style.border = '1px solid #333';
            visibilityBtn.style.background = '#fff';
            visibilityBtn.style.cursor = 'pointer';
            visibilityBtn.style.borderRadius = '2px';
            
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.modelManager.toggleModelVisibility(index);
                this.updateModelList();
            });
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.padding = '2px 6px';
            removeBtn.style.fontSize = '10px';
            removeBtn.style.border = '1px solid #333';
            removeBtn.style.background = '#ffdddd';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.borderRadius = '2px';
            
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const removed = this.modelManager.removeModel(index);
                if (removed) {
                    this.updateModelList();
                    // Hide node list if no models left
                    if (this.modelManager.loadedModels.length === 0) {
                        const nodeList = document.getElementById('node-list');
                        if (nodeList) nodeList.style.display = 'none';
                    } else {
                        // Update node list for the currently selected model
                        this.dispatchNodeDiscoveryEvent(this.modelManager.currentModel);
                    }
                }
            });
            
            buttonContainer.appendChild(visibilityBtn);
            buttonContainer.appendChild(removeBtn);
            
            modelDiv.appendChild(modelInfo);
            modelDiv.appendChild(buttonContainer);
            
            // Click to select model
            modelDiv.addEventListener('click', () => {
                const selectedModel = this.modelManager.selectModel(index);
                if (selectedModel) {
                    this.updateModelList();
                    this.dispatchNodeDiscoveryEvent(selectedModel.model);
                }
            });
            
            modelsContent.appendChild(modelDiv);
        });
        
        modelList.style.display = 'block';
    }
    
    // Event dispatching for communication with other modules
    dispatchNodeDiscoveryEvent(model) {
        const event = new CustomEvent('nodeDiscoveryRequested', { 
            detail: { model } 
        });
        document.dispatchEvent(event);
    }
}
