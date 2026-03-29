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

      expect(constraints).toMatch(/^.*MUST:.*$/mu);
      expect(constraints).toMatch(/^.*kebab-case filenames.*$/mu);
      expect(constraints).toMatch(/^.*export const.*$/mu);
    });
  });

  describe('proxy constraints', () => {
    it('VALID: {config: {requireProxy: true}} => includes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ requireProxy: true }),
      });

      expect(constraints).toMatch(/^.*MUST \(Testing\):.*$/mu);
      expect(constraints).toMatch(/^.*\.proxy\.ts.*$/mu);
      expect(constraints).toMatch(/^.*Mock only I\/O boundaries.*$/mu);
    });

    it('VALID: {config: {requireProxy: false}} => excludes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'guards' }),
        config: FolderConfigStub({ requireProxy: false }),
      });

      expect(constraints).not.toMatch(/^.*MUST \(Testing\):.*$/mu);
      expect(constraints).not.toMatch(/^.*\.proxy\.ts.*$/mu);
    });
  });

  describe('ad-hoc type constraints', () => {
    it('VALID: {config: {disallowAdhocTypes: true}} => includes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ disallowAdhocTypes: true }),
      });

      expect(constraints).toMatch(/^.*MUST NOT:.*$/mu);
      expect(constraints).toMatch(/^.*inline types.*$/mu);
      expect(constraints).toMatch(/^.*raw primitives.*$/mu);
    });

    it('VALID: {config: {disallowAdhocTypes: false}} => excludes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'contracts' }),
        config: FolderConfigStub({ disallowAdhocTypes: false }),
      });

      expect(constraints).not.toMatch(/^.*MUST NOT:.*$/mu);
      expect(constraints).not.toMatch(/^.*inline types.*$/mu);
    });
  });

  describe('import restrictions', () => {
    it('VALID: {config: {allowedImports: [guards/, contracts/]}} => includes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'transformers' }),
        config: FolderConfigStub({ allowedImports: ['guards/', 'contracts/'] }),
      });

      expect(constraints).toMatch(/^.*IMPORT RESTRICTIONS:.*$/mu);
      expect(constraints).toMatch(/^.*guards\/.*$/mu);
      expect(constraints).toMatch(/^.*contracts\/.*$/mu);
    });

    it('VALID: {config: {allowedImports: []}} => excludes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'statics' }),
        config: FolderConfigStub({ allowedImports: [] }),
      });

      expect(constraints).not.toMatch(/^.*IMPORT RESTRICTIONS:.*$/mu);
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

      expect(constraints).toMatch(/^.*COMPLEXITY:.*$/mu);
      expect(constraints).toMatch(/^.*300 lines.*$/mu);
    });

    it('VALID: {supplementalConstraints: not provided} => excludes supplemental content', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({}),
      });

      expect(constraints).not.toMatch(/^.*COMPLEXITY:.*$/mu);
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

      expect(constraints).toMatch(/^.*EXAMPLES:.*$/mu);
      expect(constraints).toMatch(/^```typescript$/mu);
      expect(constraints).toMatch(/^export const example/mu);
    });
  });
});
