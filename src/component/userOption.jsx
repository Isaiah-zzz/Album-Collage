import React, { useEffect, useState } from 'react';

export function UserOption({ setAlbums }) {
    const [error, setError] = useState(null);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [albumLimit, setAlbumLimit] = useState(20);

    useEffect(() => {
        // Check if user is logged in by checking for user access token
        const userToken = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        setIsUserLoggedIn(userToken && userData && !JSON.parse(userData).error);
    }, []);

    const getUserSavedAlbums = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                throw new Error('No access token available');
            }

            const response = await fetch(`https://api.spotify.com/v1/me/albums?offset=0&limit=${albumLimit}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch saved albums');
            }

            const data = await response.json();

            let clean_data = data.items.map(item => item.album)

            localStorage.setItem('albums', JSON.stringify(clean_data));
            setAlbums(JSON.parse(localStorage.getItem('albums')));
        } catch (err) {
            setError(err.message);
            console.error('Error fetching saved albums:', err);
        }
    };

    // Only show the button if user is logged in
    if (!isUserLoggedIn) {
        return null;
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
                <label htmlFor="album-limit" className="text-sm font-medium text-gray-700">
                    Number of albums:
                </label>
                <input
                    id="album-limit"
                    type="number"
                    min="1"
                    max="50"
                    value={albumLimit}
                    onChange={(e) => setAlbumLimit(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <button 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
                onClick={getUserSavedAlbums}
            >
                Load {albumLimit} Saved Albums
            </button>
            {error && (
                <div className="text-red-500 mt-2">
                    {error}
                </div>
            )}
        </div>
    );
}