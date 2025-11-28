import './style.css';

// Configuration
const BOARD_SIZE = 3; // 3x3
const TILE_SIZE = 150; // px

// Use a placeholder image for demonstration. 
// User can replace this with a local asset.
// To use a local image:
// 1. Place your image in src/assets/image.jpg
// 2. Uncomment the import line below
// 3. Use the imported variable
// import localImage from './assets/image.jpg';
// src/main.js
import myImage from './assets/photo.jpg'; // Add this line

// Update this line
const IMAGE_URL = myImage;
const boardEl = document.getElementById('board');
const modalEl = document.getElementById('congrats-modal');
const restartBtn = document.getElementById('restart-btn');

let tiles = [];

function initGame() {
    // Clear existing
    boardEl.innerHTML = '';
    modalEl.classList.add('hidden');
    tiles = [];

    // Create drop zones
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const zone = document.createElement('div');
        zone.classList.add('drop-zone');
        zone.dataset.index = i;

        // Allow drop
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);

        boardEl.appendChild(zone);
    }

    // Create tiles
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.draggable = true;
        tile.id = `tile-${i}`;
        tile.dataset.correctIndex = i;

        // Set background
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        // Use localImage if you imported it, otherwise IMAGE_URL
        tile.style.backgroundImage = `url(${IMAGE_URL})`;
        tile.style.backgroundPosition = `-${col * TILE_SIZE}px -${row * TILE_SIZE}px`;

        // Drag events
        tile.addEventListener('dragstart', handleDragStart);
        tile.addEventListener('dragend', handleDragEnd);

        tiles.push(tile);
    }

    // Shuffle and place in board zones
    const shuffledTiles = [...tiles].sort(() => Math.random() - 0.5);
    const zones = document.querySelectorAll('.drop-zone');
    shuffledTiles.forEach((tile, index) => {
        zones[index].appendChild(tile);
    });
}

let draggedTile = null;

function handleDragStart(e) {
    draggedTile = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedTile = null;
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
}
function handleDrop(e) {
    e.preventDefault();
    // Find the closest drop zone
    const zone = e.target.closest('.drop-zone');

    if (zone && draggedTile) {
        // Check if zone already has a tile
        const existingTile = zone.querySelector('.tile');

        if (existingTile) {
            // Swap: Move existing tile to where dragged tile came from
            const draggedParent = draggedTile.parentNode;
            draggedParent.appendChild(existingTile);
            zone.appendChild(draggedTile);
        } else {
            zone.appendChild(draggedTile);
        }

        checkWin();
    }
}


function checkWin() {
    const zones = document.querySelectorAll('.drop-zone');
    let correctCount = 0;

    zones.forEach(zone => {
        const tile = zone.querySelector('.tile');
        if (tile) {
            const zoneIndex = parseInt(zone.dataset.index);
            const tileIndex = parseInt(tile.dataset.correctIndex);
            if (zoneIndex === tileIndex) {
                correctCount++;
            }
        }
    });

    if (correctCount === BOARD_SIZE * BOARD_SIZE) {
        setTimeout(() => {
            modalEl.classList.remove('hidden');
        }, 200);
    }
}

restartBtn.addEventListener('click', initGame);

// Start
initGame();
