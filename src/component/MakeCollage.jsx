import React, { useEffect, useRef, useState } from 'react';

export function MakeCollage () {
    const design1 = useRef(null);

    const design2 = useRef (null)
    const isInitialMount = useRef(true);
    const [activeTab, setActiveTab] = useState(0);

  const storedAlbums = localStorage.getItem('albums');
  const imageUrls = storedAlbums ? JSON.parse(storedAlbums).map((album) => album.images[1]?.url) : [];

  const loadImageAndDraw = (url, x, y, ctx) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      ctx.drawImage(img, x, y, img.width, img.height); // Draw the image at specified coordinates
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
        
        x += 300 + margin;
        if (x + 300 > canvas.width) {
          x = 0;
          y += 300 + margin;
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

  const tabs = [
    { label: 'Design #1'},
    { label: 'Design #2'},
    { label: 'Design #3'},
    { label: 'Design #4'},
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
        <canvas ref={design1} width={1500} height={1500} style={{ 
    width: '40%', 
    height: '40%', 
    display: activeTab !== 0 ? 'none' : 'block'
  }}></canvas> 
        <canvas ref={design2} width={1500} height={1500} style={{ 
    width: '40%', 
    height: '40%', 
    display: activeTab !== 1 ? 'none' : 'block'
  }}></canvas>
    </div>
  );
};
