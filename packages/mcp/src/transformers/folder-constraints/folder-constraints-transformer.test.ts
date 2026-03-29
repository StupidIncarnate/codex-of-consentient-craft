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

      expect(constraints).toContain('MUST:');
      expect(constraints).toContain('kebab-case filenames');
      expect(constraints).toContain('export const');
    });
  });

  describe('proxy constraints', () => {
    it('VALID: {config: {requireProxy: true}} => includes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ requireProxy: true }),
      });

      expect(constraints).toContain('MUST (Testing):');
      expect(constraints).toContain('.proxy.ts');
      expect(constraints).toContain('Mock only I/O boundaries');
    });

    it('VALID: {config: {requireProxy: false}} => excludes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'guards' }),
        config: FolderConfigStub({ requireProxy: false }),
      });

      expect(constraints).not.toContain('MUST (Testing):');
      expect(constraints).not.toContain('.proxy.ts');
    });
  });

  describe('ad-hoc type constraints', () => {
    it('VALID: {config: {disallowAdhocTypes: true}} => includes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ disallowAdhocTypes: true }),
      });

      expect(constraints).toContain('MUST NOT:');
      expect(constraints).toContain('inline types');
      expect(constraints).toContain('raw primitives');
    });

    it('VALID: {config: {disallowAdhocTypes: false}} => excludes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'contracts' }),
        config: FolderConfigStub({ disallowAdhocTypes: false }),
      });

      expect(constraints).not.toContain('MUST NOT:');
      expect(constraints).not.toContain('inline types');
    });
  });

  describe('import restrictions', () => {
    it('VALID: {config: {allowedImports: [guards/, contracts/]}} => includes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'transformers' }),
        config: FolderConfigStub({ allowedImports: ['guards/', 'contracts/'] }),
      });

      expect(constraints).toContain('IMPORT RESTRICTIONS:');
      expect(constraints).toContain('guards/');
      expect(constraints).toContain('contracts/');
    });

    it('VALID: {config: {allowedImports: []}} => excludes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'statics' }),
        config: FolderConfigStub({ allowedImports: [] }),
      });

      expect(constraints).not.toContain('IMPORT RESTRICTIONS:');
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

      expect(constraints).toContain('COMPLEXITY:');
      expect(constraints).toContain('300 lines');
    });

    it('VALID: {supplementalConstraints: not provided} => excludes supplemental content', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({}),
      });

      expect(constraints).not.toContain('COMPLEXITY:');
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

      expect(constraints).toContain('EXAMPLES:');
      expect(constraints).toMatch(/^```typescript$/mu);
      expect(constraints).toMatch(/^export const example/mu);
    });
  });
});
