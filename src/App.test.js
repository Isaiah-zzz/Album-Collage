import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./helper/authen.js', () => ({
  loginWithSpotifyClick: () => {},
  logoutClick: () => {},
}));

test('shows the Album Collage heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Album Collage' })).toBeInTheDocument();
});
