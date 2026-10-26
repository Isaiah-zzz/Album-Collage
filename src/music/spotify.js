import { createAlbum } from './album.js';

export class MissingCoverUrl extends Error {
  constructor() {
    super('Album payload is missing a cover URL');
    this.name = 'MissingCoverUrl';
  }
}

function toCover(entry) {
  if (!entry || typeof entry.url !== 'string' || entry.url === '') {
    return null;
  }
  return {
    url: entry.url,
    width: typeof entry.width === 'number' ? entry.width : null,
    height: typeof entry.height === 'number' ? entry.height : null,
  };
}

function toArtists(artists) {
  if (!Array.isArray(artists)) {
    return [];
  }
  return artists.flatMap((artist) => {
    if (typeof artist === 'string' && artist !== '') {
      return [{ name: artist }];
    }
    if (artist && typeof artist.name === 'string' && artist.name !== '') {
      return [{ name: artist.name }];
    }
    return [];
  });
}

function toYear(value) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})/.exec(value);
    if (match) {
      return Number(match[1]);
    }
  }
  return null;
}

function coversFrom(payload) {
  const entries = Array.isArray(payload.covers)
    ? payload.covers
    : Array.isArray(payload.images)
      ? payload.images
      : [];
  return entries.flatMap((entry) => {
    const cover = toCover(entry);
    return cover ? [cover] : [];
  });
}

export function albumFromSpotify(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new MissingCoverUrl();
  }

  const hasCovers = Array.isArray(payload.covers);
  const covers = coversFrom(payload);
  if (covers.length === 0) {
    throw new MissingCoverUrl();
  }

  return createAlbum({
    source: hasCovers && payload.source === 'apple' ? 'apple' : 'spotify',
    id: typeof payload.id === 'string' ? payload.id : null,
    name: typeof payload.name === 'string' ? payload.name : '',
    artists: toArtists(payload.artists),
    covers,
    year: hasCovers ? toYear(payload.year) : toYear(payload.release_date),
  });
}

export function albumsFromSpotify(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const albums = [];
  for (const item of items) {
    try {
      albums.push(albumFromSpotify(item));
    } catch (error) {
      if (!(error instanceof MissingCoverUrl)) {
        throw error;
      }
    }
  }
  return albums;
}

export function loadAlbums() {
  const raw = localStorage.getItem('albums');
  if (raw == null) {
    return null;
  }
  return albumsFromSpotify(JSON.parse(raw));
}

export function saveAlbums(albums) {
  localStorage.setItem('albums', JSON.stringify(albumsFromSpotify(albums)));
}
