import { contentChangeContract } from './content-change-contract';
import { ContentChangeStub } from './content-change.stub';
import { FileContentsStub } from '../file-contents/file-contents.stub';

describe('contentChangeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {oldContent, newContent} => returns ContentChange', () => {
      const oldContent = FileContentsStub({ value: 'old' });
      const newContent = FileContentsStub({ value: 'new' });

      const result = contentChangeContract.parse({ oldContent, newContent });

      expect(result).toStrictEqual({
        oldContent: 'old',
        newContent: 'new',
      });
    });

    it('VALID: {oldContent: empty, newContent} => returns ContentChange with empty old', () => {
      const oldContent = FileContentsStub({ value: '' });
      const newContent = FileContentsStub({ value: 'new file' });

      const result = contentChangeContract.parse({ oldContent, newContent });

      expect(result).toStrictEqual({
        oldContent: '',
        newContent: 'new file',
      });
    });
  });

  describe('ContentChangeStub', () => {
    it('VALID: no args => returns default ContentChange', () => {
      const result = ContentChangeStub();

      expect(result).toStrictEqual({
        oldContent: '',
        newContent: '',
      });
    });

    it('VALID: {oldContent, newContent} => returns ContentChange with overrides', () => {
      const oldContent = FileContentsStub({ value: 'old content' });
      const newContent = FileContentsStub({ value: 'new content' });

      const result = ContentChangeStub({ oldContent, newContent });

      expect(result).toStrictEqual({
        oldContent: 'old content',
        newContent: 'new content',
      });
    });
  });
});
