document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent immediate navigation
        const href = this.getAttribute('href');

        // Apply fade-out effect
        document.body.classList.add('fade-out');

        // After the animation completes, navigate to the new page
        setTimeout(() => {
            window.location.href = href;
        }, 500); // 500ms matches the CSS animation time
    });
});

// Declare variables to store the original and processed images
let originalImage = null;
let processedImage = null;

// Function to handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            originalImage = new Image();
            originalImage.onload = function() {
                // Set fixed canvas size
                const originalCanvas = document.getElementById("originalCanvas");
                const ctx = originalCanvas.getContext("2d");
                
                // Set the canvas size to 400x300
                originalCanvas.width = 400;
                originalCanvas.height = 300;
                
                // Draw the image on the canvas
                ctx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
                processedImage = originalImage; // Initialize processed image
            };
            originalImage.src = imageUrl;
        };
        reader.readAsDataURL(file);
    }
}

// Function to reset the image to its original state
function resetImage() {
    if (!originalImage) return; // If no image has been uploaded

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Reset the processed image to the original one
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 400; // Set fixed width
    canvas.height = 300; // Set fixed height
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
}

// Function to save the processed image (download as PNG)
function saveImage() {
    const canvas = document.getElementById("editedCanvas");
    const dataUrl = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "processed_image.png";
    a.click();
}

// Attach event listener to image input for uploading images
document.getElementById("imageInput").addEventListener("change", handleImageUpload);

// Attach event listener to save button for saving the image
document.getElementById("save").addEventListener("click", saveImage);



// Function to apply smoothing to the image using a basic mean filter (3x3)
function applySmoothing() {
    if (!processedImage) return; // If no image has been uploaded

    const canvas = document.getElementById("editedCanvas");
    const ctx = canvas.getContext("2d");

    // Set the canvas size to 400x300 (if not already set)
    canvas.width = 400;
    canvas.height = 300;

    // Draw the image onto the canvas
    ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

    // Apply smoothing (mean filter)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    // Define the kernel (3x3 mean filter)
    const kernel = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ];
    const kernelSize = 3;
    const kernelSum = 9;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let r = 0, g = 0, b = 0;

            for (let ky = 0; ky < kernelSize; ky++) {
                for (let kx = 0; kx < kernelSize; kx++) {
                    const px = x + kx - 1;
                    const py = y + ky - 1;
                    const i = (py * width + px) * 4;

                    r += src[i]     * kernel[ky][kx];
                    g += src[i + 1] * kernel[ky][kx];
                    b += src[i + 2] * kernel[ky][kx];
                }
            }

            const index = (y * width + x) * 4;
            output[index]     = r / kernelSum;
            output[index + 1] = g / kernelSum;
            output[index + 2] = b / kernelSum;
            output[index + 3] = src[index + 3]; // Preserve alpha
        }
    }

    // Create a new ImageData object for the edited canvas
    const smoothedImageData = editedCtx.createImageData(width, height);
    for (let i = 0; i < output.length; i++) {
        smoothedImageData.data[i] = output[i];
    }

    editedCtx.putImageData(smoothedImageData, 0, 0);
}


// Function to apply smoothing (Gaussian Blur) to the image
function Gaussianblur() {
    if (!processedImage) return; // If no image has been uploaded

    const canvas = document.getElementById("editedCanvas");
    const ctx = canvas.getContext("2d");

    // Set the canvas size to 400x300 (if not already set)
    canvas.width = 400;
    canvas.height = 300;

    // Draw the image onto the canvas
    ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

    // Apply Gaussian blur effect
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    // Create a kernel for Gaussian blur (3x3)
    const kernel = [
        [1/16, 2/16, 1/16],
        [2/16, 4/16, 2/16],
        [1/16, 2/16, 1/16]
    ];

    const width = canvas.width;
    const height = canvas.height;

    const applyKernel = (x, y) => {
        let r = 0, g = 0, b = 0;

        // Apply the kernel to the neighboring pixels
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const px = x + kx;
                const py = y + ky;

                // Ensure the pixel is within bounds
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = ((py * width) + px) * 4;
                    const weight = kernel[ky + 1][kx + 1];
                    r += pixels[index] * weight;
                    g += pixels[index + 1] * weight;
                    b += pixels[index + 2] * weight;
                }
            }
        }
        return [r, g, b];
    };

    // Create a new array to store the blurred pixels
    const newPixels = new Uint8ClampedArray(pixels.length);

    // Apply the kernel to each pixel in the image
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const index = (y * width + x) * 4;
            const [r, g, b] = applyKernel(x, y);
            newPixels[index] = r;
            newPixels[index + 1] = g;
            newPixels[index + 2] = b;
            newPixels[index + 3] = 255; // Full opacity
        }
    }

    // Put the new image data back on the canvas
    const blurredImageData = new ImageData(newPixels, width, height);
    ctx.putImageData(blurredImageData, 0, 0);
}

function sharpenImage() {
    if (!processedImage) return; // If no image has been uploaded

    const canvas = document.getElementById("editedCanvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to 400x300 (or any preferred size)
    canvas.width = 400;
    canvas.height = 300;

    // Draw the image onto the canvas
    ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Define the sharpening kernel (3x3 matrix)
    const kernel = [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ];

    // Create a copy of the image data to apply the filter
    const output = new Uint8ClampedArray(data);

    // Iterate over each pixel in the image (excluding borders)
    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            // Apply kernel to the current pixel
            let r = 0, g = 0, b = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    // Get the pixel value
                    const pixelIndex = ((y + ky) * canvas.width + (x + kx)) * 4;
                    const kernelValue = kernel[ky + 1][kx + 1];

                    // Apply the kernel to the pixel color channels (r, g, b)
                    r += data[pixelIndex] * kernelValue;
                    g += data[pixelIndex + 1] * kernelValue;
                    b += data[pixelIndex + 2] * kernelValue;
                }
            }

            // Set the new pixel values in the output array
            const outputIndex = (y * canvas.width + x) * 4;
            output[outputIndex] = Math.min(Math.max(r, 0), 255);
            output[outputIndex + 1] = Math.min(Math.max(g, 0), 255);
            output[outputIndex + 2] = Math.min(Math.max(b, 0), 255);
            output[outputIndex + 3] = 255; // Alpha channel (fully opaque)
        }
    }

    // Put the modified image data back onto the canvas
    ctx.putImageData(new ImageData(output, canvas.width, canvas.height), 0, 0);
}

function meanRemoval() {
    if (!processedImage) return; // If no image has been uploaded

    const canvas = document.getElementById("editedCanvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to 400x300 (or any preferred size)
    canvas.width = 400;
    canvas.height = 300;

    // Draw the image onto the canvas
    ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Define the Mean Removal kernel (3x3 matrix of 1/9)
    const kernel = [
        [-1, -1, -1], 
        [-1, 9, -1], 
        [-1, -1, -1] 
    ];

    // Create a copy of the image data to apply the filter
    const output = new Uint8ClampedArray(data);

    // Iterate over each pixel in the image (excluding borders)
    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            // Apply kernel to the current pixel
            let r = 0, g = 0, b = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    // Get the pixel value
                    const pixelIndex = ((y + ky) * canvas.width + (x + kx)) * 4;
                    const kernelValue = kernel[ky + 1][kx + 1];

                    // Apply the kernel to the pixel color channels (r, g, b)
                    r += data[pixelIndex] * kernelValue;
                    g += data[pixelIndex + 1] * kernelValue;
                    b += data[pixelIndex + 2] * kernelValue;
                }
            }

            // Set the new pixel values in the output array
            const outputIndex = (y * canvas.width + x) * 4;
            output[outputIndex] = Math.min(Math.max(r, 0), 255);
            output[outputIndex + 1] = Math.min(Math.max(g, 0), 255);
            output[outputIndex + 2] = Math.min(Math.max(b, 0), 255);
            output[outputIndex + 3] = 255; // Alpha channel (fully opaque)
        }
    }

    // Put the modified image data back onto the canvas
    ctx.putImageData(new ImageData(output, canvas.width, canvas.height), 0, 0);
}

function embosslaplascian() {
    if (!processedImage) return; // If no image has been uploaded

    const canvas = document.getElementById("editedCanvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;

    // Draw the image onto the canvas
    ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Emboss Laplacian kernel
    const kernel = [
        [-1, 0, -1], 
        [0,  4,  0], 
        [-1, 0, -1]
    ];

    const output = new Uint8ClampedArray(data);

    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            let r = 0, g = 0, b = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const px = ((y + ky) * canvas.width + (x + kx)) * 4;
                    const kv = kernel[ky + 1][kx + 1];  

                    r += data[px]     * kv;
                    g += data[px + 1] * kv;
                    b += data[px + 2] * kv;
                }
            }

            // Add 127 offset to simulate emboss brightness shift
            r = Math.min(Math.max(r + 127, 0), 255);
            g = Math.min(Math.max(g + 127, 0), 255);
            b = Math.min(Math.max(b + 127, 0), 255);

            const i = (y * canvas.width + x) * 4;
            output[i]     = r;
            output[i + 1] = g;
            output[i + 2] = b;
            output[i + 3] = 255;
        }
    }

    ctx.putImageData(new ImageData(output, canvas.width, canvas.height), 0, 0);
}

// Predefined filter kernels for comparison
const filters = {
    "smoothing": [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ],
    "gaussian": [
        [1/16, 2/16, 1/16],
        [2/16, 4/16, 2/16],
        [1/16, 2/16, 1/16]
    ],
    "sharpen": [
        [0, -1,  0],
        [-1,  5, -1],
        [0, -1,  0]
    ],
    "meanRemoval": [
        [-1, -1, -1],
        [-1,  9, -1],
        [-1, -1, -1]
    ],
    "embosslaplascian": [
        [-1,  0, -1],
        [ 0,  4,  0],
        [-1,  0, -1]
    ]
};

// Function to toggle the kernel section visibility and change button text
function customkernel() {
    const kernelWrapper = document.querySelector('.kernel-wrapper');
    const toggleButton = document.getElementById('toggleButton');

    // Toggle visibility of the kernel wrapper
    if (kernelWrapper.style.display === 'none' || kernelWrapper.style.display === '') {
        kernelWrapper.style.display = 'block';
        toggleButton.textContent = 'Hide Custom Kernel';  // Change button text when shown
    } else {
        kernelWrapper.style.display = 'none';
        toggleButton.textContent = 'Show Custom Kernel';  // Change button text when hidden
    }
}


// Function to apply the custom kernel and execute the filter
function applyCustomKernel() {
    // Get the custom kernel values
    let customKernel = [
        [parseInt(document.getElementById('k00').value), parseInt(document.getElementById('k01').value), parseInt(document.getElementById('k02').value)],
        [parseInt(document.getElementById('k10').value), parseInt(document.getElementById('k11').value), parseInt(document.getElementById('k12').value)],
        [parseInt(document.getElementById('k20').value), parseInt(document.getElementById('k21').value), parseInt(document.getElementById('k22').value)]
    ];

    // Check for a match with predefined filters
    for (let filter in filters) {
        if (compareKernels(customKernel, filters[filter])) {
            // Apply the corresponding filter
            switch (filter) {
                case 'smoothing':
                    applySmoothing();
                    break;
                case 'gaussian':
                    Gaussianblur();
                    break;
                case 'sharpen':
                    sharpenImage();
                    break;
                case 'meanRemoval':
                    meanRemoval();
                    break;
                case 'embosslaplascian':
                    embosslaplascian();
                    break;
            }
            console.log(`${filter} filter applied.`);
            return;
        }
    }

    // If no match, apply a custom kernel logic (optional)
    console.log("Custom kernel applied.");
    // Add logic to apply the custom kernel manually to the image if needed
}

// Function to compare two kernels
function compareKernels(kernel1, kernel2) {
    for (let i = 0; i < kernel1.length; i++) {
        for (let j = 0; j < kernel1[i].length; j++) {
            if (kernel1[i][j] !== kernel2[i][j]) {
                return false;
            }
        }
    }
    return true;
}

// The remaining filter functions (e.g., applySmoothing, Gaussianblur, etc.) remain unchanged
// These functions will be triggered if their respective kernels match the custom input kernel

// Function to reset the kernel grid to default values and reset the image to the original one
function resetKernelGrid() {
    // Reset all input fields to 0
    document.getElementById('k00').value = 0;
    document.getElementById('k01').value = 0;
    document.getElementById('k02').value = 0;
    document.getElementById('k10').value = 0;
    document.getElementById('k11').value = 0;
    document.getElementById('k12').value = 0;
    document.getElementById('k20').value = 0;
    document.getElementById('k21').value = 0;
    document.getElementById('k22').value = 0;

    // If no image has been uploaded, return
    if (!originalImage) return; 

    const canvas = document.getElementById("editedCanvas");
    const ctx = canvas.getContext("2d");

    // Reset the processed image to the original one
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 400; // Set fixed width
    canvas.height = 300; // Set fixed height
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    console.log("Kernel grid reset to default values and image reset to original.");
}

// Function to save the canvas content as an image
function saveCanvas() {
    const canvas = document.getElementById("editedCanvas");
    
    // Get the data URL of the canvas image (in PNG format)
    const dataURL = canvas.toDataURL("image/png");

    // Create a temporary link to trigger the download
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "image.png";  // Set the default file name for the download

    // Trigger the download
    link.click();

    console.log("Canvas image saved.");
}

// Add event listener to the save button
document.getElementById("save").addEventListener("click", saveCanvas);
