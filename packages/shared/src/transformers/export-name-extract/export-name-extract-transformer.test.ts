import { exportNameExtractTransformer } from './export-name-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('exportNameExtractTransformer', () => {
  describe('PascalCase exports', () => {
    it('VALID: {export const ChatReplayResponder = ...} => returns ChatReplayResponder', () => {
      const source = ContentTextStub({
        value: 'export const ChatReplayResponder = (input: Input) => {};',
      });

      const result = exportNameExtractTransformer({ source });

      expect(String(result)).toBe('ChatReplayResponder');
    });
  });

  describe('camelCase exports', () => {
    it('VALID: {export const useQuestQueueBinding = ...} => returns useQuestQueueBinding', () => {
      const source = ContentTextStub({
        value: 'export const useQuestQueueBinding = () => {};',
      });

      const result = exportNameExtractTransformer({ source });

      expect(String(result)).toBe('useQuestQueueBinding');
    });
  });

  describe('function exports', () => {
    it('VALID: {export function questFlow} => returns questFlow', () => {
      const source = ContentTextStub({
        value: 'export function questFlow(): void {}',
      });

      const result = exportNameExtractTransformer({ source });

      expect(String(result)).toBe('questFlow');
    });
  });

  describe('imports before export', () => {
    it('VALID: {imports then export const} => returns export name not import', () => {
      const source = ContentTextStub({
        value: "import { foo } from './foo';\nexport const myBroker = () => {};",
      });

      const result = exportNameExtractTransformer({ source });

      expect(String(result)).toBe('myBroker');
    });
  });

  describe('no export', () => {
    it('EMPTY: {source has no export} => returns null', () => {
      const source = ContentTextStub({
        value: 'import { foo } from "bar";\nconst x = 1;',
      });

      const result = exportNameExtractTransformer({ source });

      expect(result).toBe(null);
    });
  });

  describe('only type exports', () => {
    it('EMPTY: {only export type} => returns null', () => {
      const source = ContentTextStub({
        value: 'export type Foo = { bar: string };',
      });

      const result = exportNameExtractTransformer({ source });

      expect(result).toBe(null);
    });
  });
});
