// AI Layout Generation Engine for Dynamic Collage Creation
export class LayoutAI {
  
  // Golden ratio constant for aesthetically pleasing layouts
  static GOLDEN_RATIO = 1.618;
  static PHI = (1 + Math.sqrt(5)) / 2; // More precise golden ratio
  
  // Generate golden ratio-based grid layout
  static generateGoldenGrid(albumCount, canvasWidth, canvasHeight, albumSize = 300) {
    const positions = [];
    
    // Calculate optimal grid based on golden ratio
    const aspectRatio = canvasWidth / canvasHeight;
    let columns = Math.ceil(Math.sqrt(albumCount * aspectRatio));
    let rows = Math.ceil(albumCount / columns);
    
    // Adjust for golden ratio proportions
    if (columns / rows > this.GOLDEN_RATIO) {
      columns = Math.ceil(rows * this.GOLDEN_RATIO);
    } else if (rows / columns > this.GOLDEN_RATIO) {
      rows = Math.ceil(columns * this.GOLDEN_RATIO);
    }
    
    // Calculate spacing based on available space and golden ratio
    const availableWidth = canvasWidth - (columns * albumSize);
    const availableHeight = canvasHeight - (rows * albumSize);
    
    const spacingX = availableWidth / (columns + 1);
    const spacingY = availableHeight / (rows + 1);
    
    // Generate positions with golden ratio spacing
    let albumIndex = 0;
    for (let row = 0; row < rows && albumIndex < albumCount; row++) {
      for (let col = 0; col < columns && albumIndex < albumCount; col++) {
        // Apply golden ratio offset for visual interest
        const goldenOffsetX = (col % 2) * (spacingX / this.PHI);
        const goldenOffsetY = (row % 2) * (spacingY / this.PHI);
        
        const x = spacingX + (col * (albumSize + spacingX)) + goldenOffsetX;
        const y = spacingY + (row * (albumSize + spacingY)) + goldenOffsetY;
        
        positions.push({
          x: Math.round(x),
          y: Math.round(y),
          width: albumSize,
          height: albumSize,
          rotation: 0,
          scale: 1,
          albumIndex
        });
        
        albumIndex++;
      }
    }
    
    return positions;
  }
  
  // Generate spiral layout based on golden ratio - FIXED
  static generateGoldenSpiral(albumCount, canvasWidth, canvasHeight, albumSize = 200) {
    const positions = [];
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Fixed spiral parameters for better distribution
    const goldenAngle = 137.508 * (Math.PI / 180); // Golden angle in radians
    const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.4; // Stay within canvas
    const radiusGrowth = maxRadius / Math.sqrt(albumCount); // Better radius calculation
    
    console.log(`Generating spiral for ${albumCount} albums, canvas: ${canvasWidth}x${canvasHeight}`);
    
    for (let i = 0; i < albumCount; i++) {
      const angle = i * goldenAngle;
      const radius = radiusGrowth * Math.sqrt(i + 1);
      
      // Ensure we don't exceed canvas bounds
      const effectiveRadius = Math.min(radius, maxRadius);
      
      const x = centerX + effectiveRadius * Math.cos(angle) - albumSize / 2;
      const y = centerY + effectiveRadius * Math.sin(angle) - albumSize / 2;
      
      // Add controlled random variation for organic feel
      const variation = Math.min(albumSize * 0.05, 10); // Smaller variation
      const randomX = (Math.random() - 0.5) * variation;
      const randomY = (Math.random() - 0.5) * variation;
      
      // Ensure positions stay within canvas bounds
      const finalX = Math.max(0, Math.min(canvasWidth - albumSize, x + randomX));
      const finalY = Math.max(0, Math.min(canvasHeight - albumSize, y + randomY));
      
      positions.push({
        x: Math.round(finalX),
        y: Math.round(finalY),
        width: albumSize,
        height: albumSize,
        rotation: Math.random() * 6 - 3, // Smaller rotation for stability
        scale: 0.9 + Math.random() * 0.2, // More controlled scaling
        albumIndex: i
      });
    }
    
    console.log(`Generated ${positions.length} spiral positions`);
    return positions;
  }
  
  // Generate organic, force-directed layout - FIXED
  static generateOrganicLayout(albumCount, canvasWidth, canvasHeight, albumSize = 250) {
    const positions = [];
    const nodes = [];
    
    console.log(`Generating organic layout for ${albumCount} albums, canvas: ${canvasWidth}x${canvasHeight}`);
    
    // Initialize positions in a more controlled way
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const initRadius = Math.min(canvasWidth, canvasHeight) * 0.3;
    
    for (let i = 0; i < albumCount; i++) {
      // Start in a loose circle instead of completely random
      const angle = (i / albumCount) * Math.PI * 2;
      const radius = initRadius * (0.5 + Math.random() * 0.5);
      
      const x = centerX + radius * Math.cos(angle) - albumSize / 2;
      const y = centerY + radius * Math.sin(angle) - albumSize / 2;
      
      nodes.push({
        x: Math.max(albumSize, Math.min(canvasWidth - albumSize * 2, x)),
        y: Math.max(albumSize, Math.min(canvasHeight - albumSize * 2, y)),
        vx: 0,
        vy: 0,
        albumIndex: i
      });
    }
    
    // Apply force-directed algorithm with better parameters
    const iterations = 100; // More iterations for better settling
    const repulsionStrength = albumSize * 1.5; // Adjusted repulsion
    const attractionStrength = 0.005; // Gentler attraction
    const damping = 0.85; // Better damping
    
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate forces between nodes
      for (let i = 0; i < nodes.length; i++) {
        let fx = 0, fy = 0;
        
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Repulsion force (avoid overlap)
          if (distance < repulsionStrength) {
            const force = (repulsionStrength - distance) / repulsionStrength;
            fx -= (dx / distance) * force * 50;
            fy -= (dy / distance) * force * 50;
          }
        }
        
        // Gentle attraction to center to keep layout compact
        const centerDx = centerX - nodes[i].x;
        const centerDy = centerY - nodes[i].y;
        const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
        
        if (centerDistance > initRadius) {
          fx += centerDx * attractionStrength;
          fy += centerDy * attractionStrength;
        }
        
        // Apply forces with damping
        nodes[i].vx = (nodes[i].vx + fx) * damping;
        nodes[i].vy = (nodes[i].vy + fy) * damping;
        
        // Update positions
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;
        
        // Keep within bounds with padding
        const padding = albumSize * 0.1;
        nodes[i].x = Math.max(padding, Math.min(canvasWidth - albumSize - padding, nodes[i].x));
        nodes[i].y = Math.max(padding, Math.min(canvasHeight - albumSize - padding, nodes[i].y));
      }
    }
    
    // Convert to position format
    nodes.forEach(node => {
      positions.push({
        x: Math.round(node.x),
        y: Math.round(node.y),
        width: albumSize,
        height: albumSize,
        rotation: Math.random() * 10 - 5, // Controlled rotation
        scale: 0.95 + Math.random() * 0.1, // Subtle scale variation
        albumIndex: node.albumIndex
      });
    });
    
    console.log(`Generated ${positions.length} organic positions`);
    return positions;
  }
  
  // Generate magazine-style layout with varied sizes
  static generateMagazineLayout(albumCount, canvasWidth, canvasHeight) {
    const positions = [];
    const baseSizes = [200, 250, 300, 350]; // Different album sizes
    const columns = 3;
    const padding = 20;
    
    let currentX = padding;
    let currentY = padding;
    let columnHeights = new Array(columns).fill(padding);
    
    for (let i = 0; i < albumCount; i++) {
      // Randomly choose size with bias toward medium sizes
      const sizeIndex = this.weightedRandom([0.2, 0.4, 0.3, 0.1]);
      const size = baseSizes[sizeIndex];
      
      // Find column with lowest height
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const columnWidth = (canvasWidth - padding * (columns + 1)) / columns;
      
      const x = padding + shortestColumn * (columnWidth + padding);
      const y = columnHeights[shortestColumn];
      
      // Ensure album fits in column
      const finalSize = Math.min(size, columnWidth);
      
      positions.push({
        x: Math.round(x + (columnWidth - finalSize) / 2),
        y: Math.round(y),
        width: finalSize,
        height: finalSize,
        rotation: 0,
        scale: 1,
        albumIndex: i
      });
      
      // Update column height
      columnHeights[shortestColumn] += finalSize + padding;
    }
    
    return positions;
  }
  
  // Generate hexagonal honeycomb layout
  static generateHoneycombLayout(albumCount, canvasWidth, canvasHeight, albumSize = 200) {
    const positions = [];
    const hexRadius = albumSize / 2;
    const hexWidth = hexRadius * 2;
    const hexHeight = hexRadius * Math.sqrt(3);
    
    // Calculate grid dimensions
    const cols = Math.floor(canvasWidth / (hexWidth * 0.75));
    const rows = Math.floor(canvasHeight / hexHeight);
    
    let albumIndex = 0;
    
    for (let row = 0; row < rows && albumIndex < albumCount; row++) {
      for (let col = 0; col < cols && albumIndex < albumCount; col++) {
        // Hexagonal offset for alternating rows
        const offsetX = (row % 2) * (hexWidth * 0.375);
        
        const x = col * (hexWidth * 0.75) + offsetX;
        const y = row * hexHeight;
        
        // Add slight random variation
        const randomX = (Math.random() - 0.5) * 20;
        const randomY = (Math.random() - 0.5) * 20;
        
        if (x + albumSize <= canvasWidth && y + albumSize <= canvasHeight) {
          positions.push({
            x: Math.round(x + randomX),
            y: Math.round(y + randomY),
            width: albumSize,
            height: albumSize,
            rotation: Math.random() * 6 - 3,
            scale: 0.95 + Math.random() * 0.1,
            albumIndex
          });
          
          albumIndex++;
        }
      }
    }
    
    return positions;
  }
  
  // Helper function for weighted random selection
  static weightedRandom(weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) return i;
    }
    
    return weights.length - 1;
  }
  
  // Auto-optimize spacing based on album count and canvas size - IMPROVED
  static optimizeSpacing(positions, canvasWidth, canvasHeight) {
    if (positions.length === 0) return positions;
    
    // Calculate current bounds
    const bounds = this.calculateBounds(positions);
    const currentWidth = bounds.maxX - bounds.minX;
    const currentHeight = bounds.maxY - bounds.minY;
    
    // Only scale if content is significantly outside bounds or too small
    const scaleX = (canvasWidth * 0.85) / currentWidth;
    const scaleY = (canvasHeight * 0.85) / currentHeight;
    const optimalScale = Math.min(scaleX, scaleY);
    
    // Only apply scaling if it's significantly different from 1
    if (optimalScale > 1.2 || optimalScale < 0.8) {
      // Calculate centering offsets
      const scaledWidth = currentWidth * optimalScale;
      const scaledHeight = currentHeight * optimalScale;
      const offsetX = (canvasWidth - scaledWidth) / 2 - bounds.minX * optimalScale;
      const offsetY = (canvasHeight - scaledHeight) / 2 - bounds.minY * optimalScale;
      
      // Apply scaling and centering
      return positions.map(pos => ({
        ...pos,
        x: Math.round(pos.x * optimalScale + offsetX),
        y: Math.round(pos.y * optimalScale + offsetY),
        width: Math.round(pos.width * optimalScale),
        height: Math.round(pos.height * optimalScale)
      }));
    }
    
    // If no significant scaling needed, just center the layout
    const offsetX = (canvasWidth - currentWidth) / 2 - bounds.minX;
    const offsetY = (canvasHeight - currentHeight) / 2 - bounds.minY;
    
    return positions.map(pos => ({
      ...pos,
      x: Math.round(pos.x + offsetX),
      y: Math.round(pos.y + offsetY)
    }));
  }
  
  // Calculate bounding box of all positions
  static calculateBounds(positions) {
    if (positions.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    positions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + pos.height);
    });
    
    return { minX, minY, maxX, maxY };
  }
  
  // Generate layout based on type with auto-optimization
  static generateLayout(type, albumCount, canvasWidth, canvasHeight, albumSize = 300) {
    console.log(`Generating layout: ${type}, ${albumCount} albums, ${canvasWidth}x${canvasHeight}`);
    
    let positions;
    
    try {
      switch (type) {
        case 'golden-grid':
          positions = this.generateGoldenGrid(albumCount, canvasWidth, canvasHeight, albumSize);
          break;
        case 'golden-spiral':
          positions = this.generateGoldenSpiral(albumCount, canvasWidth, canvasHeight, albumSize * 0.7);
          break;
        case 'organic':
          positions = this.generateOrganicLayout(albumCount, canvasWidth, canvasHeight, albumSize * 0.8);
          break;
        case 'magazine':
          positions = this.generateMagazineLayout(albumCount, canvasWidth, canvasHeight);
          break;
        case 'honeycomb':
          positions = this.generateHoneycombLayout(albumCount, canvasWidth, canvasHeight, albumSize * 0.8);
          break;
        default:
          console.log(`Unknown layout type: ${type}, falling back to golden-grid`);
          positions = this.generateGoldenGrid(albumCount, canvasWidth, canvasHeight, albumSize);
      }
      
      if (!positions || positions.length === 0) {
        console.warn(`No positions generated for layout ${type}`);
        return [];
      }
      
      console.log(`Generated ${positions.length} positions before optimization`);
      
      // Auto-optimize spacing and positioning
      const optimizedPositions = this.optimizeSpacing(positions, canvasWidth, canvasHeight);
      console.log(`Optimized to ${optimizedPositions.length} positions`);
      
      return optimizedPositions;
      
    } catch (error) {
      console.error(`Error generating layout ${type}:`, error);
      // Fallback to simple grid
      return this.generateGoldenGrid(albumCount, canvasWidth, canvasHeight, albumSize);
    }
  }
} 