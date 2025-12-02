import './debug.css';
import './solved.css';
import './style.css';

// Configuration
const BOARD_SIZE = 3; // 3x3

// Load all photo_*.jpg files from assets
const imageModules = import.meta.glob('./assets/photo_*.jpg', { eager: true, query: '?url', import: 'default' });

// If no photo_*.jpg found, check for just photo.jpg as a fallback for level 1
// Note: import.meta.glob returns an object with paths as keys.
let levelImages = Object.keys(imageModules)
    .filter(path => path.match(/photo_\d+\.jpg$/)) // Only include numbered photos (excludes photo_final.jpg)
    .sort((a, b) => {
        // Extract number from filename to sort correctly (photo_1, photo_2, photo_10)
        const numA = parseInt(a.match(/photo_(\d+)\.jpg$/)?.[1] || 0);
        const numB = parseInt(b.match(/photo_(\d+)\.jpg$/)?.[1] || 0);
        return numA - numB;
    })
    .map(path => imageModules[path]);

// Fallback if no numbered photos found, try to see if we have any images at all or use placeholder
if (levelImages.length === 0) {
    // We can't easily check for 'photo.jpg' dynamically without globbing it too.
    // Let's assume the user might have 'photo.jpg' and we want to use it as level 1.
    const fallbackModules = import.meta.glob('./assets/photo.jpg', { eager: true, query: '?url', import: 'default' });
    if (Object.keys(fallbackModules).length > 0) {
        levelImages = Object.values(fallbackModules);
    } else {
        // Absolute fallback
        levelImages = ['https://picsum.photos/450/450'];
    }
}

let currentLevel = 0;

const boardEl = document.getElementById('board');
const modalEl = document.getElementById('congrats-modal');
const modalTitleEl = document.getElementById('modal-title');
const modalMessageEl = document.getElementById('modal-message');
const closeModalBtn = document.getElementById('close-modal-btn');
const continueBtn = document.getElementById('continue-btn');
const controlsContainerEl = document.getElementById('controls-container');
const levelIndicatorEl = document.getElementById('level-indicator');

let tiles = [];
let activeTouchTile = null;

function initGame() {
    // Update Level Indicator
    levelIndicatorEl.textContent = `Container ${currentLevel + 1}/${levelImages.length}`;

    // Clear existing
    boardEl.innerHTML = '';
    boardEl.classList.remove('solved');
    modalEl.classList.add('hidden');
    controlsContainerEl.classList.add('hidden');
    tiles = [];

    const currentImageUrl = levelImages[currentLevel];

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

        tile.style.backgroundImage = `url(${currentImageUrl})`;
        tile.style.backgroundPosition = `${col * 50}% ${row * 50}%`;

        // Drag events
        tile.addEventListener('dragstart', handleDragStart);
        tile.addEventListener('dragend', handleDragEnd);
        tile.addEventListener('touchstart', handleTouchStart, { passive: false });
        tile.addEventListener('touchmove', handleTouchMove, { passive: false });
        tile.addEventListener('touchend', handleTouchEnd);
        tile.addEventListener('touchcancel', handleTouchCancel);

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
        placeTileInZone(draggedTile, zone);
    }
}

function placeTileInZone(tile, zone) {
    if (!tile || !zone) return;

    const existingTile = zone.querySelector('.tile');
    const origin = tile.parentNode;

    if (existingTile && origin) {
        origin.appendChild(existingTile);
    }

    zone.appendChild(tile);
    checkWin();
}

function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    activeTouchTile = e.currentTarget;
    activeTouchTile.classList.add('dragging');
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!activeTouchTile) return;
    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!activeTouchTile) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = target?.closest?.('.drop-zone');

    activeTouchTile.classList.remove('dragging');

    if (zone) {
        placeTileInZone(activeTouchTile, zone);
    }

    activeTouchTile = null;
}

function handleTouchCancel() {
    if (!activeTouchTile) return;
    activeTouchTile.classList.remove('dragging');
    activeTouchTile = null;
}

function checkWin() {
    const zones = document.querySelectorAll('.drop-zone');
    let correctCount = 0;

    console.group('Check Win Status');
    zones.forEach(zone => {
        const tile = zone.querySelector('.tile');
        if (tile) {
            const zoneIndex = parseInt(zone.dataset.index);
            const tileIndex = parseInt(tile.dataset.correctIndex);
            const isCorrect = zoneIndex === tileIndex;

            if (isCorrect) {
                correctCount++;
            } else {
                console.log(`Mismatch: Zone ${zoneIndex} has Tile ${tileIndex}`);
            }
        } else {
            console.log(`Empty Zone: ${zone.dataset.index}`);
        }
    });
    console.groupEnd();

    console.log(`Correct tiles: ${correctCount}/${BOARD_SIZE * BOARD_SIZE}`);

    if (correctCount === BOARD_SIZE * BOARD_SIZE) {
        console.log('Puzzle Solved! Triggering modal...');
        setTimeout(() => {
            showWinModal();
        }, 200);
    }
}

// Debug helper
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'd') {
        document.body.classList.toggle('debug-mode');
        console.log('Debug mode toggled');
    }
});

function showWinModal() {
    console.log('showWinModal executing...');
    if (!modalEl) {
        console.error('Modal element missing!');
        return;
    }

    // Show modal
    modalEl.classList.remove('hidden');

    // Mark board as solved
    boardEl.classList.add('solved');

    // Configure Close button
    closeModalBtn.onclick = () => {
        modalEl.classList.add('hidden');
    };

    // Show controls container
    controlsContainerEl.classList.remove('hidden');

    if (currentLevel < levelImages.length - 1) {
        // Intermediate level
        modalTitleEl.textContent = 'Access Granted';
        modalMessageEl.textContent = `Correct key hash entered. Container ${currentLevel + 1}/${levelImages.length} has been unlocked.`;

        continueBtn.textContent = 'Proceed to Next Container';
        continueBtn.onclick = () => {
            currentLevel++;
            initGame();
        };
    } else {
        // Final level
        modalTitleEl.textContent = 'Decryption Successful';
        modalMessageEl.textContent = 'All containers unlocked. Data retrieved.';

        continueBtn.textContent = 'Open Decrypted Container';
        continueBtn.onclick = () => {
            showFinalReward();
        };
    }
}

function showFinalReward() {
    // Hide modal and controls
    modalEl.classList.add('hidden');
    controlsContainerEl.classList.add('hidden');

    // Clear board and show final image
    boardEl.innerHTML = '';
    boardEl.style.display = 'flex';
    boardEl.style.justifyContent = 'center';
    boardEl.style.alignItems = 'center';
    boardEl.style.background = 'none';
    boardEl.style.border = 'none';
    boardEl.style.boxShadow = 'none';

    // Try to load photo_final.jpg, fallback to placeholder
    const finalImageModules = import.meta.glob('./assets/photo_final.jpg', { eager: true, query: '?url', import: 'default' });
    let finalImageUrl = 'https://picsum.photos/450/450';

    if (Object.keys(finalImageModules).length > 0) {
        finalImageUrl = Object.values(finalImageModules)[0];
    }

    const img = document.createElement('img');
    img.src = finalImageUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';

    boardEl.appendChild(img);

    // Update title
    levelIndicatorEl.textContent = 'Go get me, Maarten!';
    levelIndicatorEl.style.color = '#FFD700';
    levelIndicatorEl.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
}

// Start
initGame();
