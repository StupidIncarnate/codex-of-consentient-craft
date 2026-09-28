import { Canvas2dContextStub } from './canvas-2d-context.stub';

describe('Canvas2dContextStub', () => {
  it('VALID: {onDraw} => drawImage reports the image and destination rectangle', () => {
    const draws: unknown[] = [];
    const context = Canvas2dContextStub({ onDraw: (draw) => draws.push(draw) });

    context.drawImage('img' as never, 1, 2, 3, 4);

    expect(draws).toStrictEqual([{ image: 'img', dx: 1, dy: 2, dWidth: 3, dHeight: 4 }]);
  });

  it('EMPTY: {} => drawImage can be called without a listener', () => {
    const context = Canvas2dContextStub();

    context.drawImage('img' as never, 0, 0, 1, 1);

    expect(context.drawImage).toStrictEqual(expect.any(Function));
  });
});
