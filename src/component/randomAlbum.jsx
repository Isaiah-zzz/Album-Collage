import React, { useEffect, useState } from "react";

import { SearchImg } from "./SearchImg";

export function RandomAlbum({ token, fetchData}) {
  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [albumIndexToChange, setAlbumIndexToChange] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  async function getRandomAlbums(accessToken, limit = 20) {
    try {
      console.log(accessToken)
      const characters = "abcdefghijklmnopqrstuvwxyz";
      const randomChar = characters.charAt(
        Math.floor(Math.random() * characters.length)
      );

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${randomChar}&type=album&limit=${limit}&offset=${Math.floor(
          Math.random() * 1000
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch albums");
      }

      const data = await response.json();

      localStorage.setItem('albums', JSON.stringify(data.albums.items));
    //   setAlbums(data.albums.items);
    setAlbums(JSON.parse(localStorage.getItem('albums')))
    //   setIsLoading(true);
    } catch (error) {
      // console.error("Error fetching random albums:", error);
      // setError("Failed to fetch albums. Please try again later.");
      console.log(error)
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const storedAlbums = localStorage.getItem('albums');
    
    if (storedAlbums) {
      setAlbums(JSON.parse(storedAlbums));
      setIsLoading(false);
    } else {
      getRandomAlbums(token);
    }
  }, [token]);

  if (error) return <div className="text-center text-red-500">{error}</div>;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const toggleModal = () => setIsOpen(!isOpen);

  const handleAlbumEdit = (index) => {
    toggleModal();
    setAlbumIndexToChange(index);
  };

  const handleAlbumDelete = (index) => {
    const newAlbums = [...albums];
    newAlbums.splice(index, 1);

    localStorage.setItem('albums',JSON.stringify(newAlbums))

    setAlbums(JSON.parse(localStorage.getItem('albums')))
  }

  const handleAlbumAdd = () => {
    toggleModal();
    setAlbumIndexToChange(-1)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {albums.map((album, index) => (
        <div key={album.id} className="aspect-square overflow-hidden relative" onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}>
            {hoveredIndex === index ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button 
              onClick={() => handleAlbumDelete(index)}
              className="mb-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Delete
            </button>
            <button 
              onClick={() => handleAlbumEdit(index)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Edit
            </button>
          </div>
          
          ) : (
            <img
              src={album.images[0]?.url}
              alt={album.name}
              className="w-full h-full object-cover cursor-pointer"
              // onClick={() => handleAlbumClick(index)}
            />
          )}
        </div>
      ))}
      <div className="w-full flex justify-center items-center border-dashed border-2 aspect-square cursor-pointer"
      onClick = {()=>{handleAlbumAdd()}}>
        <p className="text-grey-600 text-xl">+</p>
      </div>

      {isOpen && (
        <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
          <div className="relative p-4 w-full max-w-2xl max-h-full">
            {/* Modal content */}
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Search For Album
                </h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  onClick={() => toggleModal()}
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              {/* Modal body */}
              <div className="p-4 md:p-5 space-y-4">
                <SearchImg
                  token={token}
                  indexToChange={albumIndexToChange}
                  albums={albums}
                  setAlbums={setAlbums}
                  toggleModal={toggleModal}
                ></SearchImg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    
  );
}
