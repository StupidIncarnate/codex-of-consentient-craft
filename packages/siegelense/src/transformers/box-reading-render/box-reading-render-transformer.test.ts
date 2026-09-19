import { BoxReadingStub } from '../../contracts/box-reading/box-reading.stub';
import { boxReadingRenderTransformer } from './box-reading-render-transformer';

describe('boxReadingRenderTransformer', () => {
  describe('rendering', () => {
    it('VALID: {a box reading} => serializes the exact geometry to JSON', () => {
      const reading = BoxReadingStub();

      const result = boxReadingRenderTransformer({ reading });

      expect(result).toBe(
        '{"ref":26,"x":607,"y":472,"width":66,"height":27,"viewport":{"width":1280,"height":720},"visible":true,"inViewport":true}',
      );
    });
  });
});
