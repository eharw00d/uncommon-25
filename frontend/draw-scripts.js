/* 
Scripts for draw.html
Written by Jamie Shiao with Assistance from ChatGPT
References:
    - https://kristoffer-dyrkorn.github.io/triangle-rasterizer/2.html

*/

const canvas = document.getElementById("pixel-grid");
const ctx = canvas.getContext("2d");

const gridWidth = 128;  // number of columns
const gridHeight = 72;  // number of rows
const pixelSize = 10;   // size of each pixel in canvas

let drawnPose = new Array(gridHeight).fill(null).map(() => new Array(gridWidth).fill(0));
let isDrawing = false;
let isErasing = false;
let brushSize = 1;
let history = []; // variable to store previous state

function init() {
    load();

    canvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        history.push("click");
        drawPixel(event);
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isDrawing) drawPixel(event);
    });

    document.addEventListener("mouseup", () => {
        isDrawing = false;
    });

    document.getElementById("size-1").addEventListener("click", () => (brushSize = 1));
    document.getElementById("size-3").addEventListener("click", () => (brushSize = 3));
    document.getElementById("size-8").addEventListener("click", () => (brushSize = 8));
    document.getElementById("eraser").addEventListener("click", () => (isErasing = !isErasing));
    document.getElementById("reset").addEventListener("click", reset);
    document.getElementById("undo").addEventListener("click", undo);
    document.getElementById("post").addEventListener("click", post);

    drawGrid();  // Initial grid
}

function drawGrid() {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            ctx.fillStyle = "#000";
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
}

function redrawGrid() {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            ctx.fillStyle = drawnPose[y][x] === 1 ? "#ffffff" : "#000000";
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
}

function undo() {
    if (history != null) {
        history.forEach(element => {
            drawnPose[element[0][0]][element[0][1]] = element[1]
        });
        redrawGrid();
        history = [];
    }
}

function undo() {
    if (history.length === 0) return; // Nothing to undo

    while (history.length > 0) {
        let lastAction = history.pop();

        if (lastAction === "click") {
            break; // Stop undoing when we reach the last stroke separator
        }

        let [coords, prevState] = lastAction;
        let [ny, nx] = coords;
        drawnPose[ny][nx] = prevState; // Restore previous state
    }

    redrawGrid();
}


function drawPixel(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);

    for (let dy = -Math.floor(brushSize / 2); dy <= Math.floor(brushSize / 2); dy++) {
        for (let dx = -Math.floor(brushSize / 2); dx <= Math.floor(brushSize / 2); dx++) {
            let nx = x + dx;
            let ny = y + dy;

            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                if (isErasing) {
                    drawnPose[ny][nx] = 0;
                    history.push([[ny, nx],1]);
                    ctx.fillStyle = "#000000";
                } else {
                    drawnPose[ny][nx] = 1;
                    history.push([[ny, nx],0]);
                    ctx.fillStyle = "#ffffff";
                }
                ctx.fillRect(nx * pixelSize, ny * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

function post() {
    // save the pose to backend
}

function autosave() {
    // save to backend
}

// save every 10 seconds
function startAutoSave() {
    setInterval(() => {
        autosave();
    }, 10000);
}

function reset() {
    drawnPose = new Array(gridHeight).fill(null).map(() => new Array(gridWidth).fill(0));
    redrawGrid();
    autosave();  
}

// load saved draft (from draw-draft.json)
function load() {
    const savedData = localStorage.getItem("draw-draft");
    if (savedData) {
        drawnPose = JSON.parse(savedData);
        redrawGrid();
    }
}