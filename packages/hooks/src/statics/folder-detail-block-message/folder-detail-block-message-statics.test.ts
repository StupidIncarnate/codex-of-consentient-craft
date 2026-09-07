import { folderDetailBlockMessageStatics } from './folder-detail-block-message-statics';

describe('folderDetailBlockMessageStatics', () => {
  describe('header', () => {
    it('VALID: header => exact block header string', () => {
      expect(folderDetailBlockMessageStatics.header).toBe(
        '🛑 get-folder-detail has not been called for this folder type this session.',
      );
    });
  });

  describe('rule', () => {
    it('VALID: rule => exact modifyingCodeGuidance rule string', () => {
      expect(folderDetailBlockMessageStatics.rule).toBe(
        'Call it before your first write into a folder type you have not already loaded this session, so a pass adding a broker and a contract makes two calls, not one.',
      );
    });
  });

  describe('footer', () => {
    it('VALID: footer => exact re-submit instruction string', () => {
      expect(folderDetailBlockMessageStatics.footer).toBe(
        'Your write was NOT applied — the file is unchanged. Make the call, then re-submit the ENTIRE write.',
      );
    });
  });
});
