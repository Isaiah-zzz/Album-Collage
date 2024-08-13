import React, { useEffect, useState } from 'react';
import { RandomAlbum } from './randomAlbum.jsx';
import { useNavigate } from 'react-router-dom';

export function Collage() {
  const [apiKey, setApiKey] = useState('');
  let navigate = useNavigate();

  const makeSpotifyAuthRequest = async () => {
    const url = 'https://accounts.spotify.com/api/token';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: '40520b3f91494419a614878476c8cbfc',
      client_secret: '00d08009a050451595439bd7fa6b8a98',
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

  useEffect(() => {
    // Call the function immediately when the component mounts
    const fetchData = async () => {
      const result = await makeSpotifyAuthRequest();
      setApiKey(result);
    };
    
    fetchData();

    // Set up the interval to call the function every hour
    const intervalId = setInterval(fetchData, 60 * 60 * 1000);

    // Clean up function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this effect runs once on mount and clean up on unmount

  useEffect(() => {
    if (apiKey && apiKey.access_token) {
      console.log(apiKey.access_token);
    }
  }, [apiKey]);

  return (
    <div>

    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">Album Collage</h1>

        <div className = "max-w-[50%]">
            <RandomAlbum token = {apiKey.access_token}></RandomAlbum>

        </div>

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
        onClick={()=>{
            navigate('/make');
        }}>
        Make Collage
      </button>


    </div>

    </div>
  );
}