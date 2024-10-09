self.onmessage = function (event) {
    const { width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula, tileSize, scale } = event.data;

    computeFractal(width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula, tileSize, scale);
};

function computeFractal(width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula, tileSize, scale) {
    const totalTilesX = Math.ceil(width / tileSize);
    const totalTilesY = Math.ceil(height / tileSize);

    for (let tileY = 0; tileY < totalTilesY; tileY++) {
        for (let tileX = 0; tileX < totalTilesX; tileX++) {
            const startX = tileX * tileSize;
            const startY = tileY * tileSize;
            const tileWidth = Math.min(tileSize, width - startX);
            const tileHeight = Math.min(tileSize, height - startY);

            const imageData = computeTile(startX, startY, tileWidth, tileHeight, width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula);

            self.postMessage({
                startX,
                startY,
                imageData,
                scale
            });
        }
    }
}

// Map canvas coordinates to complex plane
function mapToComplex(x, y, width, height, xMin, xMax, yMin, yMax) {
    const real = xMin + (x / width) * (xMax - xMin);
    const imag = yMin + (y / height) * (yMax - yMin);
    return { real, imag };
}

// Mandelbrot set formula
function mandelbrot(c, maxIterations) {
    let z = { real: 0, imag: 0 };
    let i = 0;
    for (; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + c.real;
        const imag = 2 * z.real * z.imag + c.imag;
        z = { real, imag };
        if (z.real * z.real + z.imag * z.imag > 4) {
            break;
        }
    }
    return i;
}

// Julia set formula
function julia(z, maxIterations, juliaConstant) {
    let i = 0;
    for (; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + juliaConstant.real;
        const imag = 2 * z.real * z.imag + juliaConstant.imag;
        z = { real, imag };
        if (z.real * z.real + z.imag * z.imag > 4) {
            break;
        }
    }
    return i;
}

// Burning Ship fractal formula
function burningShip(c, maxIterations) {
    let z = { real: c.real, imag: c.imag };
    let i = 0;
    for (; i < maxIterations; i++) {
        const real = z.real * z.real - z.imag * z.imag + c.real;
        const imag = 2 * Math.abs(z.real * z.imag) + c.imag;
        z = { real: Math.abs(real), imag: Math.abs(imag) };
        if (z.real * z.real + z.imag * z.imag > 4) {
            break;
        }
    }
    return i;
}

// Function to compute the color based on iterations
function getColor(iterations, maxIterations) {
    if (iterations === maxIterations) {
        return [0, 0, 0]; // Black for points inside the set
    }

    const hue = 360 * iterations / maxIterations;
    const saturation = 100;
    const lightness = 50;

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

// function computeFractal(width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula, tileSize) {
//     const totalTilesX = Math.ceil(width / tileSize);
//     const totalTilesY = Math.ceil(height / tileSize);

//     for (let tileY = 0; tileY < totalTilesY; tileY++) {
//         for (let tileX = 0; tileX < totalTilesX; tileX++) {
//             const startX = tileX * tileSize;
//             const startY = tileY * tileSize;
//             const tileWidth = Math.min(tileSize, width - startX);
//             const tileHeight = Math.min(tileSize, height - startY);

//             const imageData = computeTile(startX, startY, tileWidth, tileHeight, width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula);

//             // Send each tile back to the main thread
//             self.postMessage({
//                 startX,
//                 startY,
//                 imageData
//             });
//         }
//     }
// }

function computeTile(startX, startY, tileWidth, tileHeight, width, height, xMin, xMax, yMin, yMax, maxIterations, selectedFormula) {
    const imageData = new ImageData(tileWidth, tileHeight);
    const data = imageData.data;

    const JULIA_CONSTANT = { real: -0.7, imag: 0.27015 }; // Same as in the main script

    for (let x = 0; x < tileWidth; x++) {
        for (let y = 0; y < tileHeight; y++) {
            const canvasX = startX + x;
            const canvasY = startY + y;

            const c = mapToComplex(canvasX, canvasY, width, height, xMin, xMax, yMin, yMax);
            let iterations;

            if (selectedFormula === 'mandelbrot') {
                iterations = mandelbrot(c, maxIterations);
            } else if (selectedFormula === 'julia') {
                iterations = julia(c, maxIterations, JULIA_CONSTANT);
            } else if (selectedFormula === 'burningShip') {
                iterations = burningShip(c, maxIterations);
            }

            const index = (y * tileWidth + x) * 4;
            const [r, g, b] = getColor(iterations, maxIterations);
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255; // Alpha channel
        }
    }

    return imageData;
}

