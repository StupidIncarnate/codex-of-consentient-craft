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

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation',
      );
    });
  });

  describe('proxy constraints', () => {
    it('VALID: {config: {requireProxy: true}} => includes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ requireProxy: true }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST (Testing):**\n- Create `.proxy.ts` file for test setup\n- Mock only I/O boundaries (adapters)\n- All business logic runs real in tests\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/',
      );
    });

    it('VALID: {config: {requireProxy: false}} => excludes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'guards' }),
        config: FolderConfigStub({ requireProxy: false }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/',
      );
    });
  });

  describe('ad-hoc type constraints', () => {
    it('VALID: {config: {disallowAdhocTypes: true}} => includes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({ disallowAdhocTypes: true }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/',
      );
    });

    it('VALID: {config: {disallowAdhocTypes: false}} => excludes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'contracts' }),
        config: FolderConfigStub({ disallowAdhocTypes: false }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation',
      );
    });
  });

  describe('import restrictions', () => {
    it('VALID: {config: {allowedImports: [guards/, contracts/]}} => includes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'transformers' }),
        config: FolderConfigStub({ allowedImports: ['guards/', 'contracts/'] }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/\n' +
          '\n**IMPORT RESTRICTIONS:**\n- Only import from: `guards/`, `contracts/`\n- Importing from other layers violates architecture',
      );
    });

    it('VALID: {config: {allowedImports: []}} => excludes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'statics' }),
        config: FolderConfigStub({ allowedImports: [] }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/',
      );
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

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/\n' +
          '\n**COMPLEXITY:**\n- Keep files under 300 lines',
      );
    });

    it('VALID: {supplementalConstraints: not provided} => excludes supplemental content', () => {
      const constraints = folderConstraintsTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
        config: FolderConfigStub({}),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/',
      );
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

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n' +
          '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/\n' +
          '\n**EXAMPLES:**\n```typescript\nexport const example = () => {};\n```',
      );
    });
  });
});
