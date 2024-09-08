import React, { useEffect, useRef, useState } from 'react';

export function MakeCollage () {
    const design1 = useRef(null);

    const design2 = useRef (null);
    const design3 = useRef(null);
    const isInitialMount = useRef(true);
    const [activeTab, setActiveTab] = useState(0);

  const storedAlbums = localStorage.getItem('albums');
  const imageUrls = storedAlbums ? JSON.parse(storedAlbums).map((album) => album.images[1]?.url) : [];

  const album_size = 300;
  const canvas_size = Math.ceil(Math.sqrt(imageUrls.length)) * album_size

  const loadImageAndDraw = (url, x, y, ctx) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      ctx.drawImage(img, x, y, img.width, img.height); // Draw the image at specified coordinates
    };
  };

  const vinylDraw = (url, x, y, ctx, radius) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
        // Draw the album art in the center of the vinyl
        const labelRadius = radius * 0.6; // The album art will be smaller than the vinyl
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, labelRadius, 0, 2 * Math.PI); // Clipping to a circle
        ctx.clip();
        ctx.drawImage(img, x - labelRadius, y - labelRadius, labelRadius * 2, labelRadius * 2);
        ctx.restore();
    };
};

  useEffect(() => {
    const canvas = design1.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawAllImages = () => {
      let x = 0;
      let y = 0;
      let margin = 0

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
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawAllImages = () => {

      imageUrls.forEach((url) => {
        let x = Math.random() * 1200;
        let y = Math.random() * 1200;

        loadImageAndDraw(url, x, y, ctx);
      });
    };


    drawAllImages();
  }, [imageUrls]);

  useEffect(() => {
    if (activeTab !== 0) return;

    const canvas = design3.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radius = album_size/2; // Adjust this for size of vinyl
    const margin = 0; // Space between vinyls
    let x = radius + margin;
    let y = radius + margin;

    imageUrls.forEach((url, index) => {
        // Draw the vinyl record (circle)
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#000'; // Black vinyl color
        ctx.fill();
        ctx.strokeStyle = '#333'; // Slightly lighter stroke for vinyl effect
        ctx.lineWidth = 5;
        ctx.stroke();

        // Draw the album art in the center of the vinyl
        vinylDraw(url, x, y, ctx, radius);

        // Draw small circle in the center to simulate the hole of the vinyl
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.1, 0, 2 * Math.PI); // Small hole in the middle
        ctx.fillStyle = '#222';
        ctx.fill();

        // Move to next position
        x += 2 * (radius + margin); // Adjust x position for next vinyl

        if (x + radius > canvas.width) {
            x = radius + margin;
            y += 2 * (radius + margin); // Move down if at the edge of the canvas
        }
    });
  }, [imageUrls]);

  const tabs = [
    { label: 'Design #1'},
    { label: 'Design #2'},
    { label: 'Design #3'},
    // { label: 'Design #4'},
  ];


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">Save Your Collage</h1>

        <ul className="flex border-b">
        {tabs.map((tab, index) => (
          <li key={index} className={index === 0 ? "-mb-px mr-1" : "mr-1"}>
            <a
              href="#"
              className={`
                bg-white inline-block py-2 px-4 font-semibold
                ${index === activeTab
                  ? "border-l border-t border-r rounded-t text-blue-700"
                  : index === tabs.length - 1
                    ? "text-gray-400"
                    : "text-blue-500 hover:text-blue-800"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(index);
              }}
              >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
        <canvas ref={design1} width={canvas_size} height={canvas_size} style={{ 
    width: '40%', 
    height: '40%', 
    display: activeTab !== 0 ? 'none' : 'block'
  }}></canvas> 
        <canvas ref={design2} width={canvas_size} height={canvas_size} style={{ 
    width: '40%', 
    height: '40%', 
    display: activeTab !== 1 ? 'none' : 'block'
  }}></canvas>
  <canvas ref={design3} width={canvas_size} height={canvas_size} style={{ 
    width: '40%', 
    height: '40%', 
    display: activeTab !== 2 ? 'none' : 'block'
  }}></canvas>
    </div>
  );
};
