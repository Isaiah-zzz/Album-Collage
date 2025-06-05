// Color Analysis Utility for AI Collage Generation
export class ColorAnalyzer {
  
  // Extract dominant colors from an image URL
  static async extractDominantColors(imageUrl, numColors = 5) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize image for faster processing
        const maxSize = 100;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = this.getColorPalette(imageData.data, numColors);
          resolve(colors);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
  
  // K-means clustering to find dominant colors
  static getColorPalette(imageData, k) {
    const pixels = [];
    
    // Sample pixels (every 4th pixel for performance)
    for (let i = 0; i < imageData.length; i += 16) {
      pixels.push([
        imageData[i],     // R
        imageData[i + 1], // G
        imageData[i + 2]  // B
      ]);
    }
    
    return this.kMeansColors(pixels, k);
  }
  
  // Simplified k-means clustering for color extraction
  static kMeansColors(pixels, k) {
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push([...randomPixel]);
    }
    
    // Run k-means iterations
    for (let iter = 0; iter < 10; iter++) {
      const clusters = new Array(k).fill(null).map(() => []);
      
      // Assign pixels to nearest centroid
      pixels.forEach(pixel => {
        let minDistance = Infinity;
        let closestCentroid = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = this.colorDistance(pixel, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = index;
          }
        });
        
        clusters[closestCentroid].push(pixel);
      });
      
      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0]; // Fallback
        
        const sum = cluster.reduce((acc, pixel) => [
          acc[0] + pixel[0],
          acc[1] + pixel[1],
          acc[2] + pixel[2]
        ], [0, 0, 0]);
        
        return [
          Math.round(sum[0] / cluster.length),
          Math.round(sum[1] / cluster.length),
          Math.round(sum[2] / cluster.length)
        ];
      });
    }
    
    return centroids.map(color => ({
      rgb: color,
      hex: this.rgbToHex(color[0], color[1], color[2]),
      hsl: this.rgbToHsl(color[0], color[1], color[2])
    }));
  }
  
  // Calculate color distance (Euclidean)
  static colorDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
      Math.pow(color1[1] - color2[1], 2) +
      Math.pow(color1[2] - color2[2], 2)
    );
  }
  
  // Convert RGB to Hex
  static rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  
  // Convert RGB to HSL
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  
  // Calculate color harmony score between two color palettes
  static calculateHarmonyScore(palette1, palette2) {
    let totalScore = 0;
    let comparisons = 0;
    
    palette1.forEach(color1 => {
      palette2.forEach(color2 => {
        const harmony = this.getColorHarmonyType(color1.hsl, color2.hsl);
        totalScore += harmony.score;
        comparisons++;
      });
    });
    
    return totalScore / comparisons;
  }
  
  // Determine color harmony type and score
  static getColorHarmonyType(hsl1, hsl2) {
    const hueDiff = Math.abs(hsl1[0] - hsl2[0]);
    const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
    
    // Different harmony types with scores
    if (normalizedDiff < 15) {
      return { type: 'monochromatic', score: 0.9 };
    } else if (normalizedDiff >= 15 && normalizedDiff <= 45) {
      return { type: 'analogous', score: 0.8 };
    } else if (normalizedDiff >= 135 && normalizedDiff <= 225) {
      return { type: 'complementary', score: 0.95 };
    } else if (normalizedDiff >= 105 && normalizedDiff <= 135) {
      return { type: 'triadic', score: 0.85 };
    } else {
      return { type: 'split-complementary', score: 0.7 };
    }
  }
  
  // Classify album mood based on colors
  static classifyMood(colorPalette) {
    const avgLightness = colorPalette.reduce((sum, color) => sum + color.hsl[2], 0) / colorPalette.length;
    const avgSaturation = colorPalette.reduce((sum, color) => sum + color.hsl[1], 0) / colorPalette.length;
    
    if (avgLightness < 30) return 'dark';
    if (avgLightness > 70) return 'light';
    if (avgSaturation > 60) return 'vibrant';
    if (avgSaturation < 20) return 'muted';
    return 'balanced';
  }
  
  // Get color temperature (warm/cool)
  static getColorTemperature(colorPalette) {
    const warmHues = colorPalette.filter(color => {
      const hue = color.hsl[0];
      return (hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360);
    }).length;
    
    const coolHues = colorPalette.filter(color => {
      const hue = color.hsl[0];
      return hue >= 180 && hue <= 240;
    }).length;
    
    if (warmHues > coolHues) return 'warm';
    if (coolHues > warmHues) return 'cool';
    return 'neutral';
  }
  
  // Smart album filtering based on color compatibility
  static filterCompatibleAlbums(albums, targetMood = null, targetTemperature = null) {
    return albums.filter(album => {
      if (!album.colorAnalysis) return true; // Include if not analyzed yet
      
      if (targetMood && album.colorAnalysis.mood !== targetMood) return false;
      if (targetTemperature && album.colorAnalysis.temperature !== targetTemperature) return false;
      
      return true;
    });
  }
  
  // Sort albums by visual contrast for better composition
  static sortByContrast(albums) {
    return albums.sort((a, b) => {
      if (!a.colorAnalysis || !b.colorAnalysis) return 0;
      
      const contrastA = this.calculateContrast(a.colorAnalysis.dominantColors);
      const contrastB = this.calculateContrast(b.colorAnalysis.dominantColors);
      
      return contrastB - contrastA; // Higher contrast first
    });
  }
  
  // Calculate contrast within a color palette
  static calculateContrast(colorPalette) {
    if (colorPalette.length < 2) return 0;
    
    let maxContrast = 0;
    for (let i = 0; i < colorPalette.length; i++) {
      for (let j = i + 1; j < colorPalette.length; j++) {
        const contrast = Math.abs(colorPalette[i].hsl[2] - colorPalette[j].hsl[2]);
        maxContrast = Math.max(maxContrast, contrast);
      }
    }
    
    return maxContrast;
  }
} 