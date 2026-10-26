import { plateRequest } from './plate';

test('requests pollinations flux when no token is saved', () => {
  for (const token of [null, '', '   ']) {
    const { url } = plateRequest(token, 'quiet room');
    expect(url).toContain('image.pollinations.ai');
    expect(url).toContain('model=flux');
  }
});

test('requests FLUX.1-schnell on the huggingface router when a token is saved', () => {
  const token = 'saved-token';
  const { url } = plateRequest(token, 'quiet room');
  expect(url).toContain('router.huggingface.co');
  expect(url).toContain('FLUX.1-schnell');
  expect(url).not.toContain(token);
});
