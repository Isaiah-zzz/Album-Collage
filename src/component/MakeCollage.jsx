import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LayoutAI } from '../helper/layoutAI.js';
import { VisualEffects } from '../helper/visualEffects.js';
import { AICollageService } from '../helper/aiCollageService.js';

export function MakeCollage () {
    const design1 = useRef(null);
    const design2 = useRef (null);
    const design3 = useRef(null);
    const design4 = useRef(null); // Spiral
    const design5 = useRef(null); // Force
    const isInitialMount = useRef(true);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedEffect, setSelectedEffect] = useState('clean');
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);
    const generateTimeoutRef = useRef(null);

    // Canvas size control state
    const [canvasSize, setCanvasSize] = useState('auto');
    const [customCanvasSize, setCustomCanvasSize] = useState(1800);
    const [displaySize, setDisplaySize] = useState(600);

    // Interactive editing state
    const [isEditMode, setIsEditMode] = useState(false);
    const [albumPositions, setAlbumPositions] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState(null);
    const [originalPosition, setOriginalPosition] = useState(null);

    // Debouncing for redraw operations
    const redrawTimeoutRef = useRef(null);
    const isRedrawing = useRef(false);
    const lastMoveTime = useRef(0);

    // AI-generated collage state
    const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [huggingFaceKey, setHuggingFaceKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

  const storedAlbums = localStorage.getItem('albums');
  const albums = storedAlbums ? JSON.parse(storedAlbums) : [];
  const imageUrls = albums.map((album) => album.images[1]?.url).filter(Boolean);

  const album_size = 300;
  
  // Calculate canvas size based on user preference
  const getCanvasSize = () => {
    if (canvasSize === 'auto') {
      return Math.ceil(Math.sqrt(imageUrls.length)) * album_size;
    } else if (canvasSize === 'custom') {
      return customCanvasSize;
    } else {
      return parseInt(canvasSize);
    }
  };
  
  const canvas_size = getCanvasSize();
  
  // Interactive editing utilities
  const getCanvasCoordinates = (canvas, clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const hitTestAlbum = (x, y, positions) => {
    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i];
      if (x >= pos.x && x <= pos.x + pos.width && 
          y >= pos.y && y <= pos.y + pos.height) {
        return i;
      }
    }
    return -1;
  };

  const hitTestResizeHandle = (x, y, position) => {
    const handleSize = 10;
    const handles = [
      { name: 'nw', x: position.x - handleSize/2, y: position.y - handleSize/2 },
      { name: 'ne', x: position.x + position.width - handleSize/2, y: position.y - handleSize/2 },
      { name: 'sw', x: position.x - handleSize/2, y: position.y + position.height - handleSize/2 },
      { name: 'se', x: position.x + position.width - handleSize/2, y: position.y + position.height - handleSize/2 }
    ];
    
    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize && 
          y >= handle.y && y <= handle.y + handleSize) {
        return handle.name;
      }
    }
    return null;
  };

  const drawResizeHandles = (ctx, position) => {
    const handleSize = 10;
    const handles = [
      { x: position.x - handleSize/2, y: position.y - handleSize/2 },
      { x: position.x + position.width - handleSize/2, y: position.y - handleSize/2 },
      { x: position.x - handleSize/2, y: position.y + position.height - handleSize/2 },
      { x: position.x + position.width - handleSize/2, y: position.y + position.height - handleSize/2 }
    ];
    
    ctx.save();
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
    
    ctx.restore();
  };

  const drawSelectionOutline = (ctx, position) => {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(position.x - 2, position.y - 2, position.width + 4, position.height + 4);
    ctx.restore();
  };

  const drawAILayout = useCallback(async (canvasRef, layoutType, effectType = 'shadow') => {
    if (!canvasRef.current || albums.length === 0) {
      console.log('Cannot draw layout: missing canvas or albums', { 
        canvas: !!canvasRef.current, 
        albumCount: albums.length 
      });
      return;
    }
    
    // Prevent multiple simultaneous generations
    if (isGenerating) {
      console.log('AI generation already in progress, skipping');
      return;
    }
    
    const generationKey = `${layoutType}-${effectType}-${albums.length}`;
    if (lastGenerated === generationKey) {
      console.log('Layout already generated:', generationKey);
      return;
    }
    
    // console.log(`Starting AI layout generation: ${layoutType} with ${effectType} effect`);
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply background effect (skip for clean option)
      if (effectType !== 'clean') {
        const backgroundColors = ['#667eea', '#764ba2', '#ffecd2', '#fcb69f'];
        if (layoutType === 'golden-spiral') {
          VisualEffects.applyRadialBackground(ctx, canvas.width, canvas.height, backgroundColors);
        } else {
          VisualEffects.applyGradientBackground(ctx, canvas.width, canvas.height, backgroundColors);
        }
      }
      
      // Generate layout
      console.log(`Generating ${layoutType} layout for ${albums.length} albums`);
      const positions = LayoutAI.generateLayout(layoutType, albums.length, canvas.width, canvas.height, album_size);
      
      if (!positions || positions.length === 0) {
        throw new Error(`No positions generated for layout type: ${layoutType}`);
      }
      
      console.log(`Generated ${positions.length} positions:`, positions.slice(0, 3)); // Log first 3 positions
      
      // Draw albums with selected effect - process in batches to avoid overload
      const batchSize = 3;
      let drawCount = 0;
      
      for (let i = 0; i < positions.length; i += batchSize) {
        const batch = positions.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (position) => {
          const album = albums[position.albumIndex];
          const imageUrl = album?.images[1]?.url;
          
          if (!imageUrl) {
            console.warn(`No image URL for album index ${position.albumIndex}`);
            return;
          }
          
          try {
            switch (effectType) {
              case 'shadow':
                await VisualEffects.drawAlbumWithShadow(ctx, imageUrl, position);
                break;
              case 'glow':
                const glowColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
                const glowColor = glowColors[position.albumIndex % glowColors.length];
                await VisualEffects.drawAlbumWithGlow(ctx, imageUrl, position, glowColor);
                break;
              case 'polaroid':
                await VisualEffects.drawPolaroid(ctx, imageUrl, position);
                break;
              case 'blend':
                await VisualEffects.drawAlbumWithBlendMode(ctx, imageUrl, position, 'multiply');
                break;
              case 'clean':
                // Clean style - just draw the image with subtle shadow
                await VisualEffects.drawAlbumWithShadow(ctx, imageUrl, position, {
                  shadowBlur: 8,
                  shadowOffsetX: 3,
                  shadowOffsetY: 3,
                  shadowColor: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: 4
                });
                break;
              default:
                await VisualEffects.drawAlbumWithShadow(ctx, imageUrl, position);
            }
            drawCount++;
          } catch (error) {
            console.warn('Failed to draw album:', error, { position, imageUrl });
          }
        });
        
        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent browser freezing
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log(`Successfully drew ${drawCount} albums for ${layoutType} layout`);
      
      // Save positions for interactive editing
      setAlbumPositions(positions);
      
      // Draw selection and resize handles if in edit mode
      if (isEditMode && selectedAlbum !== null && positions[selectedAlbum]) {
        drawSelectionOutline(ctx, positions[selectedAlbum]);
        drawResizeHandles(ctx, positions[selectedAlbum]);
      }
      
      // Apply post-processing effects (skip for clean option)
      if (effectType === 'vintage') {
        VisualEffects.applyVintageEffect(ctx, canvas.width, canvas.height);
      } else if (effectType === 'glow') {
        VisualEffects.applyVignette(ctx, canvas.width, canvas.height, 'rgba(0, 0, 0, 0.2)');
      }
      
      setLastGenerated(generationKey);
      // console.log(`AI layout generation complete: ${generationKey}`);
    } catch (error) {
      // console.error('AI Layout generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [albums, isGenerating, lastGenerated, isEditMode, selectedAlbum]);

  // Debounced AI generation to prevent rapid re-renders
  const debouncedDrawAI = useCallback((canvasRef, layoutType, effectType) => {
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }
    
    generateTimeoutRef.current = setTimeout(() => {
      drawAILayout(canvasRef, layoutType, effectType);
    }, 300);
  }, [drawAILayout]);

  const loadImageAndDraw = (url, x, y, ctx) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, img.width, img.height);
    };
    img.onerror = () => {
      console.warn('Failed to load image:', url);
    };
    img.src = url;
  };

  const vinylDraw = (url, x, y, ctx, radius) => {
    const img = new Image();
    img.onload = () => {
        const labelRadius = radius * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, labelRadius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, x - labelRadius, y - labelRadius, labelRadius * 2, labelRadius * 2);
        ctx.restore();
    };
    img.onerror = () => {
      console.warn('Failed to load vinyl image:', url);
    };
    img.src = url;
};

  // Original layouts (unchanged)
  useEffect(() => {
    const canvas = design1.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawAllImages = () => {
      let x = 0;
      let y = 0;
      let margin = 0;

      imageUrls.forEach((url) => {
        loadImageAndDraw(url, x, y, ctx);
        
        x += album_size + margin;
        if (x + album_size > canvas.width) {
          x = 0;
          y += album_size + margin;
        }
      });
    };

    drawAllImages();
  }, [imageUrls]);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    
    const canvas = design2.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawAllImages = () => {
      imageUrls.forEach((url) => {
        let x = Math.random() * (canvas.width - album_size);
        let y = Math.random() * (canvas.height - album_size);
        loadImageAndDraw(url, x, y, ctx);
      });
    };

    drawAllImages();
  }, [imageUrls]);

  useEffect(() => {
    if (activeTab !== 2) return;

    const canvas = design3.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radius = album_size/2;
    const margin = 0;
    let x = radius + margin;
    let y = radius + margin;

    imageUrls.forEach((url, index) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 5;
        ctx.stroke();

        vinylDraw(url, x, y, ctx, radius);

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#222';
        ctx.fill();

        x += 2 * (radius + margin);

        if (x + radius > canvas.width) {
            x = radius + margin;
            y += 2 * (radius + margin);
        }
    });
  }, [imageUrls, activeTab]);

  // AI Layout Effects - Fixed with proper dependencies and debouncing
  useEffect(() => {
    if (activeTab === 3 && albums.length > 0) {
      debouncedDrawAI(design4, 'golden-spiral', selectedEffect);
    }
  }, [activeTab, selectedEffect, albums.length, debouncedDrawAI]);

  useEffect(() => {
    if (activeTab === 4 && albums.length > 0) {
      debouncedDrawAI(design5, 'organic', selectedEffect);
    }
  }, [activeTab, selectedEffect, albums.length, debouncedDrawAI]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current);
      }
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current);
      }
    };
  }, []);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedAlbum(null);
    setIsEditMode(false);
  }, [activeTab]);

  const tabs = [
    { label: 'Grid', description: 'Classic grid layout' },
    { label: 'Random', description: 'Scattered placement' },
    { label: 'Vinyl', description: 'Vinyl record style' },
    { label: 'Spiral', description: 'Golden spiral layout' },
    { label: 'Organic', description: 'Natural force layout' },
    { label: 'Generated', description: 'Real AI collage' }
  ];

  const effects = [
    { value: 'shadow', label: 'Modern Shadows' },
    { value: 'glow', label: 'Neon Glow' },
    { value: 'polaroid', label: 'Polaroid Style' },
    { value: 'vintage', label: 'Vintage Film' },
    { value: 'blend', label: 'Artistic Blend' },
    { value: 'clean', label: 'Clean (No Background)' }
  ];

  const regenerateAI = () => {
    if (activeTab >= 3 && !isGenerating) {
      setLastGenerated(null); // Force regeneration
      const layoutTypes = ['golden-spiral', 'organic'];
      const canvasRefs = [design4, design5];
      const layoutType = layoutTypes[activeTab - 3];
      const canvasRef = canvasRefs[activeTab - 3];
      
      drawAILayout(canvasRef, layoutType, selectedEffect);
    }
  };

  // Function to redraw canvas with current positions
  const redrawWithPositions = useCallback(async (positions) => {
    if (activeTab < 3) return;
    
    const canvasRefs = [design4, design5];
    const layoutTypes = ['golden-spiral', 'organic'];
    const canvasRef = canvasRefs[activeTab - 3];
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply background if not clean
    if (selectedEffect !== 'clean') {
      const backgroundColors = ['#667eea', '#764ba2', '#ffecd2', '#fcb69f'];
      if (layoutTypes[activeTab - 3] === 'golden-spiral') {
        VisualEffects.applyRadialBackground(ctx, canvas.width, canvas.height, backgroundColors);
      } else {
        VisualEffects.applyGradientBackground(ctx, canvas.width, canvas.height, backgroundColors);
      }
    }
    
    // Draw albums at their current positions
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const album = albums[position.albumIndex];
      const imageUrl = album?.images[1]?.url;
      
      if (!imageUrl) continue;
      
      try {
        switch (selectedEffect) {
          case 'shadow':
            await VisualEffects.drawAlbumWithShadow(ctx, imageUrl, position);
            break;
          case 'glow':
            const glowColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
            const glowColor = glowColors[position.albumIndex % glowColors.length];
            await VisualEffects.drawAlbumWithGlow(ctx, imageUrl, position, glowColor);
            break;
          case 'polaroid':
            await VisualEffects.drawPolaroid(ctx, imageUrl, position);
            break;
          case 'blend':
            await VisualEffects.drawAlbumWithBlendMode(ctx, imageUrl, position, 'multiply');
            break;
          case 'clean':
            await VisualEffects.drawAlbumWithShadow(ctx, imageUrl, position, {
              shadowBlur: 8,
              shadowOffsetX: 3,
              shadowOffsetY: 3,
              shadowColor: 'rgba(0, 0, 0, 0.15)',
              borderRadius: 4
            });
            break;
          default:
            await VisualEffects.drawAlbumWithShadow(ctx, imageUrl, position);
        }
      } catch (error) {
        console.warn('Failed to draw album during interaction:', error);
      }
    }
    
    // Draw selection and handles if needed
    if (selectedAlbum !== null && positions[selectedAlbum]) {
      drawSelectionOutline(ctx, positions[selectedAlbum]);
      drawResizeHandles(ctx, positions[selectedAlbum]);
    }
    
  }, [activeTab, selectedEffect, albums, selectedAlbum]);

  // Debounced redraw function to prevent multiple copies
  const debouncedRedraw = useCallback((positions) => {
    // Clear any existing timeout
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current);
    }
    
    // Skip if already redrawing
    if (isRedrawing.current) {
      return;
    }
    
    // Set timeout for debounced redraw
    redrawTimeoutRef.current = setTimeout(async () => {
      isRedrawing.current = true;
      try {
        await redrawWithPositions(positions);
      } finally {
        isRedrawing.current = false;
      }
    }, 16); // ~60fps
  }, [redrawWithPositions]);

  // Interactive editing mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (!isEditMode || activeTab < 3) return;
    
    const canvas = e.target;
    const coords = getCanvasCoordinates(canvas, e.clientX, e.clientY);
    
    // Check if clicking on resize handle
    if (selectedAlbum !== null && albumPositions[selectedAlbum]) {
      const handle = hitTestResizeHandle(coords.x, coords.y, albumPositions[selectedAlbum]);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setOriginalPosition({ ...albumPositions[selectedAlbum] });
        setDragStart(coords);
        return;
      }
    }
    
    // Check if clicking on an album
    const hitIndex = hitTestAlbum(coords.x, coords.y, albumPositions);
    if (hitIndex !== -1) {
      setSelectedAlbum(hitIndex);
      setIsDragging(true);
      setDragStart({
        x: coords.x - albumPositions[hitIndex].x,
        y: coords.y - albumPositions[hitIndex].y
      });
      
      // Immediate redraw to show selection
      const canvasRefs = [design4, design5];
      const canvas = canvasRefs[activeTab - 3]?.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Clear any pending redraws
        if (redrawTimeoutRef.current) {
          clearTimeout(redrawTimeoutRef.current);
        }
        isRedrawing.current = false;
      }
    } else {
      setSelectedAlbum(null);
    }
  }, [isEditMode, activeTab, selectedAlbum, albumPositions]);

  const handleMouseMove = useCallback((e) => {
    if (!isEditMode || activeTab < 3) return;
    
    // Throttle mouse move events to improve performance
    const now = Date.now();
    if (now - lastMoveTime.current < 16) return; // ~60fps throttling
    lastMoveTime.current = now;
    
    const canvas = e.target;
    const coords = getCanvasCoordinates(canvas, e.clientX, e.clientY);
    
    if (isResizing && selectedAlbum !== null && originalPosition && resizeHandle) {
      const newPositions = [...albumPositions];
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      
      const minSize = 50;
      let newPos = { ...originalPosition };
      
      switch (resizeHandle) {
        case 'se': // Southeast corner
          newPos.width = Math.max(minSize, originalPosition.width + dx);
          newPos.height = Math.max(minSize, originalPosition.height + dy);
          break;
        case 'sw': // Southwest corner
          newPos.width = Math.max(minSize, originalPosition.width - dx);
          newPos.height = Math.max(minSize, originalPosition.height + dy);
          newPos.x = originalPosition.x + originalPosition.width - newPos.width;
          break;
        case 'ne': // Northeast corner
          newPos.width = Math.max(minSize, originalPosition.width + dx);
          newPos.height = Math.max(minSize, originalPosition.height - dy);
          newPos.y = originalPosition.y + originalPosition.height - newPos.height;
          break;
        case 'nw': // Northwest corner
          newPos.width = Math.max(minSize, originalPosition.width - dx);
          newPos.height = Math.max(minSize, originalPosition.height - dy);
          newPos.x = originalPosition.x + originalPosition.width - newPos.width;
          newPos.y = originalPosition.y + originalPosition.height - newPos.height;
          break;
      }
      
      newPositions[selectedAlbum] = newPos;
      setAlbumPositions(newPositions);
      
      // Redraw canvas with new positions
      debouncedRedraw(newPositions);
      
    } else if (isDragging && selectedAlbum !== null) {
      const newPositions = [...albumPositions];
      newPositions[selectedAlbum] = {
        ...newPositions[selectedAlbum],
        x: Math.max(0, coords.x - dragStart.x),
        y: Math.max(0, coords.y - dragStart.y)
      };
      setAlbumPositions(newPositions);
      
      // Redraw canvas with new positions
      debouncedRedraw(newPositions);
    }
    
    // Update cursor based on what's being hovered
    if (selectedAlbum !== null && albumPositions[selectedAlbum]) {
      const handle = hitTestResizeHandle(coords.x, coords.y, albumPositions[selectedAlbum]);
      if (handle) {
        const cursors = {
          'nw': 'nw-resize',
          'ne': 'ne-resize',
          'sw': 'sw-resize',
          'se': 'se-resize'
        };
        canvas.style.cursor = cursors[handle];
      } else if (hitTestAlbum(coords.x, coords.y, albumPositions) !== -1) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'default';
      }
    } else {
      canvas.style.cursor = hitTestAlbum(coords.x, coords.y, albumPositions) !== -1 ? 'pointer' : 'default';
    }
    
  }, [isEditMode, activeTab, isResizing, isDragging, selectedAlbum, albumPositions, originalPosition, resizeHandle, dragStart, debouncedRedraw]);

  const handleMouseUp = useCallback(() => {
    if (!isEditMode) return;
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setOriginalPosition(null);
  }, [isEditMode]);

  // AI Collage Generation Functions
  const generateAICollage = async () => {
    if (albums.length === 0) {
      setAiError('No albums available for AI generation');
      return;
    }

    setIsAIGenerating(true);
    setAiError(null);
    
    try {
      console.log('Starting AI collage generation...');
      const generatedImage = await AICollageService.generateEnhancedCollage(albums, huggingFaceKey || null);
      setAiGeneratedImage(generatedImage);
      console.log('AI collage generated successfully');
    } catch (error) {
      console.error('AI generation failed:', error);
      setAiError(error.message);
      
      // If error mentions API key, show key input
      if (error.message.includes('401') || error.message.includes('403')) {
        setShowKeyInput(true);
      }
    } finally {
      setIsAIGenerating(false);
    }
  };

  const checkAIStatus = async () => {
    try {
      const status = await AICollageService.getModelStatus();
      if (status.loading) {
        setAiError(`AI model is loading... Estimated time: ${status.estimatedTime}s`);
      }
      return status;
    } catch (error) {
      setAiError('Failed to check AI service status');
      return { loading: false, estimatedTime: 0 };
    }
  };

  const saveAPIKey = () => {
    if (huggingFaceKey.trim()) {
      localStorage.setItem('huggingface_api_key', huggingFaceKey);
      setShowKeyInput(false);
      setAiError(null);
    }
  };

  // Load saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('huggingface_api_key');
    if (savedKey) {
      setHuggingFaceKey(savedKey);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Collage
          </h1>
        </div>

        {/* Album Count Info */}
        <div className="mb-4 text-center">
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {albums.length} albums ready for collage
          </span>
        </div>

        {/* AI Controls */}
        {activeTab >= 3 && activeTab <= 4 && (
          <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Visual Effect</label>
                <select
                  value={selectedEffect}
                  onChange={(e) => setSelectedEffect(e.target.value)}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                >
                  {effects.map((effect) => (
                    <option key={effect.value} value={effect.value}>
                      {effect.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isEditMode
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {isEditMode ? 'Edit Mode ON' : 'Edit Mode OFF'}
                </button>

                <button
                  onClick={regenerateAI}
                  disabled={isGenerating}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isGenerating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 shadow-lg'
                  }`}
                >
                  {isGenerating ? '🔄 Generating...' : 'Regenerate Layout'}
                </button>
              </div>
            </div>
            
            {isEditMode && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <span className="text-lg">🎛️</span>
                  <span className="font-medium">Interactive Edit Mode Active</span>
                </div>
                <div className="text-sm text-blue-600 mt-2">
                  • Click any album to select it<br/>
                  • Drag selected albums to move them<br/>
                  • Use corner handles to resize albums<br/>
                  • Click empty space to deselect
                </div>
                {selectedAlbum !== null && (
                  <div className="mt-2 text-sm text-blue-600">
                    <strong>Selected:</strong> Album {selectedAlbum + 1} | 
                    <button 
                      onClick={() => setSelectedAlbum(null)}
                      className="ml-2 text-blue-500 hover:text-blue-700 underline"
                    >
                      Deselect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Generated Controls */}
        {activeTab === 5 && (
          <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Enhanced AI Collage Generation</h3>
                <p className="text-gray-600">AI analyzes your album covers and creates personalized artwork</p>
              </div>

              {showKeyInput && (
                <div className="w-full max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hugging Face API Key (Required for reliable generation)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={huggingFaceKey}
                      onChange={(e) => setHuggingFaceKey(e.target.value)}
                      placeholder="hf_..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={saveAPIKey}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <p className="mb-1"><strong>Get your free API key:</strong></p>
                    <p>1. Visit <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer" className="text-blue-500">huggingface.co/join</a></p>
                    <p>2. Go to Settings → Access Tokens</p>
                    <p>3. Create a new token with "Read" permissions</p>
                    <p>4. Copy and paste it above</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={generateAICollage}
                  disabled={isAIGenerating || albums.length === 0}
                  className={`px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                    isAIGenerating || albums.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white transform hover:scale-105 shadow-lg'
                  }`}
                >
                  {isAIGenerating ? 'AI Generating...' : 'Generate AI Collage'}
                </button>

                <button
                  onClick={() => setShowKeyInput(true)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {huggingFaceKey ? 'Update' : 'Add'} API Key
                </button>
              </div>

              {aiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center max-w-md">
                  <strong>Error:</strong> {aiError}
                  {aiError.includes('Authentication') && (
                    <div className="mt-2 text-sm">
                      <button 
                        onClick={() => setShowKeyInput(true)}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Click here to add your API key
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas Size Controls */}
        <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Canvas Size</label>
              <select
                value={canvasSize}
                onChange={(e) => setCanvasSize(e.target.value)}
                disabled={isGenerating}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="auto">Auto (based on albums)</option>
                <option value="1200">1200 × 1200 (Small)</option>
                <option value="1800">1800 × 1800 (Medium)</option>
                <option value="2400">2400 × 2400 (Large)</option>
                <option value="3600">3600 × 3600 (Extra Large)</option>
                <option value="custom">Custom Size</option>
              </select>
            </div>

            {canvasSize === 'custom' && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Custom Size (px)</label>
                <input
                  type="number"
                  min="600"
                  max="6000"
                  step="100"
                  value={customCanvasSize}
                  onChange={(e) => setCustomCanvasSize(Math.max(600, Math.min(6000, parseInt(e.target.value) || 1800)))}
                  disabled={isGenerating}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Display Size (px)</label>
              <select
                value={displaySize}
                onChange={(e) => setDisplaySize(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="400">400 × 400 (Small)</option>
                <option value="600">600 × 600 (Medium)</option>
                <option value="800">800 × 800 (Large)</option>
                <option value="1000">1000 × 1000 (Extra Large)</option>
              </select>
            </div>

            <div className="flex flex-col text-center">
              <div className="text-sm font-medium text-gray-700 mb-1">Current Resolution</div>
              <div className="text-lg font-bold text-blue-600">{canvas_size} × {canvas_size}</div>
              <div className="text-xs text-gray-500">
                {canvasSize === 'auto' ? `Auto (${Math.ceil(Math.sqrt(imageUrls.length))}² grid)` : 'Custom'}
              </div>
            </div>
          </div>
        </div>

        {/* Layout Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              disabled={isGenerating && index >= 3}
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 transform ${
                index === activeTab
                  ? "bg-emerald-500 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              <div className="text-center">
                <div className="font-bold text-sm">{tab.label}</div>
                {/* <div className="text-xs opacity-75 mt-1">{tab.description}</div> */}
              </div>
            </button>
          ))}
        </div>

        {/* Canvas Display */}
        <div className="relative mb-8">
          {isGenerating && activeTab >= 3 && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-xl">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">↺</div>
              </div>
            </div>
          )}

        <canvas ref={design1} width={canvas_size} height={canvas_size} style={{ 
            width: `${displaySize}px`, 
            height: `${displaySize}px`, 
            display: activeTab !== 0 ? 'none' : 'block',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
  }}></canvas> 

        <canvas ref={design2} width={canvas_size} height={canvas_size} style={{ 
            width: `${displaySize}px`, 
            height: `${displaySize}px`, 
            display: activeTab !== 1 ? 'none' : 'block',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
  }}></canvas>

  <canvas ref={design3} width={canvas_size} height={canvas_size} style={{ 
            width: `${displaySize}px`, 
            height: `${displaySize}px`, 
            display: activeTab !== 2 ? 'none' : 'block',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
  }}></canvas>

          <canvas ref={design4} width={canvas_size} height={canvas_size} style={{ 
            width: `${displaySize}px`, 
            height: `${displaySize}px`, 
            display: activeTab !== 3 ? 'none' : 'block',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ></canvas>

          <canvas ref={design5} width={canvas_size} height={canvas_size} style={{ 
            width: `${displaySize}px`, 
            height: `${displaySize}px`, 
            display: activeTab !== 4 ? 'none' : 'block',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ></canvas>



          {/* AI Generated Image Display */}
          {activeTab === 5 && (
            <div style={{ 
              width: `${displaySize}px`, 
              height: `${displaySize}px`, 
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb'
            }}>
              {isAIGenerating ? (
                <div className="text-center">
                  <div className="animate-spin text-6xl mb-4">🤖</div>
                  <div className="text-xl font-medium text-gray-700">AI Analyzing Your Albums...</div>
                  <div className="text-sm text-gray-500 mt-2">
                    • Extracting colors from album covers<br/>
                    • Analyzing genres and artists<br/>
                    • Detecting visual moods and eras<br/>
                    • Generating personalized artwork
                  </div>
                  <div className="text-xs text-gray-400 mt-3">This may take 30-90 seconds</div>
                </div>
              ) : aiGeneratedImage ? (
                <img 
                  src={aiGeneratedImage} 
                  alt="AI Generated Collage"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🎨</div>
                  <div className="text-lg font-medium">Click "Generate AI Collage" to create</div>
                  <div className="text-sm mt-2">AI will analyze your {albums.length} albums</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Download Button */}
        <button 
          onClick={() => {
            if (activeTab === 5 && aiGeneratedImage) {
              // Download AI-generated image
              const link = document.createElement('a');
              link.download = `ai-generated-collage-${Date.now()}.png`;
              link.href = aiGeneratedImage;
              link.click();
            } else {
              // Download canvas-based collage
              const canvases = [design1, design2, design3, design4, design5];
              const canvas = canvases[activeTab].current;
              if (canvas) {
                const link = document.createElement('a');
                link.download = `ai-collage-${tabs[activeTab].label.toLowerCase()}-${selectedEffect}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }
          }}
          disabled={isGenerating || isAIGenerating || (activeTab === 5 && !aiGeneratedImage)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>
            {activeTab === 5 
              ? (aiGeneratedImage ? 'Download Collage' : 'Generate AI Collage First')
              : 'Download Collage'
            }
          </span>
        </button>

        {/* Info Panel */}
        {/* <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-4xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 AI Layout Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-700 mb-2">🌀 Golden Spiral</div>
              <div className="text-gray-600">Natural spiral layout based on fibonacci sequences found in nature</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-700 mb-2">🌿 Organic Layout</div>
              <div className="text-gray-600">Force-directed algorithm creates natural, non-overlapping arrangements</div>
            </div>
          </div>
          
          <h4 className="text-lg font-bold text-gray-800 mb-3">🎛️ Interactive Editing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-700 mb-2">🖱️ Drag & Drop</div>
              <div className="text-gray-600">Click and drag any album to reposition it anywhere on the canvas</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="font-semibold text-indigo-700 mb-2">🔄 Resize Albums</div>
              <div className="text-gray-600">Use corner handles to dynamically resize selected albums in real-time</div>
            </div>
          </div>

          <h4 className="text-lg font-bold text-gray-800 mb-3">🤖 Enhanced AI Generation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-cyan-50 rounded-lg">
              <div className="font-semibold text-cyan-700 mb-2">🎨 Album Analysis</div>
              <div className="text-gray-600">AI extracts colors, analyzes genres, and detects visual moods from your actual album covers</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <div className="font-semibold text-pink-700 mb-2">✨ Personalized Artwork</div>
              <div className="text-gray-600">Creates unique collages incorporating artist names, eras, and authentic color palettes</div>
            </div>
          </div>
        </div> */}
    </div>
  );
};
