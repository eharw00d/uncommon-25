import React, { useEffect } from 'react';

const CursorPixels = () => {
  useEffect(() => {
    // Configuration
    const pixelSize = 6;
    const trailLength = 10;
    const pixelLifespan = 500; // ms
    
    // Track pixels manually
    const pixels = [];
    
    // Create container for pixels if it doesn't exist
    let pixelContainer = document.getElementById('pixel-trail-container');
    if (!pixelContainer) {
      pixelContainer = document.createElement('div');
      pixelContainer.id = 'pixel-trail-container';
      pixelContainer.style.position = 'fixed';
      pixelContainer.style.top = '0';
      pixelContainer.style.left = '0';
      pixelContainer.style.width = '100%';
      pixelContainer.style.height = '100%';
      pixelContainer.style.pointerEvents = 'none';
      pixelContainer.style.zIndex = '9999';
      document.body.appendChild(pixelContainer);
    }
    
    // Handle mouse movement
    const handleMouseMove = (e) => {
      // Get exact mouse position
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Snap to grid
      const x = Math.floor(mouseX / pixelSize) * pixelSize;
      const y = Math.floor(mouseY / pixelSize) * pixelSize;
      
      // Check if we should add a new pixel
      const shouldAddPixel = pixels.length === 0 || 
        pixels[0].x !== x || 
        pixels[0].y !== y;
      
      if (shouldAddPixel) {
        // Create new pixel
        const pixel = document.createElement('div');
        pixel.className = 'cursor-pixel';
        pixel.style.position = 'absolute';
        pixel.style.width = `${pixelSize}px`;
        pixel.style.height = `${pixelSize}px`;
        pixel.style.backgroundColor = '#000';
        pixel.style.left = `${x}px`;
        pixel.style.top = `${y}px`;
        pixel.style.pointerEvents = 'none';
        
        // Add to DOM
        pixelContainer.appendChild(pixel);
        
        // Add to array
        pixels.unshift({
          element: pixel,
          x,
          y,
          createdAt: Date.now()
        });
        
        // Limit trail length
        while (pixels.length > trailLength) {
          const oldPixel = pixels.pop();
          if (oldPixel.element && oldPixel.element.parentNode) {
            oldPixel.element.parentNode.removeChild(oldPixel.element);
          }
        }
        
        // Update opacity of all pixels
        pixels.forEach((p, index) => {
          const opacity = 1 - (index / trailLength);
          p.element.style.opacity = opacity;
        });
      }
    };
    
    // Clean up old pixels
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Remove pixels that have been around too long
      while (pixels.length > 0 && now - pixels[pixels.length - 1].createdAt > pixelLifespan) {
        const oldPixel = pixels.pop();
        if (oldPixel.element && oldPixel.element.parentNode) {
          oldPixel.element.parentNode.removeChild(oldPixel.element);
        }
      }
    }, 100);
    
    // Add event listener directly to document
    document.addEventListener('mousemove', handleMouseMove);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(cleanupInterval);
      
      // Remove container when component unmounts
      if (pixelContainer && pixelContainer.parentNode) {
        pixelContainer.parentNode.removeChild(pixelContainer);
      }
    };
  }, []);
  
  // This component doesn't render anything - it works via side effects
  return null;
};

export default CursorPixels;