/// <reference lib="dom" />
/**
 * PURPOSE: A `CanvasRenderingContext2D`-shaped value that carries only `drawImage`, which is all a
 * draw-and-encode step calls. jsdom's canvas has no 2D context, so this is the only way to hand one
 * back and to see what was drawn.
 *
 * USAGE:
 * const context = Canvas2dContextStub({ onDraw: ({ dWidth }) => widths.push(dWidth) });
 */

export const Canvas2dContextStub = ({
  onDraw = (): void => undefined,
}: {
  onDraw?: (params: {
    image: unknown;
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
  }) => void;
} = {}): CanvasRenderingContext2D =>
  ({
    drawImage: (image: unknown, dx: number, dy: number, dWidth: number, dHeight: number): void => {
      onDraw({ image, dx, dy, dWidth, dHeight });
    },
  }) as unknown as CanvasRenderingContext2D;
