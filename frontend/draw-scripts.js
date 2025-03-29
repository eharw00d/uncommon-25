/* 
Scripts for draw.html
Written by Jamie Shiao
References:
    - https://kristoffer-dyrkorn.github.io/triangle-rasterizer/2.html

*/

const largeGridContainer = document.getElementById("largeGridContainer");
const paletteContainer = document.getElementById("paletteContainer");

// make a 2D array that will be saved once done drawing
let drawn_pose = [];

function init() {
    initGridAndPalette();
}

function initGridAndPalette() {
  // Keep the progress of the grid intact
  const currentGridItems = Array.from(largeGridContainer.children);

  // Populate the 16x16 grid if it hasn't been initialized
  if (currentGridItems.length === 0) {
    for (let i = 0; i < 256; i++) {
      const gridItem = document.createElement("div");
      gridItem.className = "grid-item";

      // Event listener to toggle background colors
      gridItem.addEventListener("click", () => {
        const currentBackground =
          window.getComputedStyle(gridItem).backgroundColor;
        const currentHexColor = rgbToHex(currentBackground);

        if (currentColor && currentHexColor !== currentColor) {
          gridItem.style.backgroundColor = currentColor; // Fill with selected color
        } else if (currentHexColor === currentColor) {
          gridItem.style.backgroundColor = ""; // Clear the background if clicked again
        } else {
          gridItem.style.backgroundColor = "";
        }
      });

      largeGridContainer.appendChild(gridItem);
    }
  }
}