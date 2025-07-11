// Mouse drag-and-drop, keyboard shortcuts, and raycasting interactions
import * as THREE from "three";

export class InteractionManager {
    constructor(sceneManager, modelManager) {
        this.sceneManager = sceneManager;
        this.modelManager = modelManager;
        this.scene = sceneManager.scene;
        this.camera = sceneManager.camera;
        this.renderer = sceneManager.renderer;
        this.controls = sceneManager.controls;
        
        // Mouse drag-and-drop variables
        this.isDragging = false;
        this.dragModel = null;
        this.mousePosition = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();
        this.dragIntersection = new THREE.Vector3();
        
        this.init();
    }
    
    init() {
        this.setupMouseDragListeners();
        this.setupKeyboardListeners();
    }
    
    setupMouseDragListeners() {
        // Mouse down event
        this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event), false);
        
        // Mouse move event
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        
        // Mouse up event
        this.renderer.domElement.addEventListener('mouseup', (event) => this.onMouseUp(event), false);
        
        // Prevent context menu on right click
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        }, false);
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
    }
    
    onMouseDown(event) {
        // Only handle left mouse button and if we have a current model
        if (event.button !== 0 || !this.modelManager.currentModel) return;
        
        // Check if mouse is over control panel area
        const controlsElement = document.querySelector('.controls');
        if (controlsElement) {
            const rect = controlsElement.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right &&
                event.clientY >= rect.top && event.clientY <= rect.bottom) {
                return; // Don't drag if clicking on controls
            }
        }
        
        this.updateMousePosition(event);
        
        // Cast ray from camera through mouse position
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        
        // Check for intersections with all loaded models
        const allObjects = [];
        this.modelManager.loadedModels.forEach(modelData => {
            if (modelData.visible && modelData.model) {
                this.modelManager.getAllMeshes(modelData.model, allObjects);
            }
        });
        
        if (allObjects.length === 0) return;
        
        const intersects = this.raycaster.intersectObjects(allObjects, false);
        
        if (intersects.length > 0) {
            // Find which model was clicked
            const clickedObject = intersects[0].object;
            const clickedModel = this.modelManager.findParentModel(clickedObject);
            
            if (clickedModel) {
                // Find the model data
                const modelData = this.modelManager.loadedModels.find(data => data.model === clickedModel);
                if (modelData) {
                    // Select this model if it's not already selected
                    const modelIndex = this.modelManager.loadedModels.indexOf(modelData);
                    if (modelIndex !== this.modelManager.activeModelIndex) {
                        this.modelManager.selectModel(modelIndex);
                        // Notify UI to update (event could be dispatched here)
                        this.dispatchModelSelectionEvent(modelIndex);
                    }
                    
                    // Start dragging the currently selected model
                    this.isDragging = true;
                    this.dragModel = this.modelManager.currentModel;
                    
                    if (this.controls) {
                        this.controls.enabled = false; // Disable orbit controls while dragging
                    }
                    
                    // Calculate drag offset
                    const intersectionPoint = intersects[0].point;
                    this.dragOffset.copy(intersectionPoint).sub(this.dragModel.position);
                    
                    // Set up drag plane (horizontal plane at model's Y position)
                    this.dragPlane.setFromNormalAndCoplanarPoint(
                        new THREE.Vector3(0, 1, 0), // Normal pointing up
                        this.dragModel.position
                    );
                    
                    console.log(`Started dragging model: ${modelData.name}`);
                }
            }
        }
    }
    
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        if (this.isDragging && this.dragModel) {
            // Cast ray from camera through mouse position
            this.raycaster.setFromCamera(this.mousePosition, this.camera);
            
            // Find intersection with drag plane
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
                // Update model position, accounting for the drag offset
                const newPosition = this.dragIntersection.clone().sub(this.dragOffset);
                this.dragModel.position.x = newPosition.x;
                this.dragModel.position.z = newPosition.z;
                // Keep the Y position unchanged to prevent vertical movement
            }
            
            // Update cursor while dragging
            this.renderer.domElement.classList.add('dragging-cursor');
            this.renderer.domElement.classList.remove('grabbable-cursor');
        } else {
            // Check if mouse is hovering over a draggable model
            this.updateHoverCursor(event);
        }
    }
    
    updateHoverCursor(event) {
        // Only check for hover if we have models and aren't dragging
        if (!this.modelManager.currentModel || this.isDragging || this.modelManager.loadedModels.length === 0) return;
        
        // Check if mouse is over control panel area
        const controlsElement = document.querySelector('.controls');
        if (controlsElement) {
            const rect = controlsElement.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right &&
                event.clientY >= rect.top && event.clientY <= rect.bottom) {
                this.renderer.domElement.classList.remove('grabbable-cursor');
                return;
            }
        }
        
        // Cast ray from camera through mouse position
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        
        // Check for intersections with all loaded models
        const allObjects = [];
        this.modelManager.loadedModels.forEach(modelData => {
            if (modelData.visible && modelData.model) {
                this.modelManager.getAllMeshes(modelData.model, allObjects);
            }
        });
        
        if (allObjects.length === 0) {
            this.renderer.domElement.classList.remove('grabbable-cursor');
            return;
        }
        
        const intersects = this.raycaster.intersectObjects(allObjects, false);
        
        if (intersects.length > 0) {
            // Mouse is over a model - show grab cursor
            this.renderer.domElement.classList.add('grabbable-cursor');
            this.renderer.domElement.classList.remove('dragging-cursor');
        } else {
            // Mouse is not over a model - remove grab cursor
            this.renderer.domElement.classList.remove('grabbable-cursor');
            this.renderer.domElement.classList.remove('dragging-cursor');
        }
    }
    
    onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragModel = null;
            
            if (this.controls) {
                this.controls.enabled = true; // Re-enable orbit controls
            }
            
            // Reset cursor
            this.renderer.domElement.classList.remove('dragging-cursor');
            this.renderer.domElement.classList.remove('grabbable-cursor');
            
            console.log('Stopped dragging model');
        }
    }
    
    onKeyDown(event) {
        // Only handle keyboard shortcuts if not typing in an input field
        if (event.target.tagName.toLowerCase() === 'input') return;
        
        switch(event.key) {
            case 'Tab':
                event.preventDefault();
                // Switch to next model
                if (this.modelManager.loadedModels.length > 1) {
                    const nextIndex = (this.modelManager.activeModelIndex + 1) % this.modelManager.loadedModels.length;
                    this.modelManager.selectModel(nextIndex);
                    this.dispatchModelSelectionEvent(nextIndex);
                }
                break;
                
            case 'Escape':
                // Stop any current dragging
                if (this.isDragging) {
                    this.isDragging = false;
                    this.dragModel = null;
                    this.controls.enabled = true;
                    this.renderer.domElement.classList.remove('dragging-cursor');
                    this.renderer.domElement.classList.remove('grabbable-cursor');
                }
                // Also stop movement
                this.modelManager.stopMovement();
                break;
                
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                // Select model by number (1-9)
                const modelIndex = parseInt(event.key) - 1;
                if (modelIndex >= 0 && modelIndex < this.modelManager.loadedModels.length) {
                    this.modelManager.selectModel(modelIndex);
                    this.dispatchModelSelectionEvent(modelIndex);
                }
                break;
                
            case 'l':
            case 'L':
                // Toggle light sphere visibility (dispatch event)
                this.dispatchLightToggleEvent();
                break;
        }
    }
    
    updateMousePosition(event) {
        // Calculate normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    // Event dispatching for communication with other modules
    dispatchModelSelectionEvent(modelIndex) {
        const event = new CustomEvent('modelSelected', { 
            detail: { modelIndex, modelData: this.modelManager.loadedModels[modelIndex] } 
        });
        document.dispatchEvent(event);
    }
    
    dispatchLightToggleEvent() {
        const event = new CustomEvent('lightToggleRequested');
        document.dispatchEvent(event);
    }
    
    // Cleanup method
    destroy() {
        this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
        this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
        document.removeEventListener('keydown', this.onKeyDown);
    }
}
