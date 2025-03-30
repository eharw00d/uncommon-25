import React, { useEffect, useRef, useState } from 'react';
import './CSS/PixelPose.css';
import { useAuth0 } from "@auth0/auth0-react"; // Import Auth0 hook

const PixelPose = () => {
    const { getAccessTokenSilently } = useAuth0(); // Get function to retrieve token

    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isErasing, setIsErasing] = useState(false);
    const [brushSize, setBrushSize] = useState(1);
    const [history, setHistory] = useState([]);

    // Initialize with an empty grid immediately to avoid undefined errors
    const gridWidth = 32;  // number of columns
    const gridHeight = 18;  // number of rows
    const pixelSize = 40;   // size of each pixel in canvas

    // Initialize drawnPose with a proper 2D array right away
    const [drawnPose, setDrawnPose] = useState(
        new Array(gridHeight).fill(null).map(() => new Array(gridWidth).fill(0))
    );

    // Initialize the grid on component mount
    useEffect(() => {
        if (!canvasRef.current) return;

        // Try to load saved draft
        try {
            const savedData = localStorage.getItem("draw-draft");
            if (savedData) {
                const loadedPose = JSON.parse(savedData);
                // Validate the loaded data structure before using it
                if (Array.isArray(loadedPose) &&
                    loadedPose.length === gridHeight &&
                    loadedPose[0].length === gridWidth) {
                    setDrawnPose(loadedPose);
                }
            }
        } catch (error) {
            console.error("Error loading saved data:", error);
            // If there's an error loading data, we'll use the initial empty grid
        }

        // Draw initial grid
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Initial draw (all black)
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                ctx.fillStyle = "#000000";
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }

        // Set up event listeners for mouse up outside of canvas
        document.addEventListener("mouseup", handleMouseUp);

        // Cleanup event listeners
        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    // Redraw grid whenever drawnPose changes
    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        // Safely redraw the grid
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                // Ensure we're accessing valid array positions
                if (drawnPose[y] && typeof drawnPose[y][x] !== 'undefined') {
                    ctx.fillStyle = drawnPose[y][x] === 1 ? "#ffffff" : "#000000";
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }, [drawnPose]);

    // Handle mouse down on canvas
    const handleMouseDown = (event) => {
        setIsDrawing(true);
        setHistory([...history, "click"]);
        drawPixel(event);
    };

    // Handle mouse move on canvas
    const handleMouseMove = (event) => {
        if (isDrawing) {
            drawPixel(event);
        }
    };

    // Handle mouse up
    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    // Draw or erase pixels
    const drawPixel = (event) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / pixelSize);
        const y = Math.floor((event.clientY - rect.top) / pixelSize);

        // Create a deep copy of the current drawnPose to update
        const newDrawnPose = JSON.parse(JSON.stringify(drawnPose));
        const newHistory = [...history];

        for (let dy = -Math.floor(brushSize / 2); dy <= Math.floor(brushSize / 2); dy++) {
            for (let dx = -Math.floor(brushSize / 2); dx <= Math.floor(brushSize / 2); dx++) {
                let nx = x + dx;
                let ny = y + dy;

                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    // Save the previous state for undo
                    newHistory.push([[ny, nx], newDrawnPose[ny][nx]]);

                    if (isErasing) {
                        newDrawnPose[ny][nx] = 0;
                        ctx.fillStyle = "#000000";
                    } else {
                        newDrawnPose[ny][nx] = 1;
                        ctx.fillStyle = "#ffffff";
                    }
                    ctx.fillRect(nx * pixelSize, ny * pixelSize, pixelSize, pixelSize);
                }
            }
        }

        setDrawnPose(newDrawnPose);
        setHistory(newHistory);
    };

    // Undo the last drawing action
    const handleUndo = () => {
        if (history.length === 0) return; // Nothing to undo

        const newHistory = [...history];
        const newDrawnPose = JSON.parse(JSON.stringify(drawnPose));

        while (newHistory.length > 0) {
            let lastAction = newHistory.pop();

            if (lastAction === "click") {
                break; // Stop undoing when we reach the last stroke separator
            }

            if (Array.isArray(lastAction)) {
                let [coords, prevState] = lastAction;
                if (coords && coords.length === 2) {
                    let [ny, nx] = coords;
                    if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth) {
                        newDrawnPose[ny][nx] = prevState; // Restore previous state
                    }
                }
            }
        }

        setHistory(newHistory);
        setDrawnPose(newDrawnPose);
    };

    // Reset the canvas
    const handleReset = () => {
        const newDrawnPose = new Array(gridHeight).fill(null).map(() => new Array(gridWidth).fill(0));
        setDrawnPose(newDrawnPose);
        setHistory([]);

        try {
            localStorage.setItem("draw-draft", JSON.stringify(newDrawnPose));
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    // Post the drawing (placeholder)
    const handlePost = async () => {
        try {
            const response = await fetch("http://localhost:8080/poses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    drawnPose: drawnPose,
                    createdAt: new Date().toISOString() 
                }),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log("Successfully saved pose:", data);
            alert("Drawing saved successfully!");
        } catch (error) {
            console.error("Error posting drawing:", error);
            alert("Failed to save drawing. Check console for details.");
        }
    };

    // Save to localStorage
    const autosave = () => {
        try {
            localStorage.setItem("draw-draft", JSON.stringify(drawnPose));
        } catch (error) {
            console.error("Error autosaving data:", error);
        }
    };

    // Set up autosave
    useEffect(() => {
        const interval = setInterval(() => {
            autosave();
        }, 10000);

        return () => clearInterval(interval);
    }, [drawnPose]);

    return (
        <div className="pixel-pose-layout">
            <div className="pixel-pose-canvas-container">
                <canvas
                    id="pixel-grid"
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                />
            </div>

            <div className="pixel-pose-controls">
                <div className="pixel-pose-control-group">
                    <h4>Drawing Tools</h4>
                    <button
                        className={`pixel-pose-button ${isErasing ? "pixel-pose-button-active" : ""}`}
                        onClick={() => setIsErasing(!isErasing)}
                    >
                        {isErasing ? "Draw" : "Erase"}
                    </button>
                    <button className="pixel-pose-button" onClick={handleUndo}>Undo</button>
                    <button className="pixel-pose-button" onClick={handleReset}>Erase All</button>
                </div>

                <div className="pixel-pose-control-group">
                    <h4>Brush Size</h4>
                    <button
                        className={`pixel-pose-button ${brushSize === 1 ? "pixel-pose-button-active" : ""}`}
                        onClick={() => setBrushSize(1)}
                    >
                        Small
                    </button>
                    <button
                        className={`pixel-pose-button ${brushSize === 3 ? "pixel-pose-button-active" : ""}`}
                        onClick={() => setBrushSize(3)}
                    >
                        Medium
                    </button>
                    <button
                        className={`pixel-pose-button ${brushSize === 8 ? "pixel-pose-button-active" : ""}`}
                        onClick={() => setBrushSize(8)}
                    >
                        Large
                    </button>
                </div>

                <div className="pixel-pose-control-group">
                    <h4>Save</h4>
                    <button className="pixel-pose-button" onClick={handlePost}>Post</button>
                </div>
            </div>
        </div>
    );
};

export default PixelPose;