import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MiniUserProfile( {userData, logoutClick, fetchData, setIsLoggedOut }) {
    const [isHovering, setIsHovering] = useState(false);
    const navigate = useNavigate();

    
    async function logout() {
      console.log(localStorage)
      localStorage.clear();
      console.log('logged out');
      navigate('/'); // Redirect to login page or any other route
      // window.location.reload();
      setIsLoggedOut(true);
  }

    return (
      <div 
        className="p-3 flex items-center justify-between border-t cursor-pointer rounded-full bg-gray-200 transition-colors duration-300"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={ () =>{logoutClick()}
          // async () => {
          // localStorage.clear();
          // console.log('logged out');
          // await fetchData();
          
          // // window.location.reload();
          // const navigate = useNavigate();
          // navigate('/')
      // }
    }
      >
        <div className="flex items-center w-full">
          {isHovering ? (
            <>
              <div className="rounded-full h-10 w-10 bg-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="ml-2 flex flex-col">
                <div className="leading-snug text-sm text-red-600 font-bold">Sign Out</div>
              </div>
            </>
          ) : (
            <>
              <img 
                className="rounded-full h-10 w-10" 
                src={userData.images[0].url} 
                alt="Profile"
              />
              <div className="ml-2 flex flex-col">
                <div className="leading-snug text-sm text-gray-900 font-bold">{userData.display_name}</div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }