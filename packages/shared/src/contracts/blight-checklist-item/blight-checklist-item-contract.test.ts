import { blightChecklistItemContract } from './blight-checklist-item-contract';
import { BlightChecklistItemStub } from './blight-checklist-item.stub';

describe('blightChecklistItemContract', () => {
  describe('valid items', () => {
    it('VALID: {full item} => parses id, implPath, concern, pairedFiles, and label', () => {
      expect(BlightChecklistItemStub()).toStrictEqual({
        id: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
        implPath: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
        concern: 'craft',
        pairedFiles: ['packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx'],
        label:
          "craft — quest-chat-widget.tsx's logic matches its signature and its error handling carries real context",
      });
    });

    it('VALID: {no pairedFiles key in payload} => defaults to an empty array', () => {
      expect(
        blightChecklistItemContract.parse({
          id: 'packages/shared/src/index.ts:dedup',
          implPath: 'packages/shared/src/index.ts',
          concern: 'dedup',
          label: 'dedup — no duplicate barrel export',
        }).pairedFiles,
      ).toStrictEqual([]);
    });

    it('VALID: {packageName given} => carries the owning package alongside the path', () => {
      expect(BlightChecklistItemStub({ packageName: 'web' }).packageName).toBe('web');
    });

    it('EMPTY: {no packageName key in payload} => the key is absent, marking a file under no declared package', () => {
      expect(
        blightChecklistItemContract.parse({
          id: 'scripts/release.ts:dedup',
          implPath: 'scripts/release.ts',
          concern: 'dedup',
          label: 'dedup — no duplicate release logic',
        }),
      ).toStrictEqual({
        id: 'scripts/release.ts:dedup',
        implPath: 'scripts/release.ts',
        concern: 'dedup',
        pairedFiles: [],
        label: 'dedup — no duplicate release logic',
      });
    });

    it('EMPTY: {packageName: ""} => throws, because an empty name names no package', () => {
      expect(() => BlightChecklistItemStub({ packageName: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('VALID: {multiple paired files} => preserves every entry in order', () => {
      expect(
        BlightChecklistItemStub({
          pairedFiles: [
            'packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx',
            'packages/web/src/widgets/quest-chat/quest-chat-widget.proxy.tsx',
          ],
        }).pairedFiles,
      ).toStrictEqual([
        'packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx',
        'packages/web/src/widgets/quest-chat/quest-chat-widget.proxy.tsx',
      ]);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {concern: "novel"} => throws', () => {
      expect(() => BlightChecklistItemStub({ concern: 'novel' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {label: ""} => throws, because a unit with no text tells a reviewer nothing to confirm', () => {
      expect(() => BlightChecklistItemStub({ label: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {implPath: ""} => throws', () => {
      expect(() => BlightChecklistItemStub({ implPath: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {implPath: absolute path} => throws, because persisted paths must stay repo-relative', () => {
      expect(() => BlightChecklistItemStub({ implPath: '/abs/path.ts' as never })).toThrow(
        /repo-relative/u,
      );
    });

    it('EMPTY: {id: ""} => throws', () => {
      expect(() => BlightChecklistItemStub({ id: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {unknown extra property} => is stripped by the contract', () => {
      expect(
        blightChecklistItemContract.parse({
          id: 'packages/shared/src/index.ts:dedup',
          implPath: 'packages/shared/src/index.ts',
          concern: 'dedup',
          label: 'dedup — no duplicate barrel export',
          bogus: 'nope',
        }),
      ).toStrictEqual({
        id: 'packages/shared/src/index.ts:dedup',
        implPath: 'packages/shared/src/index.ts',
        concern: 'dedup',
        pairedFiles: [],
        label: 'dedup — no duplicate barrel export',
      });
    });
  });
});
