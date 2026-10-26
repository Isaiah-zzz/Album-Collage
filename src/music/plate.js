const PLATES = [
  {
    usesToken: false,
    url(prompt) {
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux`;
    },
    init() {
      return { method: 'GET' };
    },
  },
  {
    usesToken: true,
    url() {
      return 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
    },
    init(prompt, token) {
      return {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'image/png',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      };
    },
  },
];

function tokenValue(token) {
  return String(token ?? '').trim();
}

export function plateRequest(token, prompt) {
  const value = tokenValue(token);
  const plate = PLATES.find((row) => row.usesToken === (value !== ''));
  return {
    url: plate.url(prompt, value),
    init: plate.init(prompt, value),
  };
}

export class PlateError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'PlateError';
    this.status = status;
  }
}

function plateErrorMessage(status, body) {
  if (status === 401) {
    return 'Authentication failed. Please add a valid Hugging Face API key.';
  }
  const text = body.trim();
  if (text !== '') {
    return text.length > 400 ? text.slice(0, 400) : text;
  }
  if (status === 402) {
    return 'The image host rejected the request.';
  }
  return `Plate request failed (${status}).`;
}

export async function fetchPlate(token, prompt) {
  const request = plateRequest(token, prompt);
  const response = await fetch(request.url, request.init);
  const type = response.headers.get('content-type') || '';
  if (!response.ok || type.includes('application/json')) {
    const text = await response.text();
    throw new PlateError(response.status, plateErrorMessage(response.status, text));
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new PlateError(response.status, 'Received empty response from the image host.');
  }
  return { bytes, type: type.split(';')[0] || 'image/png' };
}
