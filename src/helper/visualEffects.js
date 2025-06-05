// Visual Effects Engine for Enhanced Collage Rendering
export class VisualEffects {
  
  // Apply gradient background based on dominant colors
  static applyGradientBackground(ctx, canvasWidth, canvasHeight, colors = null) {
    if (!colors || colors.length === 0) {
      // Default gradient if no colors provided
      colors = ['#667eea', '#764ba2'];
    }
    
    // Create multi-stop gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    
    if (colors.length === 1) {
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, this.adjustBrightness(colors[0], -20));
    } else {
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
      });
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  
  // Apply radial gradient background
  static applyRadialBackground(ctx, canvasWidth, canvasHeight, colors = null) {
    if (!colors || colors.length === 0) {
      colors = ['#ffecd2', '#fcb69f'];
    }
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.max(canvasWidth, canvasHeight) * 0.7;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    
    if (colors.length >= 2) {
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      if (colors.length > 2) {
        colors.slice(2).forEach((color, index) => {
          gradient.addColorStop(0.3 + (index * 0.2), color);
        });
      }
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  
  // Draw album with enhanced shadow effects
  static drawAlbumWithShadow(ctx, imageUrl, position, options = {}) {
    const {
      shadowBlur = 20,
      shadowOffsetX = 8,
      shadowOffsetY = 8,
      shadowColor = 'rgba(0, 0, 0, 0.3)',
      borderRadius = 8
    } = options;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.save();
        
        // Apply rotation and scaling
        if (position.rotation || position.scale !== 1) {
          const centerX = position.x + position.width / 2;
          const centerY = position.y + position.height / 2;
          
          ctx.translate(centerX, centerY);
          if (position.rotation) ctx.rotate((position.rotation * Math.PI) / 180);
          if (position.scale !== 1) ctx.scale(position.scale, position.scale);
          ctx.translate(-centerX, -centerY);
        }
        
        // Draw shadow
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.shadowColor = shadowColor;
        
        // Draw rounded rectangle for modern look
        if (borderRadius > 0) {
          this.drawRoundedRect(ctx, position.x, position.y, position.width, position.height, borderRadius);
          ctx.clip();
        }
        
        // Draw the image
        ctx.drawImage(img, position.x, position.y, position.width, position.height);
        
        ctx.restore();
        resolve();
      };
      
      img.onerror = () => resolve();
      img.src = imageUrl;
    });
  }
  
  // Draw album with artistic blend mode effects
  static drawAlbumWithBlendMode(ctx, imageUrl, position, blendMode = 'multiply') {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.save();
        
        // Set blend mode
        ctx.globalCompositeOperation = blendMode;
        
        // Apply transformations
        if (position.rotation || position.scale !== 1) {
          const centerX = position.x + position.width / 2;
          const centerY = position.y + position.height / 2;
          
          ctx.translate(centerX, centerY);
          if (position.rotation) ctx.rotate((position.rotation * Math.PI) / 180);
          if (position.scale !== 1) ctx.scale(position.scale, position.scale);
          ctx.translate(-centerX, -centerY);
        }
        
        ctx.drawImage(img, position.x, position.y, position.width, position.height);
        
        ctx.restore();
        resolve();
      };
      
      img.onerror = () => resolve();
      img.src = imageUrl;
    });
  }
  
  // Apply vintage film effect
  static applyVintageEffect(ctx, canvasWidth, canvasHeight) {
    // Add film grain texture
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Add sepia tone
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
      
      // Add random noise
      const noise = Math.random() * 30 - 15;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add vignette effect
    this.applyVignette(ctx, canvasWidth, canvasHeight, 'rgba(139, 69, 19, 0.3)');
  }
  
  // Apply vignette effect
  static applyVignette(ctx, canvasWidth, canvasHeight, color = 'rgba(0, 0, 0, 0.3)') {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.max(canvasWidth, canvasHeight) * 0.6;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, 'transparent');
    gradient.addColorStop(1, color);
    
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
  
  // Apply neon glow effect to albums
  static drawAlbumWithGlow(ctx, imageUrl, position, glowColor = '#00ffff') {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.save();
        
        // Apply transformations
        if (position.rotation || position.scale !== 1) {
          const centerX = position.x + position.width / 2;
          const centerY = position.y + position.height / 2;
          
          ctx.translate(centerX, centerY);
          if (position.rotation) ctx.rotate((position.rotation * Math.PI) / 180);
          if (position.scale !== 1) ctx.scale(position.scale, position.scale);
          ctx.translate(-centerX, -centerY);
        }
        
        // Draw glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = glowColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw multiple times for stronger glow
        for (let i = 0; i < 3; i++) {
          ctx.drawImage(img, position.x, position.y, position.width, position.height);
        }
        
        // Draw the actual image on top
        ctx.shadowBlur = 0;
        ctx.drawImage(img, position.x, position.y, position.width, position.height);
        
        ctx.restore();
        resolve();
      };
      
      img.onerror = () => resolve();
      img.src = imageUrl;
    });
  }
  
  // Apply polaroid photo effect
  static drawPolaroid(ctx, imageUrl, position) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.save();
        
        const polaroidPadding = 20;
        const textHeight = 40;
        const totalWidth = position.width + (polaroidPadding * 2);
        const totalHeight = position.height + (polaroidPadding * 2) + textHeight;
        
        // Apply transformations
        if (position.rotation || position.scale !== 1) {
          const centerX = position.x + totalWidth / 2;
          const centerY = position.y + totalHeight / 2;
          
          ctx.translate(centerX, centerY);
          if (position.rotation) ctx.rotate((position.rotation * Math.PI) / 180);
          if (position.scale !== 1) ctx.scale(position.scale, position.scale);
          ctx.translate(-centerX, -centerY);
        }
        
        // Draw polaroid background
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(position.x, position.y, totalWidth, totalHeight);
        
        // Draw shadow
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        // Draw photo area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(position.x, position.y, totalWidth, totalHeight);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw the image
        ctx.drawImage(
          img, 
          position.x + polaroidPadding, 
          position.y + polaroidPadding, 
          position.width, 
          position.height
        );
        
        ctx.restore();
        resolve();
      };
      
      img.onerror = () => resolve();
      img.src = imageUrl;
    });
  }
  
  // Helper function to draw rounded rectangles
  static drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  // Adjust color brightness
  static adjustBrightness(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  // Convert hex to rgba
  static hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : 
      null;
  }
  
  // Generate complementary color
  static getComplementaryColor(hex) {
    const num = parseInt(hex.replace("#", ""), 16);
    const R = 255 - (num >> 16);
    const G = 255 - (num >> 8 & 0x00FF);
    const B = 255 - (num & 0x0000FF);
    
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
} 