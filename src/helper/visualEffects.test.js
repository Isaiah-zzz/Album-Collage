import { VisualEffects } from './visualEffects';

function installFakes() {
  const images = [];
  class FakeImage {
    constructor() {
      images.push(this);
    }

    set src(value) {
      this.currentSrc = value;
      if (String(value).includes('broken')) {
        this.onerror();
        return;
      }
      this.naturalWidth = 12;
      this.naturalHeight = 10;
      this.onload();
    }
  }

  const canvases = [];
  const previousImage = window.Image;
  const previousCreate = document.createElement.bind(document);
  window.Image = FakeImage;
  global.Image = FakeImage;
  document.createElement = (tag, options) => {
    if (tag === 'canvas') {
      const canvas = {
        width: 0,
        height: 0,
        getContext() {
          return {
            beginPath() {},
            moveTo() {},
            lineTo() {},
            quadraticCurveTo() {},
            closePath() {},
            clip() {},
            drawImage() {},
            fillRect() {},
          };
        },
      };
      canvases.push(canvas);
      return canvas;
    }
    return previousCreate(tag, options);
  };

  return {
    images,
    canvases,
    restore() {
      window.Image = previousImage;
      global.Image = previousImage;
      document.createElement = previousCreate;
      VisualEffects.decodedCovers.clear();
      VisualEffects.bakedCovers.clear();
    },
  };
}

function destination() {
  const drawn = [];
  const shadowWrites = [];
  const ctx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage(source) {
      drawn.push(source);
    },
    set shadowBlur(value) {
      shadowWrites.push(value);
    },
    set shadowOffsetX(value) {
      shadowWrites.push(value);
    },
    set shadowOffsetY(value) {
      shadowWrites.push(value);
    },
    set shadowColor(value) {
      shadowWrites.push(value);
    },
  };
  return { ctx, drawn, shadowWrites };
}

const position = { x: 4, y: 6, width: 30, height: 40, rotation: 0, scale: 1 };

test('blits a cached shadow bitmap on the next draw', async () => {
  const fakes = installFakes();
  try {
    const first = destination();
    const second = destination();
    const url = 'https://covers.example/a.jpg';
    await VisualEffects.drawAlbumWithShadow(first.ctx, url, position);
    const bakedCanvases = fakes.canvases.length;
    await VisualEffects.drawAlbumWithShadow(second.ctx, url, { ...position, x: 80, y: 90 });

    expect(fakes.images).toHaveLength(1);
    expect(fakes.canvases.length).toBe(bakedCanvases);
    expect(first.drawn).toHaveLength(1);
    expect(second.drawn[0]).toBe(first.drawn[0]);
    expect(first.shadowWrites).toEqual([]);
    expect(second.shadowWrites).toEqual([]);
  } finally {
    fakes.restore();
  }
});

test('reuses the decoded cover for a second effect and for a failed url', async () => {
  const fakes = installFakes();
  try {
    const shadow = destination();
    const glow = destination();
    const url = 'https://covers.example/a.jpg';
    await VisualEffects.drawAlbumWithShadow(shadow.ctx, url, position);
    await VisualEffects.drawAlbumWithGlow(glow.ctx, url, position, '#ff6b6b');
    const blend = destination();
    await VisualEffects.drawAlbumWithBlendMode(blend.ctx, url, position, 'multiply');
    expect(fakes.images).toHaveLength(1);
    expect(glow.drawn[0]).not.toBe(shadow.drawn[0]);
    expect(glow.shadowWrites).toEqual([]);
    expect(blend.drawn[0]).toBe(fakes.images[0]);

    const broken = destination();
    await VisualEffects.drawAlbumWithShadow(broken.ctx, 'https://covers.example/broken.jpg', position);
    await VisualEffects.drawAlbumWithShadow(broken.ctx, 'https://covers.example/broken.jpg', position);
    expect(fakes.images).toHaveLength(2);
    expect(broken.drawn).toEqual([]);
  } finally {
    fakes.restore();
  }
});
