// Visual Effects Engine for Enhanced Collage Rendering
export class VisualEffects {
  static decodedCovers = new Map();
  static bakedCovers = new Map();

  static loadCover(imageUrl) {
    if (!imageUrl) {
      return Promise.resolve(null);
    }
    const existing = this.decodedCovers.get(imageUrl);
    if (existing) {
      return existing;
    }
    const pending = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
    this.decodedCovers.set(imageUrl, pending);
    return pending;
  }

  static bake(key, create) {
    const existing = this.bakedCovers.get(key);
    if (existing) {
      return existing;
    }
    const pending = Promise.resolve().then(create);
    this.bakedCovers.set(key, pending);
    pending.catch(() => {
      if (this.bakedCovers.get(key) === pending) {
        this.bakedCovers.delete(key);
      }
    });
    return pending;
  }

  static imageSize(img) {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) {
      return null;
    }
    return { width, height };
  }

  static canvasContext(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    return { canvas, ctx };
  }

  static shadowSettings(options = {}) {
    return {
      shadowBlur: options.shadowBlur ?? 20,
      shadowOffsetX: options.shadowOffsetX ?? 8,
      shadowOffsetY: options.shadowOffsetY ?? 8,
      shadowColor: options.shadowColor ?? 'rgba(0, 0, 0, 0.3)',
      borderRadius: options.borderRadius ?? 8,
    };
  }

  static shadowPad(blur, offsetX, offsetY) {
    return Math.ceil(blur * 2 + Math.max(Math.abs(offsetX), Math.abs(offsetY)));
  }

  static roundedCover(img, width, height, radius) {
    const surface = this.canvasContext(width, height);
    if (!surface) {
      return null;
    }
    this.drawRoundedRect(surface.ctx, 0, 0, width, height, radius);
    surface.ctx.clip();
    surface.ctx.drawImage(img, 0, 0, width, height);
    return surface.canvas;
  }

  static paintShadow(img, settings) {
    const size = this.imageSize(img);
    if (!size) {
      return null;
    }
    const radius = Math.min(settings.borderRadius, size.width / 2, size.height / 2);
    const cover = radius > 0
      ? this.roundedCover(img, size.width, size.height, radius)
      : img;
    if (!cover) {
      return null;
    }
    const pad = this.shadowPad(settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY);
    const surface = this.canvasContext(size.width + pad * 2, size.height + pad * 2);
    if (!surface) {
      return null;
    }
    surface.ctx.shadowBlur = settings.shadowBlur;
    surface.ctx.shadowOffsetX = settings.shadowOffsetX;
    surface.ctx.shadowOffsetY = settings.shadowOffsetY;
    surface.ctx.shadowColor = settings.shadowColor;
    surface.ctx.drawImage(cover, pad, pad);
    surface.ctx.shadowBlur = 0;
    surface.ctx.shadowOffsetX = 0;
    surface.ctx.shadowOffsetY = 0;
    surface.ctx.drawImage(cover, pad, pad);
    return {
      canvas: surface.canvas,
      originX: pad,
      originY: pad,
      contentWidth: size.width,
      contentHeight: size.height,
    };
  }

  static shadowBitmap(imageUrl, settings) {
    const key = JSON.stringify([
      'shadow',
      imageUrl,
      settings.shadowBlur,
      settings.shadowOffsetX,
      settings.shadowOffsetY,
      settings.shadowColor,
      settings.borderRadius,
    ]);
    return this.bake(key, async () => {
      const img = await this.loadCover(imageUrl);
      if (!img) {
        return null;
      }
      return this.paintShadow(img, settings);
    });
  }

  static paintGlow(img, glowColor) {
    const size = this.imageSize(img);
    if (!size) {
      return null;
    }
    const blur = 30;
    const pad = this.shadowPad(blur, 0, 0);
    const surface = this.canvasContext(size.width + pad * 2, size.height + pad * 2);
    if (!surface) {
      return null;
    }
    surface.ctx.shadowBlur = blur;
    surface.ctx.shadowColor = glowColor;
    surface.ctx.shadowOffsetX = 0;
    surface.ctx.shadowOffsetY = 0;
    for (let i = 0; i < 3; i++) {
      surface.ctx.drawImage(img, pad, pad, size.width, size.height);
    }
    surface.ctx.shadowBlur = 0;
    surface.ctx.drawImage(img, pad, pad, size.width, size.height);
    return {
      canvas: surface.canvas,
      originX: pad,
      originY: pad,
      contentWidth: size.width,
      contentHeight: size.height,
    };
  }

  static glowBitmap(imageUrl, glowColor) {
    const key = JSON.stringify(['glow', imageUrl, glowColor]);
    return this.bake(key, async () => {
      const img = await this.loadCover(imageUrl);
      if (!img) {
        return null;
      }
      return this.paintGlow(img, glowColor);
    });
  }

  static paintPolaroid(img) {
    const size = this.imageSize(img);
    if (!size) {
      return null;
    }
    const padding = 20;
    const textHeight = 40;
    const cardWidth = size.width + padding * 2;
    const cardHeight = size.height + padding * 2 + textHeight;
    const pad = this.shadowPad(15, 5, 5);
    const surface = this.canvasContext(cardWidth + pad * 2, cardHeight + pad * 2);
    if (!surface) {
      return null;
    }
    const x = pad;
    const y = pad;
    surface.ctx.shadowBlur = 15;
    surface.ctx.shadowOffsetX = 5;
    surface.ctx.shadowOffsetY = 5;
    surface.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    surface.ctx.fillStyle = '#ffffff';
    surface.ctx.fillRect(x, y, cardWidth, cardHeight);
    surface.ctx.shadowBlur = 0;
    surface.ctx.shadowOffsetX = 0;
    surface.ctx.shadowOffsetY = 0;
    surface.ctx.fillRect(x, y, cardWidth, cardHeight);
    surface.ctx.drawImage(img, x + padding, y + padding, size.width, size.height);
    return {
      canvas: surface.canvas,
      originX: pad + padding,
      originY: pad + padding,
      contentWidth: size.width,
      contentHeight: size.height,
    };
  }

  static polaroidBitmap(imageUrl) {
    const key = JSON.stringify(['polaroid', imageUrl]);
    return this.bake(key, async () => {
      const img = await this.loadCover(imageUrl);
      if (!img) {
        return null;
      }
      return this.paintPolaroid(img);
    });
  }

  static applyPlacement(ctx, position) {
    if (!position.rotation && position.scale === 1) {
      return;
    }
    const centerX = position.x + position.width / 2;
    const centerY = position.y + position.height / 2;
    ctx.translate(centerX, centerY);
    if (position.rotation) {
      ctx.rotate((position.rotation * Math.PI) / 180);
    }
    if (position.scale !== 1) {
      ctx.scale(position.scale, position.scale);
    }
    ctx.translate(-centerX, -centerY);
  }

  static drawBaked(ctx, baked, position) {
    if (!baked || !baked.contentWidth || !baked.contentHeight) {
      return;
    }
    ctx.save();
    this.applyPlacement(ctx, position);
    const scaleX = position.width / baked.contentWidth;
    const scaleY = position.height / baked.contentHeight;
    ctx.drawImage(
      baked.canvas,
      position.x - baked.originX * scaleX,
      position.y - baked.originY * scaleY,
      baked.canvas.width * scaleX,
      baked.canvas.height * scaleY,
    );
    ctx.restore();
  }

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
  
  static async drawAlbumWithShadow(ctx, imageUrl, position, options = {}) {
    const settings = this.shadowSettings(options);
    const baked = await this.shadowBitmap(imageUrl, settings);
    this.drawBaked(ctx, baked, position);
  }

  static async drawAlbumWithBlendMode(ctx, imageUrl, position, blendMode = 'multiply') {
    const img = await this.loadCover(imageUrl);
    if (!img) {
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    this.applyPlacement(ctx, position);
    ctx.drawImage(img, position.x, position.y, position.width, position.height);
    ctx.restore();
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
  
  static async drawAlbumWithGlow(ctx, imageUrl, position, glowColor = '#00ffff') {
    const baked = await this.glowBitmap(imageUrl, glowColor);
    this.drawBaked(ctx, baked, position);
  }

  static async drawPolaroid(ctx, imageUrl, position) {
    const baked = await this.polaroidBitmap(imageUrl);
    this.drawBaked(ctx, baked, position);
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