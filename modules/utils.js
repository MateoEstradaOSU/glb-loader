// Utility functions for text sprites, node discovery, and helper functions
import * as THREE from "three";

export class UtilsManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        
        this.nodePointerSprite = null;
        
        this.init();
    }
    
    init() {
        this.setupCustomEventListeners();
    }
    
    setupCustomEventListeners() {
        // Listen for node discovery requests
        document.addEventListener('nodeDiscoveryRequested', (event) => {
            this.discoverNodes(event.detail.model);
        });
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
    
    createPointerSprite() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        // Draw an arrow pointing to the right
        context.fillStyle = '#ff0000';
        context.beginPath();
        context.moveTo(10, 32);
        context.lineTo(40, 20);
        context.lineTo(40, 26);
        context.lineTo(54, 26);
        context.lineTo(54, 38);
        context.lineTo(40, 38);
        context.lineTo(40, 44);
        context.closePath();
        context.fill();
        
        // Add a border
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.stroke();
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1, 1, 1);
        
        return sprite;
    }
    
    pointToNode(nodeObject) {
        // Remove existing pointer if it exists
        if (this.nodePointerSprite) {
            this.scene.remove(this.nodePointerSprite);
        }
        
        // Create new pointer sprite
        this.nodePointerSprite = this.createPointerSprite();
        
        // Get the world position of the node
        const worldPosition = new THREE.Vector3();
        nodeObject.getWorldPosition(worldPosition);
        
        // Position the sprite slightly offset from the node
        this.nodePointerSprite.position.copy(worldPosition);
        this.nodePointerSprite.position.x += 2; // Offset to the right
        this.nodePointerSprite.position.y += 1; // Offset upward
        
        // Add to scene
        this.scene.add(this.nodePointerSprite);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (this.nodePointerSprite) {
                this.scene.remove(this.nodePointerSprite);
                this.nodePointerSprite = null;
            }
        }, 5000);
    }
    
    discoverNodes(model) {
        const nodeList = document.getElementById('node-list');
        const nodesContent = document.getElementById('nodes-content');
        
        if (!nodeList || !nodesContent) return;
        
        const nodes = [];
        
        // Recursively traverse the model to find all named nodes
        const traverse = (object, depth = 0) => {
            if (object.name && object.name.trim() !== '') {
                const nodeType = object.type || 'Object3D';
                
                nodes.push({
                    name: object.name,
                    type: nodeType,
                    object: object,
                    depth: depth,
                    hasGeometry: !!object.geometry,
                    hasMaterial: !!object.material,
                    children: object.children.length
                });
            }
            
            // Recursively check children
            object.children.forEach(child => traverse(child, depth + 1));
        };
        
        traverse(model);
        
        // Display the nodes
        if (nodes.length > 0) {
            nodesContent.innerHTML = '';
            nodes.forEach(node => {
                const indent = '  '.repeat(node.depth);
                const nodeDiv = document.createElement('div');
                nodeDiv.style.fontFamily = 'monospace';
                nodeDiv.style.fontSize = '12px';
                nodeDiv.style.marginBottom = '2px';
                nodeDiv.style.cursor = 'pointer';
                nodeDiv.style.padding = '2px';
                nodeDiv.style.borderRadius = '3px';
                
                const info = `${indent}${node.name} (${node.type})`;
                const details = [];
                if (node.hasGeometry) details.push('geo');
                if (node.hasMaterial) details.push('mat');
                if (node.children > 0) details.push(`${node.children} children`);
                
                nodeDiv.innerHTML = `${info} ${details.length > 0 ? `[${details.join(', ')}]` : ''}`;
                
                // Add click handler to highlight the node
                nodeDiv.addEventListener('click', () => {
                    console.log('Selected node:', node.name, node.object);
                    
                    // Create pointer sprite pointing to the node
                    this.pointToNode(node.object);
                    
                    // Highlight the clicked item
                    nodeDiv.style.backgroundColor = '#ffff99';
                    setTimeout(() => {
                        nodeDiv.style.backgroundColor = '';
                    }, 1000);
                });
                
                nodeDiv.addEventListener('mouseenter', () => {
                    nodeDiv.style.backgroundColor = '#e0e0e0';
                });
                
                nodeDiv.addEventListener('mouseleave', () => {
                    nodeDiv.style.backgroundColor = '';
                });
                
                nodesContent.appendChild(nodeDiv);
            });
            
            nodeList.style.display = 'block';
            console.log('Discovered nodes:', nodes);
        } else {
            nodeList.style.display = 'none';
            console.log('No named nodes found in the model');
        }
    }
    
    // Window resize handler
    onWindowResize() {
        // This can be called from main.js if needed
        this.sceneManager.onWindowResize();
    }
}
