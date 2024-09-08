import {loginWithSpotifyClick, logoutClick} from '../helper/authen.js'
import { MiniUserProfile } from './MiniUserProfile.jsx';

import React, { useEffect, useState } from 'react';

export function Nav({setApiKey, fetchData}) {

  const [userData, setUserData] = useState(undefined)
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token') || null);
  const [expiresAt, setExpiresAt] = useState(new Date(localStorage.getItem('expires')) || null);
  console.log(localStorage.getItem('user_data'))

  const [isLoggedOut, setIsLoggedOut] = useState(true)

  useEffect (()=>{
    if (localStorage.getItem('user_data')){
      if (JSON.parse(localStorage.getItem('user_data')).error){
        setUserData(undefined)
      }else {
        setUserData(JSON.parse(localStorage.getItem('user_data')))
      }
    } 
  },[localStorage.getItem('user_data'), localStorage])

  const refreshTokenRequest = async (refreshToken) => {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.REACT_APP_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
  
    return await response.json();
  };


  const refreshAccessToken = async () => {
    if (refreshToken && new Date() > expiresAt) {
      try {
        const token = await refreshTokenRequest(refreshToken);
        setApiKey(token);
      } catch (error) {
        console.error('Error refreshing access token:', error)
      }
    }
  };
  // Automatically refresh token when access token is expired
  useEffect(() => {
    if (refreshToken && expiresAt) {
      const timeoutId = setTimeout(refreshAccessToken, expiresAt - new Date());
      console.log(timeoutId)
      return () => clearTimeout(timeoutId); // Cleanup timeout on unmount
    }
  }, [refreshToken, expiresAt]);

  useEffect (()=>{
    if (localStorage.getItem('access_token')){
      setApiKey(localStorage.getItem('access_token'))
    } else {
      fetchData()
    }
  },[localStorage.getItem('access_token')])



  console.log(userData)
    return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Album Collage</span>
        </a>
        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {
            userData ? <MiniUserProfile userData={userData} logoutClick = {logoutClick} fetchData = {fetchData} setIsLoggedOut = {setIsLoggedOut}></MiniUserProfile> : 
        <button type="button" onClick={()=>{loginWithSpotifyClick(); setIsLoggedOut(false); console.log(isLoggedOut)}} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Login With Spotify
          </button>
          }
          <button data-collapse-toggle="navbar-sticky" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-sticky" aria-expanded="false">
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    );
  }