// Main application file - coordinates between all modules
import { SceneManager } from './modules/scene.js';
import { LightingManager } from './modules/lighting.js';
import { ModelManager } from './modules/models.js';
import { InteractionManager } from './modules/interaction.js';
import { UIManager } from './modules/ui.js';
import { UtilsManager } from './modules/utils.js';

// Initialize all managers
const sceneManager = new SceneManager();
const lightingManager = new LightingManager(sceneManager);
const modelManager = new ModelManager(sceneManager);
const interactionManager = new InteractionManager(sceneManager, modelManager);
const uiManager = new UIManager(modelManager, lightingManager);
const utilsManager = new UtilsManager(sceneManager);

// Expose sceneManager globally for UI access to setGroundTexture
window.sceneManager = sceneManager;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update model movement (handled by ModelManager)
    modelManager.updateMovement();
    
    // Render the scene
    sceneManager.render();
}

// Window resize handler
function onWindowResize() {
    sceneManager.onWindowResize();
}

// Set up window resize listener
window.addEventListener('resize', onWindowResize, false);

// Load initial model
async function loadInitialModel() {
    try {
        const modelData = await modelManager.loadModel("assets/dozer/scene.gltf");
        uiManager.updateModelList();
        
        // Trigger node discovery for the initial model
        const event = new CustomEvent('nodeDiscoveryRequested', { 
            detail: { model: modelData.model } 
        });
        document.dispatchEvent(event);
        
        console.log('Initial model loaded successfully');
    } catch (error) {
        console.error('Failed to load initial model:', error);
    }
}

// Initialize the application
function init() {
    console.log('Three.js GLB Loader - Modular Version Initialized');
    console.log('Managers loaded:', {
        scene: !!sceneManager,
        lighting: !!lightingManager,
        models: !!modelManager,
        interaction: !!interactionManager,
        ui: !!uiManager,
        utils: !!utilsManager
    });
    
    // Start the animation loop
    animate();
    
    // Load the initial model
    loadInitialModel();
}

// Start the application
init();
