import { widgetFileNameExtractTransformer } from './widget-file-name-extract-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('widgetFileNameExtractTransformer', () => {
  describe('tsx files', () => {
    it('VALID: {quest-chat-widget.tsx} => returns quest-chat-widget', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
      });

      const result = widgetFileNameExtractTransformer({ filePath });

      expect(result).toBe('quest-chat-widget');
    });

    it('VALID: {app-widget.tsx} => returns app-widget', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });

      const result = widgetFileNameExtractTransformer({ filePath });

      expect(result).toBe('app-widget');
    });
  });

  describe('ts files', () => {
    it('VALID: {data-widget.ts} => returns data-widget', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/data/data-widget.ts',
      });

      const result = widgetFileNameExtractTransformer({ filePath });

      expect(result).toBe('data-widget');
    });
  });
});
