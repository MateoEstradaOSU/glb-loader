// Utility functions for text sprites, node discovery, and helper functions
import * as THREE from "three";

export class UtilsManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        
        // Remove pointer sprite logic
        // this.nodePointerSprite = null;

        // Track selected node and its original material(s)
        this.selectedNode = null;
        this.originalMaterials = null;
        
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
                
                // Add click handler to highlight the node in red
                nodeDiv.addEventListener('click', () => {
                    console.log('Selected node:', node.name, node.object);
                    this.highlightNode(node.object);
                    // Highlight the clicked item in the list
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

    // Highlight the selected node in red, restore previous
    highlightNode(nodeObject) {
        // Restore previous node's material if any
        if (this.selectedNode && this.originalMaterials) {
            if (this.selectedNode.material && this.originalMaterials) {
                if (Array.isArray(this.selectedNode.material)) {
                    this.selectedNode.material.forEach((mat, i) => {
                        if (this.originalMaterials[i]) {
                            this.selectedNode.material[i].color.copy(this.originalMaterials[i].color);
                            if (this.originalMaterials[i].emissive) {
                                this.selectedNode.material[i].emissive.copy(this.originalMaterials[i].emissive);
                            }
                        }
                    });
                } else {
                    this.selectedNode.material.color.copy(this.originalMaterials.color);
                    if (this.originalMaterials.emissive) {
                        this.selectedNode.material.emissive.copy(this.originalMaterials.emissive);
                    }
                }
            }
        }
        // Store new selected node and its original material(s)
        this.selectedNode = nodeObject;
        if (nodeObject.material) {
            if (Array.isArray(nodeObject.material)) {
                this.originalMaterials = nodeObject.material.map(mat => ({
                    color: mat.color.clone(),
                    emissive: mat.emissive ? mat.emissive.clone() : null
                }));
                nodeObject.material.forEach(mat => {
                    mat.color.set(0xff0000); // Red
                    if (mat.emissive) mat.emissive.set(0x550000);
                });
            } else {
                this.originalMaterials = {
                    color: nodeObject.material.color.clone(),
                    emissive: nodeObject.material.emissive ? nodeObject.material.emissive.clone() : null
                };
                nodeObject.material.color.set(0xff0000); // Red
                if (nodeObject.material.emissive) nodeObject.material.emissive.set(0x550000);
            }
        }
    }
    
    // Window resize handler
    onWindowResize() {
        // This can be called from main.js if needed
        this.sceneManager.onWindowResize();
    }
}
