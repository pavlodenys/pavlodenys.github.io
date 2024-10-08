// Get DOM elements
const formulaSelect = document.getElementById('formulaSelect');
const maxIterationsInput = document.getElementById('maxIterations');
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

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
function mandelbrot(c, precision) {
    let z = { real: 0, imag: 0 };
    for (let i = 0; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + c.real;
        const imag = 2 * z.real * z.imag + c.imag;
        z = { real, imag };
        if (z.real * z.real + z.imag * z.imag > 4) {
            return i;
        }
        if (Math.abs(z.real - c.real) < precision && Math.abs(z.imag - c.imag) < precision) {
            return maxIterations;
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

// Modify the renderFractal function to use the new getColor function and support Julia set
function renderFractal() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    const selectedFormula = formulaSelect.value;
    const precision = calculatePrecision();

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const c = mapToComplex(x, y);
            let iterations;

            if (selectedFormula === 'mandelbrot') {
                iterations = mandelbrot(c, precision);
            } else if (selectedFormula === 'julia') {
                iterations = julia(c, precision);
            }

            const index = (y * canvas.width + x) * 4;
            const [r, g, b] = getColor(iterations, maxIterations);
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255; // Alpha channel
        }
    }

    ctx.putImageData(imageData, 0, 0);
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

    console.log('New boundaries:', { xMin, xMax, yMin, yMax });
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
    console.log('Zoom reset to initial boundaries');
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
        console.log('Zoom limit reached');
        return;
    }

    // Update boundaries
    xMin = centerX - newWidth / 2;
    xMax = centerX + newWidth / 2;
    yMin = centerY - newHeight / 2;
    yMax = centerY + newHeight / 2;

    console.log(`Zoomed ${factor < 1 ? 'in' : 'out'}: new boundaries set`, { xMin, xMax, yMin, yMax });

    // Redraw fractal
    renderFractal();
}

// Event listeners
formulaSelect.addEventListener('change', (event) => {
    console.log('Selected formula:', event.target.value);
    renderFractal(); // Re-render the fractal when the formula changes
});

maxIterationsInput.addEventListener('input', (event) => {
    const newMaxIterations = parseInt(event.target.value);
    if (!isNaN(newMaxIterations) && newMaxIterations > 0) {
        console.log('Max iterations updated:', newMaxIterations);
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
    console.log('Selection started at:', selectionStart);
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
        console.log('Selection ended at:', selectionEnd);

        // Check if the selection has a non-zero area
        if (selectionStart.x !== selectionEnd.x && selectionStart.y !== selectionEnd.y) {
            calculateNewBoundaries(selectionStart, selectionEnd);
            renderFractal();
        } else {
            console.log('Zero-area selection, ignoring');
            renderFractal(); // Re-render to clear the selection rectangle
        }
    }
});

document.getElementById('resetZoom').addEventListener('click', () => {
    console.log('Resetting zoom');
    resetZoom();
});

// Initial log of values
console.log('Initial formula:', formulaSelect.value);
console.log('Initial max iterations:', maxIterationsInput.value);

// Initial render
renderFractal();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFractal();
});