import React, { useEffect, useRef, useState } from 'react';

export function MakeCollage () {
    const canvasRef = useRef(null);

  const storedAlbums = localStorage.getItem('albums');

  console.log(JSON.parse(storedAlbums))
  const imageUrls = storedAlbums ? JSON.parse(storedAlbums).map((album) => album.images[1]?.url) : [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loadImageAndDraw = (url, x, y) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        ctx.drawImage(img, x, y, img.width, img.height); // Draw the image at specified coordinates
      };
    //   img.src = url;
    };

    const drawAllImages = () => {
      let x = 0;
      let y = 0;
      let margin = 0

      imageUrls.forEach((url) => {
        loadImageAndDraw(url, x, y);
        
        x += 300 + margin; // Move x for the next image
        if (x + 300 > canvas.width) {
          x = 0;
          y += 300 + margin; // Move to the next row if the current row is full
        }
      });
    };

    drawAllImages();
  }, [imageUrls]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">Save Your Collage</h1>
        <canvas ref={canvasRef} width={1500} height={1500} style={{ width: '50%', height: '50%' }}></canvas>
    </div>
  );
};
