// Get DOM elements
const formulaSelect = document.getElementById('formulaSelect');
const maxIterationsInput = document.getElementById('maxIterations');
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, false);
canvas.addEventListener('touchcancel', handleTouchEnd, false);

let lastTouchEnd = 0;
let touchStartDistance = null;
let initialPinchMidpoint = null;
let isPanning = false;
let lastPanPosition = null;

function handleTouchStart(event) {
    if (event.touches.length === 1) {
        // Single touch: Start panning
        isPanning = true;
        lastPanPosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    } else if (event.touches.length === 2) {
        // Two fingers: Start zooming
        isPanning = false;
        touchStartDistance = getDistanceBetweenTouches(event.touches);
        initialPinchMidpoint = getMidpointBetweenTouches(event.touches);
    }
}

function handleTouchEnd(event) {
    if (event.touches.length === 0) {
        // Reset states
        isPanning = false;
        touchStartDistance = null;
        initialPinchMidpoint = null;
        lastPanPosition = null;
    }
}

function getDistanceBetweenTouches(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getMidpointBetweenTouches(touches) {
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
}


function panFractal(deltaX, deltaY) {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const deltaXComplex = (deltaX / canvas.width) * xRange;
    const deltaYComplex = (deltaY / canvas.height) * yRange;
    xMin -= deltaXComplex;
    xMax -= deltaXComplex;
    yMin += deltaYComplex; // Note: y-axis is inverted in canvas
    yMax += deltaYComplex;
    renderFractal();
}

function pinchZoom(scale, midpoint) {
    const mousePos = {
        x: midpoint.x - canvas.offsetLeft,
        y: midpoint.y - canvas.offsetTop
    };
    const center = mapToComplex(mousePos.x, mousePos.y);

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const newXRange = xRange / scale;
    const newYRange = yRange / scale;

    xMin = center.real - (mousePos.x / canvas.width) * newXRange;
    xMax = xMin + newXRange;
    yMin = center.imag - ((canvas.height - mousePos.y) / canvas.height) * newYRange;
    yMax = yMin + newYRange;

    renderFractal();
}


let isRendering = false;

function handleTouchMove(event) {
    event.preventDefault();
    if (!isRendering) {
        isRendering = true;
        requestAnimationFrame(() => {
            event.preventDefault(); // Prevent default scrolling behavior
            if (event.touches.length === 1 && isPanning) {
                // Pan
                const currentPanPosition = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
                const deltaX = currentPanPosition.x - lastPanPosition.x;
                const deltaY = currentPanPosition.y - lastPanPosition.y;
                panFractal(deltaX, deltaY);
                lastPanPosition = currentPanPosition;
            } else if (event.touches.length === 2) {
                // Pinch Zoom
                const currentDistance = getDistanceBetweenTouches(event.touches);
                const scale = currentDistance / touchStartDistance;
                const currentMidpoint = getMidpointBetweenTouches(event.touches);
                pinchZoom(scale, currentMidpoint);
                touchStartDistance = currentDistance;
                initialPinchMidpoint = currentMidpoint;
            }

            isRendering = false;
        });
    }
}


// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initial fractal boundaries
const INITIAL_X_MIN = -2;
const INITIAL_X_MAX = 1;
const INITIAL_Y_MIN = -1.5;
const INITIAL_Y_MAX = 1.5;

// Add these constants at the top of the file
const MIN_ZOOM_FACTOR = 1e-14;
const MAX_ZOOM_FACTOR = 1e14;

// Set initial boundaries
let xMin = INITIAL_X_MIN;
let xMax = INITIAL_X_MAX;
let yMin = INITIAL_Y_MIN;
let yMax = INITIAL_Y_MAX;

// Fractal parameters
let maxIterations = 100;

// Julia set parameters (you can adjust these for different Julia set variations)
const JULIA_CONSTANT = { real: -0.7, imag: 0.27015 };

// Selection variables
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };

// Map canvas coordinates to complex plane
function mapToComplex(x, y) {
    const real = xMin + (x / canvas.width) * (xMax - xMin);
    const imag = yMin + (y / canvas.height) * (yMax - yMin);
    return { real, imag };
}

// Mandelbrot set formula
function mandelbrot(c) {
    let z = { real: 0, imag: 0 };
    for (let i = 0; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + c.real;
        const imag = 2 * z.real * z.imag + c.imag;
        z = { real, imag };
        if (z.real * z.real + z.imag * z.imag > 4) {
            return i;
        }
    }
    return maxIterations;
}

// Julia set formula
function julia(z, precision) {
    for (let i = 0; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + JULIA_CONSTANT.real;
        const imag = 2 * z.real * z.imag + JULIA_CONSTANT.imag;
        z = { real, imag };
        if (z.real * z.real + z.imag * z.imag > 4) {
            return i;
        }
        if (Math.abs(z.real - JULIA_CONSTANT.real) < precision && Math.abs(z.imag - JULIA_CONSTANT.imag) < precision) {
            return maxIterations;
        }
    }
    return maxIterations;
}

// Burning Ship fractal formula
function burningShip(c, precision) {
    let z = { real: c.real, imag: c.imag };
    for (let i = 0; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + c.real;
        const imag = 2 * Math.abs(z.real * z.imag) + c.imag;
        z = { real: Math.abs(real), imag: Math.abs(imag) };
        if (z.real * z.real + z.imag * z.imag > 4) {

            return i;
        }
        if (Math.abs(z.real - c.real) < precision && Math.abs(z.imag - c.imag) < precision) {
            return maxIterations;
        }
    }

    return maxIterations;
}

// Add this new function for color mapping
function getColor(iterations, maxIterations) {
    if (iterations === maxIterations) {
        return [0, 0, 0]; // Black for points inside the set
    }

    const hue = 360 * iterations / maxIterations;
    const saturation = 100;
    const lightness = 50;

    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = lightness / 100 - c / 2;

    let r, g, b;
    if (hue < 60) {
        [r, g, b] = [c, x, 0];
    } else if (hue < 120) {
        [r, g, b] = [x, c, 0];
    } else if (hue < 180) {
        [r, g, b] = [0, c, x];
    } else if (hue < 240) {
        [r, g, b] = [0, x, c];
    } else if (hue < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}

// Modify the renderFractal function to use the new getColor function and support Julia set and Burning Ship
// function renderFractal() {
//     const imageData = ctx.createImageData(canvas.width, canvas.height);
//     const data = imageData.data;
//     const selectedFormula = formulaSelect.value;
//     const precision = calculatePrecision();


//     for (let x = 0; x < canvas.width; x++) {
//         for (let y = 0; y < canvas.height; y++) {
//             const c = mapToComplex(x, y);
//             let iterations;

//             if (selectedFormula === 'mandelbrot') {
//                 iterations = mandelbrot(c, precision);
//             } else if (selectedFormula === 'julia') {
//                 iterations = julia(c, precision);
//             } else if (selectedFormula === 'burningShip') {
//                 iterations = burningShip(c, precision);
//             }



//             const index = (y * canvas.width + x) * 4;
//             const [r, g, b] = getColor(iterations, maxIterations);
//             data[index] = r;
//             data[index + 1] = g;
//             data[index + 2] = b;
//             data[index + 3] = 255; // Alpha channel
//         }
//     }

//     ctx.putImageData(imageData, 0, 0);
// }

// Selection variables
// var isSelecting = false;
// var selectionStart = { x: 0, y: 0 };
// var selectionEnd = { x: 0, y: 0 };

let worker;

// Map canvas coordinates to complex plane
function mapToComplex(x, y) {
    const real = xMin + (x / canvas.width) * (xMax - xMin);
    const imag = yMin + (y / canvas.height) * (yMax - yMin);
    return { real, imag };
}

// Implement renderFractal with progressive rendering
function renderFractal() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    if (worker) {
        worker.terminate();
    }

    worker = new Worker('fractalWorker.js');

    worker.onmessage = function (event) {
        const { startX, startY, imageData, scale } = event.data;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = imageData.width;
        offCanvas.height = imageData.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.putImageData(imageData, 0, 0);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            offCanvas,
            0,
            0,
            offCanvas.width,
            offCanvas.height,
            startX * scale,
            startY * scale,
            offCanvas.width * scale,
            offCanvas.height * scale
        );

        if (event.data.isComplete) {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    };

    const scales = [4, 2, 1];

    scales.forEach(scale => {
        const message = {
            width: Math.ceil(canvas.width / scale),
            height: Math.ceil(canvas.height / scale),
            xMin,
            xMax,
            yMin,
            yMax,
            maxIterations,
            selectedFormula: formulaSelect.value,
            tileSize: 64,
            scale
        };

        worker.postMessage(message);
    });
}

// Add this function to calculate precision based on zoom level
function calculatePrecision() {
    const width = xMax - xMin;
    return Math.max(1e-15, width / canvas.width);
}

// Add this function after the existing mapToComplex function
function calculateNewBoundaries(start, end) {
    const startComplex = mapToComplex(start.x, start.y);
    const endComplex = mapToComplex(end.x, end.y);

    const newXMin = Math.min(startComplex.real, endComplex.real);
    const newXMax = Math.max(startComplex.real, endComplex.real);
    const newYMin = Math.min(startComplex.imag, endComplex.imag);
    const newYMax = Math.max(startComplex.imag, endComplex.imag);

    xMin = newXMin;
    xMax = newXMax;
    yMin = newYMin;
    yMax = newYMax;
}

function drawSelectionRectangle() {
    if (isSelecting) {
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([6]);

        const width = selectionEnd.x - selectionStart.x;
        const height = selectionEnd.y - selectionStart.y;

        ctx.strokeRect(selectionStart.x, selectionStart.y, width, height);
        ctx.restore();
    }
}

function resetZoom() {
    xMin = INITIAL_X_MIN;
    xMax = INITIAL_X_MAX;
    yMin = INITIAL_Y_MIN;
    yMax = INITIAL_Y_MAX;
    renderFractal();
}

// Get zoom buttons
const zoomInButton = document.getElementById('zoomIn');
const zoomOutButton = document.getElementById('zoomOut');

// Add event listeners for zoom buttons
zoomInButton.addEventListener('click', () => {
    zoom(0.5);
});

zoomOutButton.addEventListener('click', () => {
    zoom(2);
});

// Replace the existing zoom function with this updated version
function zoom(factor) {
    const centerX = (xMin + xMax) / 2;
    const centerY = (yMin + yMax) / 2;
    const currentWidth = xMax - xMin;
    const currentHeight = yMax - yMin;

    // Calculate new width and height
    let newWidth = currentWidth * factor;
    let newHeight = currentHeight * factor;

    // Check if we're zooming out beyond initial boundaries
    if (factor > 1) {
        const initialWidth = INITIAL_X_MAX - INITIAL_X_MIN;
        const initialHeight = INITIAL_Y_MAX - INITIAL_Y_MIN;
        newWidth = Math.min(newWidth, initialWidth);
        newHeight = Math.min(newHeight, initialHeight);
    }

    // Ensure we don't zoom in or out too far
    const zoomFactor = currentWidth / newWidth;
    if (zoomFactor < MIN_ZOOM_FACTOR || zoomFactor > MAX_ZOOM_FACTOR) {
        return;
    }

    // Update boundaries
    xMin = centerX - newWidth / 2;
    xMax = centerX + newWidth / 2;
    yMin = centerY - newHeight / 2;
    yMax = centerY + newHeight / 2;



    // Redraw fractal
    renderFractal();
}

// Event listeners
formulaSelect.addEventListener('change', (event) => {
    renderFractal(); // Re-render the fractal when the formula changes
});

maxIterationsInput.addEventListener('input', (event) => {
    const newMaxIterations = parseInt(event.target.value);
    if (!isNaN(newMaxIterations) && newMaxIterations > 0) {
        maxIterations = newMaxIterations;
        renderFractal();
    } else {
        console.error('Invalid max iterations value', event.target.value);
    }
});

canvas.addEventListener('mousedown', (event) => {
    isSelecting = true;
    selectionStart = {
        x: event.clientX - canvas.offsetLeft,
        y: event.clientY - canvas.offsetTop
    };
});

canvas.addEventListener('mousemove', (event) => {
    if (isSelecting) {
        selectionEnd = {
            x: event.clientX - canvas.offsetLeft,
            y: event.clientY - canvas.offsetTop
        };
        renderFractal(); // Re-render the fractal
        drawSelectionRectangle(); // Draw the selection rectangle
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (isSelecting) {
        isSelecting = false;
        selectionEnd = {
            x: event.clientX - canvas.offsetLeft,
            y: event.clientY - canvas.offsetTop
        };

        // Check if the selection has a non-zero area
        if (selectionStart.x !== selectionEnd.x && selectionStart.y !== selectionEnd.y) {
            calculateNewBoundaries(selectionStart, selectionEnd);
            renderFractal();
        } else {
            renderFractal(); // Re-render to clear the selection rectangle
        }
    }
});

document.getElementById('resetZoom').addEventListener('click', () => {
    resetZoom();
});



// Initial render
renderFractal();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFractal();
});