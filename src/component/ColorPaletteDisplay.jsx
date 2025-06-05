import React from 'react';

export function ColorPaletteDisplay({ album, showDetails = true }) {
  if (!album?.colorAnalysis?.analyzed || !album.colorAnalysis.dominantColors) {
    return null;
  }

  const { dominantColors, mood, temperature } = album.colorAnalysis;

  // Get mood emoji and description
  const getMoodInfo = (mood) => {
    const moodMap = {
      dark: { emoji: '🌙', description: 'Dark & Mysterious' },
      light: { emoji: '☀️', description: 'Bright & Cheerful' },
      vibrant: { emoji: '🌈', description: 'Bold & Energetic' },
      muted: { emoji: '🎭', description: 'Subtle & Refined' },
      balanced: { emoji: '⚖️', description: 'Harmonious & Balanced' }
    };
    return moodMap[mood] || { emoji: '🎨', description: 'Artistic' };
  };

  // Get temperature emoji and description
  const getTemperatureInfo = (temperature) => {
    const tempMap = {
      warm: { emoji: '🔥', description: 'Warm Tones' },
      cool: { emoji: '❄️', description: 'Cool Tones' },
      neutral: { emoji: '🌿', description: 'Neutral Tones' }
    };
    return tempMap[temperature] || { emoji: '🎨', description: 'Mixed' };
  };

  const moodInfo = getMoodInfo(mood);
  const tempInfo = getTemperatureInfo(temperature);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Album Info */}
      <div className="flex items-center mb-3">
        {album.images && album.images[2] && (
          <img 
            src={album.images[2].url} 
            alt={album.name}
            className="w-12 h-12 rounded-md mr-3 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {album.name}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {album.artists?.[0]?.name}
          </p>
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-3">
        <div className="flex rounded-lg overflow-hidden h-8 shadow-sm">
          {dominantColors.map((color, index) => (
            <div
              key={index}
              className="flex-1 group relative cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: color.hex }}
              title={`${color.hex} - HSL(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%)`}
            >
              {/* Color info tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {color.hex}
              </div>
            </div>
          ))}
        </div>
        
        {/* Color values */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {dominantColors.map((color, index) => (
            <span key={index} className="text-center flex-1">
              {color.hex}
            </span>
          ))}
        </div>
      </div>

      {showDetails && (
        <>
          {/* Analysis Results */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <span className="mr-2">{moodInfo.emoji}</span>
                <span className="font-medium text-gray-700">Mood</span>
              </div>
              <div className="text-xs text-gray-600">
                {moodInfo.description}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <span className="mr-2">{tempInfo.emoji}</span>
                <span className="font-medium text-gray-700">Temperature</span>
              </div>
              <div className="text-xs text-gray-600">
                {tempInfo.description}
              </div>
            </div>
          </div>

          {/* Color Harmony Indicator */}
          <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">
                Color Harmony Score
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      i < Math.floor(dominantColors.length / 2) + 2
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Component to display multiple album palettes in a grid
export function ColorPaletteGrid({ albums, maxDisplay = 12 }) {
  const analyzedAlbums = albums.filter(album => 
    album?.colorAnalysis?.analyzed && album.colorAnalysis.dominantColors
  );

  if (analyzedAlbums.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🎨</div>
        <p>No color analysis available</p>
        <p className="text-sm">Use the "Analyze Colors" button to get started</p>
      </div>
    );
  }

  const displayAlbums = analyzedAlbums.slice(0, maxDisplay);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayAlbums.map((album, index) => (
        <ColorPaletteDisplay 
          key={album.id || index} 
          album={album} 
          showDetails={true}
        />
      ))}
      
      {analyzedAlbums.length > maxDisplay && (
        <div className="col-span-full text-center py-4 text-gray-500">
          <p className="text-sm">
            Showing {maxDisplay} of {analyzedAlbums.length} analyzed albums
          </p>
        </div>
      )}
    </div>
  );
} 