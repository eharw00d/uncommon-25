import React, { useState, useEffect } from "react";
import jsonData from "./poses.json"; // Import JSON file with 2D array

const Grid = () => {
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    setGrid(jsonData); // Load JSON data into state
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 40px)`, gap: "2px" }}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: cell === 1 ? "rgba(255, 0, 0, 0.5)" : "white", // Red with transparency
              border: "1px solid black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cell}
          </div>
        ))
      )}
    </div>
  );
};

export default Grid;