import { FolderTypeStub, FolderConfigStub } from '@dungeonmaster/shared/contracts';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { folderConstraintsTransformer } from './folder-constraints-transformer';

describe('folderConstraintsTransformer', () => {
  describe('universal constraints', () => {
    it('VALID: {folderType: contracts, config: minimal} => returns universal constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'contracts' }),
        config: FolderConfigStub({
          requireProxy: false,
          disallowAdhocTypes: false,
          allowedImports: [],
        }),
      });

      expect(constraints).toMatch(/MUST:/u);
      expect(constraints).toMatch(/kebab-case filenames/u);
      expect(constraints).toMatch(/export const/u);
    });
  });

  describe('proxy constraints', () => {
    it('VALID: {config: {requireProxy: true}} => includes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ requireProxy: true }),
      });

      expect(constraints).toMatch(/MUST \(Testing\):/u);
      expect(constraints).toMatch(/\.proxy\.ts/u);
      expect(constraints).toMatch(/Mock only I\/O boundaries/u);
    });

    it('VALID: {config: {requireProxy: false}} => excludes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'guards' }),
        config: FolderConfigStub({ requireProxy: false }),
      });

      expect(constraints).not.toMatch(/MUST \(Testing\):/u);
      expect(constraints).not.toMatch(/\.proxy\.ts/u);
    });
  });

  describe('ad-hoc type constraints', () => {
    it('VALID: {config: {disallowAdhocTypes: true}} => includes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ disallowAdhocTypes: true }),
      });

      expect(constraints).toMatch(/MUST NOT:/u);
      expect(constraints).toMatch(/inline types/u);
      expect(constraints).toMatch(/raw primitives/u);
    });

    it('VALID: {config: {disallowAdhocTypes: false}} => excludes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'contracts' }),
        config: FolderConfigStub({ disallowAdhocTypes: false }),
      });

      expect(constraints).not.toMatch(/MUST NOT:/u);
      expect(constraints).not.toMatch(/inline types/u);
    });
  });

  describe('import restrictions', () => {
    it('VALID: {config: {allowedImports: [guards/, contracts/]}} => includes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'transformers' }),
        config: FolderConfigStub({ allowedImports: ['guards/', 'contracts/'] }),
      });

      expect(constraints).toMatch(/IMPORT RESTRICTIONS:/u);
      expect(constraints).toMatch(/guards\//u);
      expect(constraints).toMatch(/contracts\//u);
    });

    it('VALID: {config: {allowedImports: []}} => excludes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'statics' }),
        config: FolderConfigStub({ allowedImports: [] }),
      });

      expect(constraints).not.toMatch(/IMPORT RESTRICTIONS:/u);
    });
  });

  describe('supplemental constraints', () => {
    it('VALID: {supplementalConstraints: provided} => includes supplemental content', () => {
      const supplementalConstraints = ContentTextStub({
        value: '\n**COMPLEXITY:**\n- Keep files under 300 lines',
      });

      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({}),
        supplementalConstraints,
      });

      expect(constraints).toMatch(/COMPLEXITY:/u);
      expect(constraints).toMatch(/300 lines/u);
    });

    it('VALID: {supplementalConstraints: not provided} => excludes supplemental content', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({}),
      });

      expect(constraints).not.toMatch(/COMPLEXITY:/u);
    });

    it('VALID: {supplementalConstraints: with examples} => includes example code', () => {
      const supplementalConstraints = ContentTextStub({
        value: '\n**EXAMPLES:**\n```typescript\nexport const example = () => {};\n```',
      });

      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'transformers' }),
        config: FolderConfigStub({}),
        supplementalConstraints,
      });

      expect(constraints).toMatch(/EXAMPLES:/u);
      expect(constraints).toMatch(/```typescript/u);
      expect(constraints).toMatch(/export const example/u);
    });
  });
});
