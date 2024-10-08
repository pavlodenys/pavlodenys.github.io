// Get DOM elements
const formulaSelect = document.getElementById('formulaSelect');
const maxIterationsInput = document.getElementById('maxIterations');
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Fractal parameters
let maxIterations = 100;
let xMin = -2;
let xMax = 1;
let yMin = -1.5;
let yMax = 1.5;

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

// Modify the renderFractal function to use the new getColor function
function renderFractal() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const c = mapToComplex(x, y);
            const iterations = mandelbrot(c);
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

// Event listeners
formulaSelect.addEventListener('change', (event) => {
    console.log('Selected formula:', event.target.value);
});

maxIterationsInput.addEventListener('input', (event) => {
    console.log('Max iterations:', event.target.value);
    maxIterations = parseInt(event.target.value);
    renderFractal();
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