// AI Collage Service using Hugging Face Inference API
export class AICollageService {
  
  static API_BASE = 'https://api-inference.huggingface.co/models';
  static MODEL = 'stabilityai/stable-diffusion-xl-base-1.0'; // Free SDXL model
  static FALLBACK_MODEL = 'runwayml/stable-diffusion-v1-5'; // More accessible fallback
  
  // Convert image URL to base64
  static async imageUrlToBase64(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      return null;
    }
  }
  
  // Create collage description from album data
  static createCollagePrompt(albums) {
    console.log('Creating enhanced prompt from albums:', albums);
    
    // Extract detailed album information
    const albumDetails = albums.map(album => {
      const artistName = album.artists?.[0]?.name || 'Unknown Artist';
      const albumName = album.name || 'Unknown Album';
      const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null;
      
      // Enhanced genre detection
      const genres = this.detectGenres(albumName, artistName);
      const era = this.detectEra(releaseYear);
      const mood = this.detectMood(albumName, artistName);
      
      return {
        artist: artistName,
        album: albumName,
        year: releaseYear,
        genres: genres,
        era: era,
        mood: mood,
        imageUrl: album.images?.[1]?.url || album.images?.[0]?.url
      };
    });
    
    // Analyze the collection
    const allGenres = [...new Set(albumDetails.flatMap(detail => detail.genres))];
    const allMoods = [...new Set(albumDetails.map(detail => detail.mood))];
    const eras = [...new Set(albumDetails.map(detail => detail.era).filter(Boolean))];
    const artistNames = albumDetails.map(detail => detail.artist);
    
    // Create artist-specific styling hints
    const artistStyles = this.getArtistStyleHints(artistNames);
    const colorPalette = this.getGenreColorPalette(allGenres);
    
    // Build comprehensive prompt
    const basePrompt = `Create a abstract artwork featuring ${albums.length} album covers with their exact album covers with the following characteristics:

ARTISTS & ALBUMS:
${albumDetails.map((detail, i) => 
  `${i+1}. "${detail.album}" by ${detail.artist}${detail.year ? ` (${detail.year})` : ''}`
).join('\n')}

MUSICAL STYLE: ${allGenres.slice(0, 4).join(', ')} music collection
AESTHETIC MOOD: ${allMoods.slice(0, 3).join(', ')} atmosphere
TIME PERIOD: ${eras.length > 0 ? eras.join(' and ') + ' era' : 'diverse timeline'}
VISUAL STYLE: ${artistStyles.join(', ')}

COLOR PALETTE: ${colorPalette.primary} with accents of ${colorPalette.secondary.join(', ')}
COMPOSITION: Dynamic gallery wall arrangement, overlapping elements, artistic depth
QUALITY: Professional music poster design, high detail, rich colors, museum quality`;

    console.log('Generated enhanced prompt:', basePrompt);
    return basePrompt;
  }
  
  // Enhanced genre detection
  static detectGenres(albumName, artistName) {
    const text = `${albumName} ${artistName}`.toLowerCase();
    const genres = [];
    
    // Rock subgenres
    if (text.match(/\b(rock|metal|punk|grunge|alternative|indie|hardcore)\b/)) {
      if (text.includes('metal')) genres.push('metal');
      else if (text.includes('punk')) genres.push('punk rock');
      else if (text.includes('indie')) genres.push('indie rock');
      else genres.push('rock');
    }
    
    // Electronic music
    if (text.match(/\b(electronic|techno|house|edm|synth|electro|ambient|trance)\b/)) {
      if (text.includes('ambient')) genres.push('ambient electronic');
      else if (text.includes('synth')) genres.push('synthwave');
      else genres.push('electronic');
    }
    
    // Hip-hop and R&B
    if (text.match(/\b(hip.?hop|rap|r&b|rnb|soul|funk)\b/)) {
      if (text.includes('soul')) genres.push('soul');
      else if (text.includes('funk')) genres.push('funk');
      else genres.push('hip-hop');
    }
    
    // Pop and mainstream
    if (text.match(/\b(pop|mainstream|chart|hit|single)\b/)) {
      genres.push('pop');
    }
    
    // Jazz and blues
    if (text.match(/\b(jazz|blues|swing|bebop|fusion)\b/)) {
      if (text.includes('blues')) genres.push('blues');
      else genres.push('jazz');
    }
    
    // Folk and country
    if (text.match(/\b(folk|country|americana|bluegrass|acoustic)\b/)) {
      if (text.includes('country')) genres.push('country');
      else genres.push('folk');
    }
    
    // Classical and orchestral
    if (text.match(/\b(classical|orchestra|symphony|concerto|opera|chamber)\b/)) {
      genres.push('classical');
    }
    
    // World music
    if (text.match(/\b(world|ethnic|traditional|tribal|global)\b/)) {
      genres.push('world music');
    }
    
    return genres.length > 0 ? genres : ['contemporary music'];
  }
  
  // Detect musical era/decade
  static detectEra(year) {
    if (!year) return null;
    
    if (year >= 2020) return '2020s modern';
    if (year >= 2010) return '2010s contemporary';
    if (year >= 2000) return '2000s millennium';
    if (year >= 1990) return '90s alternative';
    if (year >= 1980) return '80s new wave';
    if (year >= 1970) return '70s classic rock';
    if (year >= 1960) return '60s psychedelic';
    if (year >= 1950) return '50s vintage';
    return 'retro vintage';
  }
  
  // Detect mood from album/artist names
  static detectMood(albumName, artistName) {
    const text = `${albumName} ${artistName}`.toLowerCase();
    
    if (text.match(/\b(dark|black|death|doom|shadow|night|noir)\b/)) return 'dark';
    if (text.match(/\b(bright|light|sun|gold|yellow|happy|joy)\b/)) return 'bright';
    if (text.match(/\b(red|fire|blood|passion|intense|power)\b/)) return 'intense';
    if (text.match(/\b(blue|ocean|water|cool|calm|peace)\b/)) return 'cool';
    if (text.match(/\b(green|nature|earth|organic|natural)\b/)) return 'organic';
    if (text.match(/\b(dream|ethereal|ambient|space|cosmic)\b/)) return 'ethereal';
    if (text.match(/\b(raw|rough|street|urban|gritty)\b/)) return 'gritty';
    if (text.match(/\b(soft|gentle|quiet|whisper|tender)\b/)) return 'gentle';
    
    return 'dynamic';
  }
  
  // Get artist-specific visual style hints
  static getArtistStyleHints(artistNames) {
    const styles = [];
    const text = artistNames.join(' ').toLowerCase();
    
    // Add style hints based on famous artists or common patterns
    if (text.match(/\b(beatles|stones|led zeppelin|pink floyd)\b/)) {
      styles.push('classic album art aesthetic');
    }
    if (text.match(/\b(radiohead|tool|nine inch nails)\b/)) {
      styles.push('progressive conceptual design');
    }
    if (text.match(/\b(taylor|ariana|billie|drake)\b/)) {
      styles.push('modern pop visual styling');
    }
    if (text.match(/\b(metallica|slayer|iron maiden)\b/)) {
      styles.push('heavy metal artwork style');
    }
    
    // Default sophisticated styles
    if (styles.length === 0) {
      styles.push('sophisticated album cover design', 'artistic typography', 'professional music photography');
    }
    
    return styles;
  }
  
  // Get color palette based on genres
  static getGenreColorPalette(genres) {
    const genreText = genres.join(' ').toLowerCase();
    
    if (genreText.includes('metal') || genreText.includes('punk')) {
      return {
        primary: 'deep blacks and metallic silver',
        secondary: ['electric red', 'stark white', 'industrial gray']
      };
    }
    if (genreText.includes('electronic') || genreText.includes('synthwave')) {
      return {
        primary: 'neon blues and electric purple',
        secondary: ['hot pink', 'cyber green', 'digital white']
      };
    }
    if (genreText.includes('jazz') || genreText.includes('blues')) {
      return {
        primary: 'warm golden yellow and deep blue',
        secondary: ['rich brown', 'vintage cream', 'smoky gray']
      };
    }
    if (genreText.includes('folk') || genreText.includes('country')) {
      return {
        primary: 'earthy brown and forest green',
        secondary: ['rustic orange', 'cream white', 'vintage red']
      };
    }
    if (genreText.includes('pop')) {
      return {
        primary: 'vibrant rainbow spectrum',
        secondary: ['hot pink', 'electric blue', 'sunny yellow']
      };
    }
    
    // Default sophisticated palette
    return {
      primary: 'rich jewel tones',
      secondary: ['deep purple', 'emerald green', 'golden amber']
    };
  }
  
  // Generate AI collage using Hugging Face
  static async generateAICollage(albums, apiKey = null) {
    if (!albums || albums.length === 0) {
      throw new Error('No albums provided for AI generation');
    }
    
    console.log(`Starting AI collage generation for ${albums.length} albums`);
    
    // Try primary model first, then fallback
    try {
      return await this.tryGenerateWithModel(albums, this.MODEL, apiKey);
    } catch (primaryError) {
      console.log('Primary model failed, trying fallback model...');
      try {
        return await this.tryGenerateWithModel(albums, this.FALLBACK_MODEL, apiKey);
      } catch (fallbackError) {
        console.error('Both models failed:', { primaryError, fallbackError });
        throw new Error(`AI generation failed. ${primaryError.message}`);
      }
    }
  }
  
  // Try generating with a specific model
  static async tryGenerateWithModel(albums, modelName, apiKey = null, customPrompt = null) {
    try {
      // Create the prompt
      const prompt = customPrompt || this.createCollagePrompt(albums);
      console.log('Generated prompt:', prompt);
      console.log('Using model:', modelName);
      
      // Prepare headers - only add Authorization if we have a key
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        console.log('Using API key for authentication');
      } else {
        console.log('No API key provided, using free tier');
      }
      
      console.log('Making request to Hugging Face API...');
      
      const response = await fetch(`${this.API_BASE}/${modelName}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, bad composition, text, watermark",
            num_inference_steps: apiKey ? 100 : 20, // More steps if we have API key
            guidance_scale: 7.5,
            width: apiKey ? 1024 : 512, // Higher res if we have API key
            height: apiKey ? 1024 : 512
          }
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication failed. Please add a valid Hugging Face API key.');
        } else if (response.status === 503) {
          // Model is loading
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.estimated_time) {
              throw new Error(`AI model is loading. Please wait ${errorJson.estimated_time} seconds and try again.`);
            }
          } catch (e) {
            // If parsing fails, use generic message
          }
          throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again, or add an API key for unlimited access.');
        }
        
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
      }
      
      // Get the generated image blob
      const imageBlob = await response.blob();
      
      // Check if we actually got an image
      if (imageBlob.size === 0) {
        throw new Error('Received empty response from AI service. Please try again.');
      }
      
      console.log('Successfully generated AI image, size:', imageBlob.size);
      
      // Convert to data URL for display
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
      
    } catch (error) {
      console.error('AI collage generation failed with model', modelName, ':', error);
      throw error;
    }
  }
  
  // Alternative: Generate with album cover analysis
  static async generateWithAlbumAnalysis(albums, apiKey = null) {
    console.log('Analyzing album covers for AI generation...');
    
    // Analyze dominant colors from album covers
    const colorAnalysis = await this.analyzeAlbumColors(albums);
    
    // Create enhanced prompt with color information
    const enhancedPrompt = `${this.createCollagePrompt(albums)}
Dominant colors: ${colorAnalysis.dominantColors.join(', ')}.
Mood: ${colorAnalysis.mood}. 
Style inspiration: album cover art, music poster design.`;
    
    console.log('Enhanced prompt with color analysis:', enhancedPrompt);
    
    return this.generateAICollage(albums, apiKey);
  }
  
  // Analyze dominant colors from album covers
  static async analyzeAlbumColors(albums) {
    console.log('Analyzing colors from actual album covers...');
    
    const colorPromises = albums.map(async (album) => {
      const imageUrl = album.images?.[1]?.url || album.images?.[0]?.url;
      if (!imageUrl) return null;
      
      try {
        return await this.extractImageColors(imageUrl);
      } catch (error) {
        console.warn('Failed to analyze colors for album:', album.name);
        return null;
      }
    });
    
    const colorResults = await Promise.all(colorPromises);
    const validColors = colorResults.filter(Boolean);
    
    if (validColors.length > 0) {
      // Analyze the collection's overall color palette
      const allColors = validColors.flatMap(result => result.colors);
      const dominantHues = this.analyzeDominantHues(allColors);
      const overallMood = this.analyzeColorMood(allColors);
      
      return {
        dominantColors: dominantHues,
        mood: overallMood,
        analysisCount: validColors.length,
        totalAlbums: albums.length
      };
    }
    
    // Fallback to simple analysis
    const colors = ['vibrant blue', 'deep red', 'golden yellow', 'forest green', 'royal purple'];
    const moods = ['energetic', 'mellow', 'dramatic', 'uplifting', 'mysterious'];
    
    return {
      dominantColors: colors.slice(0, Math.min(3, albums.length)),
      mood: moods[Math.floor(Math.random() * moods.length)],
      analysisCount: 0,
      totalAlbums: albums.length
    };
  }

  // Extract colors from album cover image
  static async extractImageColors(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize for performance
          const size = 100;
          canvas.width = size;
          canvas.height = size;
          
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;
          
          // Sample pixels and extract colors
          const colors = [];
          for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            if (alpha > 128) { // Skip transparent pixels
              colors.push({ r, g, b });
            }
          }
          
          // Analyze colors
          const dominantColors = this.findDominantColors(colors);
          resolve({
            colors: dominantColors,
            url: imageUrl
          });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  // Find dominant colors using simple clustering
  static findDominantColors(colors, maxColors = 5) {
    if (colors.length === 0) return [];
    
    // Simple color grouping by brightness and hue
    const colorGroups = {};
    
    colors.forEach(color => {
      const brightness = Math.round((color.r + color.g + color.b) / 3 / 25.5) * 25.5;
      const dominantChannel = Math.max(color.r, color.g, color.b);
      let hue = 'neutral';
      
      if (dominantChannel === color.r && color.r > color.g + 30 && color.r > color.b + 30) hue = 'red';
      else if (dominantChannel === color.g && color.g > color.r + 30 && color.g > color.b + 30) hue = 'green';
      else if (dominantChannel === color.b && color.b > color.r + 30 && color.b > color.g + 30) hue = 'blue';
      else if (color.r > 150 && color.g > 150 && color.b < 100) hue = 'yellow';
      else if (color.r > 150 && color.b > 150 && color.g < 100) hue = 'purple';
      else if (color.g > 150 && color.b > 150 && color.r < 100) hue = 'cyan';
      
      const key = `${hue}_${brightness}`;
      if (!colorGroups[key]) colorGroups[key] = [];
      colorGroups[key].push(color);
    });
    
    // Get most common color groups
    const sortedGroups = Object.entries(colorGroups)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, maxColors);
    
    return sortedGroups.map(([key, groupColors]) => {
      const [hue, brightness] = key.split('_');
      return {
        hue,
        brightness: parseInt(brightness),
        count: groupColors.length,
        sample: groupColors[0]
      };
    });
  }

  // Analyze dominant hues across all albums
  static analyzeDominantHues(colorData) {
    const hueCount = {};
    
    colorData.forEach(colorGroup => {
      colorGroup.forEach(color => {
        const hue = color.hue;
        hueCount[hue] = (hueCount[hue] || 0) + color.count;
      });
    });
    
    const sortedHues = Object.entries(hueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hue]) => this.hueToColorName(hue));
    
    return sortedHues;
  }

  // Convert hue to descriptive color name
  static hueToColorName(hue) {
    const colorNames = {
      red: 'passionate red',
      blue: 'deep blue', 
      green: 'vibrant green',
      yellow: 'golden yellow',
      purple: 'royal purple',
      cyan: 'electric cyan',
      neutral: 'sophisticated neutral'
    };
    
    return colorNames[hue] || 'rich color';
  }

  // Analyze overall mood from colors
  static analyzeColorMood(colorData) {
    let totalBrightness = 0;
    let totalColors = 0;
    let warmColors = 0;
    let coolColors = 0;
    
    colorData.forEach(colorGroup => {
      colorGroup.forEach(color => {
        totalBrightness += color.brightness * color.count;
        totalColors += color.count;
        
        if (['red', 'yellow', 'orange'].includes(color.hue)) {
          warmColors += color.count;
        } else if (['blue', 'green', 'purple', 'cyan'].includes(color.hue)) {
          coolColors += color.count;
        }
      });
    });
    
    const avgBrightness = totalBrightness / totalColors;
    const warmRatio = warmColors / totalColors;
    
    if (avgBrightness > 180 && warmRatio > 0.6) return 'bright and energetic';
    if (avgBrightness < 80 && coolColors > warmColors) return 'dark and moody';
    if (warmRatio > 0.7) return 'warm and passionate';
    if (coolColors > warmColors * 1.5) return 'cool and atmospheric';
    if (avgBrightness > 150) return 'vibrant and dynamic';
    
    return 'balanced and sophisticated';
  }

  // Enhanced generation with actual album analysis
  static async generateEnhancedCollage(albums, apiKey = null) {
    console.log('Starting enhanced AI collage generation with album analysis...');
    
    try {
      // Analyze actual album covers
      const colorAnalysis = await this.analyzeAlbumColors(albums);
      
      // Create enhanced prompt with real data
      const basePrompt = this.createCollagePrompt(albums);
      const enhancedPrompt = `${basePrompt}

REAL ALBUM ANALYSIS:
Color Analysis: Based on ${colorAnalysis.analysisCount}/${colorAnalysis.totalAlbums} album covers analyzed
Dominant Colors: ${colorAnalysis.dominantColors.join(', ')}
Visual Mood: ${colorAnalysis.mood}

ARTISTIC DIRECTION: Create a collage that reflects the actual visual aesthetic of these specific albums, incorporating their real color palettes and artistic styles. The composition should feel authentic to this particular music collection.`;

      console.log('Enhanced prompt with real album analysis:', enhancedPrompt);
      
      // Use the enhanced prompt for generation
      return await this.tryGenerateWithModel(albums, this.MODEL, apiKey, enhancedPrompt);
      
    } catch (error) {
      console.warn('Enhanced analysis failed, falling back to standard generation:', error);
      return await this.generateAICollage(albums, apiKey);
    }
  }
  
  // Check if Hugging Face API is available
  static async checkAPIHealth() {
    try {
      const response = await fetch(`${this.API_BASE}/${this.MODEL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: "test" })
      });
      
      return response.status !== 403; // 403 means no API key, but service is up
    } catch (error) {
      return false;
    }
  }
  
  // Get model loading status
  static async getModelStatus() {
    try {
      const response = await fetch(`${this.API_BASE}/${this.MODEL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: "test" })
      });
      
      if (response.status === 503) {
        const result = await response.json();
        return {
          loading: true,
          estimatedTime: result.estimated_time || 30
        };
      }
      
      return { loading: false, estimatedTime: 0 };
    } catch (error) {
      return { loading: false, estimatedTime: 0 };
    }
  }
}

// Export utility functions
export const generateAICollage = AICollageService.generateAICollage.bind(AICollageService);
export const checkAPIHealth = AICollageService.checkAPIHealth.bind(AICollageService);
export const getModelStatus = AICollageService.getModelStatus.bind(AICollageService); 