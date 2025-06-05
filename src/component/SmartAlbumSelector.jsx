import React, { useState, useEffect } from 'react';
import { ColorAnalyzer } from '../helper/colorAnalysis.js';

export function SmartAlbumSelector({ albums, onAlbumsFiltered, onAnalysisComplete }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedTemperature, setSelectedTemperature] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [colorStats, setColorStats] = useState(null);

  // Analyze all albums for color properties
  const analyzeAlbums = async () => {
    if (!albums || albums.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const analyzedAlbums = [];
    
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      const imageUrl = album.images && album.images[1] ? album.images[1].url : null;
      
      if (imageUrl) {
        try {
          const dominantColors = await ColorAnalyzer.extractDominantColors(imageUrl, 3);
          const mood = ColorAnalyzer.classifyMood(dominantColors);
          const temperature = ColorAnalyzer.getColorTemperature(dominantColors);
          
          analyzedAlbums.push({
            ...album,
            colorAnalysis: {
              dominantColors,
              mood,
              temperature,
              analyzed: true
            }
          });
        } catch (error) {
          console.warn(`Failed to analyze album: ${album.name}`, error);
          analyzedAlbums.push({
            ...album,
            colorAnalysis: { analyzed: false }
          });
        }
      } else {
        analyzedAlbums.push({
          ...album,
          colorAnalysis: { analyzed: false }
        });
      }
      
      setAnalysisProgress(Math.round(((i + 1) / albums.length) * 100));
    }
    
    // Calculate color statistics
    const stats = calculateColorStats(analyzedAlbums);
    setColorStats(stats);
    
    setIsAnalyzing(false);
    if (onAnalysisComplete) {
      onAnalysisComplete(analyzedAlbums);
    }
  };

  // Calculate color statistics for the collection
  const calculateColorStats = (analyzedAlbums) => {
    const validAlbums = analyzedAlbums.filter(album => album.colorAnalysis?.analyzed);
    
    const moodCounts = {};
    const temperatureCounts = {};
    
    validAlbums.forEach(album => {
      const { mood, temperature } = album.colorAnalysis;
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      temperatureCounts[temperature] = (temperatureCounts[temperature] || 0) + 1;
    });
    
    return {
      totalAnalyzed: validAlbums.length,
      moods: moodCounts,
      temperatures: temperatureCounts
    };
  };
  
  // Apply smart filtering
  const applyFilters = () => {
    if (!albums) return;
    
    let filteredAlbums = [...albums];
    
    // Filter by mood and temperature
    if (selectedMood !== 'all' || selectedTemperature !== 'all') {
      filteredAlbums = ColorAnalyzer.filterCompatibleAlbums(
        filteredAlbums,
        selectedMood === 'all' ? null : selectedMood,
        selectedTemperature === 'all' ? null : selectedTemperature
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'contrast':
        filteredAlbums = ColorAnalyzer.sortByContrast(filteredAlbums);
        break;
      case 'harmony':
        // Sort by color harmony with first album
        if (filteredAlbums.length > 1 && filteredAlbums[0].colorAnalysis?.dominantColors) {
          const referenceColors = filteredAlbums[0].colorAnalysis.dominantColors;
          filteredAlbums.sort((a, b) => {
            if (!a.colorAnalysis?.dominantColors || !b.colorAnalysis?.dominantColors) return 0;
            
            const scoreA = ColorAnalyzer.calculateHarmonyScore(referenceColors, a.colorAnalysis.dominantColors);
            const scoreB = ColorAnalyzer.calculateHarmonyScore(referenceColors, b.colorAnalysis.dominantColors);
            
            return scoreB - scoreA;
          });
        }
        break;
      default:
        // Keep original order
        break;
    }
    
    if (onAlbumsFiltered) {
      onAlbumsFiltered(filteredAlbums);
    }
  };
  
  // Apply filters when selection changes
  useEffect(() => {
    applyFilters();
  }, [selectedMood, selectedTemperature, sortBy, albums]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">🎨 AI Color Analysis</h3>
        
        {!isAnalyzing && colorStats === null && (
          <button
            onClick={analyzeAlbums}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Analyze Colors
          </button>
        )}
      </div>
      
      {isAnalyzing && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Analyzing album colors...</span>
            <span className="text-sm text-gray-500">{analysisProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {colorStats && (
        <>
          {/* Color Statistics */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3">Collection Analysis ({colorStats.totalAnalyzed} albums)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Moods</h5>
                {Object.entries(colorStats.moods).map(([mood, count]) => (
                  <div key={mood} className="flex justify-between text-sm">
                    <span className="capitalize">{mood}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Temperature</h5>
                {Object.entries(colorStats.temperatures).map(([temp, count]) => (
                  <div key={temp} className="flex justify-between text-sm">
                    <span className="capitalize">{temp}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Smart Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mood Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Mood
              </label>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Moods</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="vibrant">Vibrant</option>
                <option value="muted">Muted</option>
                <option value="balanced">Balanced</option>
              </select>
            </div>
            
            {/* Temperature Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Temperature
              </label>
              <select
                value={selectedTemperature}
                onChange={(e) => setSelectedTemperature(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Temperatures</option>
                <option value="warm">Warm</option>
                <option value="cool">Cool</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smart Sorting
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="default">Default Order</option>
                <option value="contrast">High Contrast First</option>
                <option value="harmony">Color Harmony</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 