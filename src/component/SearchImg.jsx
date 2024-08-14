import React, {useState} from 'react';

export function SearchImg({ token, indexToChange, albums, setAlbums, toggleModal }) {
    const [searchTerm, setSearchTerm] = useState('')

  const [searchResult, setSearchResult] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault();

    const searchParams = new URLSearchParams({
        q: searchTerm,
        type: 'album',
        limit: 10
      });

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?${searchParams}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log(data);
        setSearchResult(data.albums.items)
      } catch (error) {
        console.error('There was an error!', error);
      }
  }

  const handleModalClick = (album) => {
    const newAlbums = [...albums];
    if (indexToChange === -1){
      newAlbums.push(album)
    }
    else {
      newAlbums[indexToChange] = album;
    }
    
    localStorage.setItem('albums',JSON.stringify(newAlbums))

    setAlbums(JSON.parse(localStorage.getItem('albums')))

    toggleModal()
  };

  return (
    <div>
        <form className="max-w-md mx-auto" onSubmit={handleSubmit}>   
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="search" 
          id="default-search" 
          className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="Search Mockups, Logos..." 
          required 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          type="submit" 
          className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Search
        </button>
      </div>
    </form>


        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
    {searchResult.map((album, index) => (
      <div key={index} className="overflow-hidden">
        <img
          src={album.images[1].url}
          alt={`Image ${index + 1}`}
          className="object-cover"
          onClick={()=>handleModalClick(album,)}
        />
      </div>
    ))}
  </div>
  
  </div>
    
  );
}