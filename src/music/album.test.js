import { albumFromSpotify, loadAlbums, saveAlbums, MissingCoverUrl } from './spotify';

const spotifyAlbum = {
  id: 'spotify-album-silent',
  name: 'In a Silent Way',
  artists: [{ name: 'Miles Davis', id: 'miles' }],
  release_date: '1969-07-30',
  images: [
    { url: 'https://i.scdn.co/image/large', height: 640, width: 640 },
    { url: 'https://i.scdn.co/image/medium', height: 300, width: 300 },
    { url: 'https://i.scdn.co/image/small', height: 64, width: 64 },
  ],
};

const album = {
  source: 'spotify',
  id: 'spotify-album-silent',
  name: 'In a Silent Way',
  artists: [{ name: 'Miles Davis' }],
  covers: [
    { url: 'https://i.scdn.co/image/large', width: 640, height: 640 },
    { url: 'https://i.scdn.co/image/medium', width: 300, height: 300 },
    { url: 'https://i.scdn.co/image/small', width: 64, height: 64 },
  ],
  year: 1969,
};

const storedAlbum = {
  source: 'apple',
  id: 'apple-1',
  name: 'The Dark Side of the Moon',
  artists: [{ name: 'Pink Floyd' }],
  covers: [{ url: 'https://example.com/dark.jpg', width: 640, height: 640 }],
  year: 1973,
};

test('maps a Spotify album to one Album', () => {
  expect(albumFromSpotify(spotifyAlbum)).toEqual(album);
});

test('rejects a payload with no cover URL', () => {
  expect(() => albumFromSpotify({
    id: 'bare',
    name: 'Bare',
    artists: [{ name: 'Nobody' }],
    images: [{ height: 300, width: 300 }],
    release_date: '2001-01-01',
  })).toThrow(MissingCoverUrl);
});

test('keeps a stored Album that already has covers', () => {
  const withImages = {
    ...storedAlbum,
    images: [{ url: 'https://example.com/ignored.jpg', width: 64, height: 64 }],
  };
  expect(albumFromSpotify(withImages)).toEqual(storedAlbum);
});

test('loads Spotify JSON and a stored Album, and drops a coverless payload', () => {
  localStorage.setItem('albums', JSON.stringify([
    spotifyAlbum,
    storedAlbum,
    { id: 'nope', name: 'Nope', images: [] },
  ]));

  expect(loadAlbums()).toEqual([album, storedAlbum]);
});

test('writes Album records', () => {
  saveAlbums([spotifyAlbum, { id: 'nope', images: [{ width: 10, height: 10 }] }]);

  expect(JSON.parse(localStorage.getItem('albums'))).toEqual([album]);
});
