import { pushPointerMove } from './MakeCollage';

test('stores the latest pointer move while a draw is in progress', () => {
  const model = {
    positions: [{ x: 0, y: 0, width: 40, height: 40 }],
    drawing: false,
    latest: null,
  };
  const anchor = { x: 0, y: 0 };
  const moves = [
    { x: 10, y: 12, drawing: false },
    { x: 30, y: 28, drawing: true },
    { x: 70, y: 64, drawing: true },
  ];

  moves.forEach((move) => {
    model.drawing = move.drawing;
    pushPointerMove(model, 0, move, anchor);
  });

  expect(model.positions[0]).toEqual({ x: 70, y: 64, width: 40, height: 40 });
  expect(model.latest).toEqual({ x: 70, y: 64 });
});
