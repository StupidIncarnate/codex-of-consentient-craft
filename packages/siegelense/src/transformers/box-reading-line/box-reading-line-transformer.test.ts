import { BoxReadingStub } from '../../contracts/box-reading/box-reading.stub';
import { boxReadingLineTransformer } from './box-reading-line-transformer';

describe('boxReadingLineTransformer', () => {
  it('VALID: {visible, in viewport} => one geometry line', () => {
    const reading = BoxReadingStub({
      ref: 24,
      x: 472,
      y: 351,
      width: 260,
      height: 36,
    });

    expect(boxReadingLineTransformer({ reading })).toBe(
      'ref 24: 260×36 at (472, 351) — visible, in viewport (viewport 1280×720)',
    );
  });

  it('VALID: {not visible, outside viewport} => says so', () => {
    const reading = BoxReadingStub({ visible: false, inViewport: false });

    expect(boxReadingLineTransformer({ reading })).toBe(
      'ref 26: 66×27 at (607, 472) — not visible, outside viewport (viewport 1280×720)',
    );
  });
});
