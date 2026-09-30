import { FolderConfigStub } from '@dungeonmaster/shared/contracts/folder-config/folder-config.stub';
import { folderConstraintsTransformer } from './folder-constraints-transformer';

describe('folderConstraintsTransformer', () => {
  describe('universal constraints', () => {
    it('VALID: {folderType: contracts, config: minimal} => returns universal constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'contracts',
        config: FolderConfigStub({
          requireProxy: false,
          disallowAdhocTypes: false,
          allowedImports: [],
        }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void',
      );
    });
  });

  describe('proxy constraints', () => {
    it('VALID: {config: {requireProxy: true}} => includes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'brokers',
        config: FolderConfigStub({ requireProxy: true }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST (Testing):**\n- Create `.proxy.ts` file for test setup\n- Mock only what the I/O trap or MSW catches, through the gateway wrapper's proxy\n- All business logic runs real in tests\n" +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library",
      );
    });

    it('VALID: {config: {requireProxy: false}} => excludes proxy testing constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'guards',
        config: FolderConfigStub({ requireProxy: false }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library",
      );
    });
  });

  describe('ad-hoc type constraints', () => {
    it('VALID: {config: {disallowAdhocTypes: true}} => includes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'brokers',
        config: FolderConfigStub({ disallowAdhocTypes: true }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library",
      );
    });

    it('VALID: {config: {disallowAdhocTypes: false}} => excludes type constraints', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'contracts',
        config: FolderConfigStub({ disallowAdhocTypes: false }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void',
      );
    });
  });

  describe('import restrictions', () => {
    it('VALID: {config: {allowedImports: [guards/, contracts/]}} => includes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'transformers',
        config: FolderConfigStub({ allowedImports: ['guards/', 'contracts/'] }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library\n" +
          '\n**IMPORT RESTRICTIONS:**\n- Only import from: `guards/`, `contracts/`\n- Importing from other layers violates architecture',
      );
    });

    it('VALID: {config: {allowedImports: []}} => excludes import restrictions', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'statics',
        config: FolderConfigStub({ allowedImports: [] }),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library",
      );
    });
  });

  describe('supplemental constraints', () => {
    it('VALID: {supplementalConstraints: provided} => includes supplemental content', () => {
      const supplementalConstraints = '\n**COMPLEXITY:**\n- Keep files under 300 lines';

      const constraints = folderConstraintsTransformer({
        folderType: 'brokers',
        config: FolderConfigStub({}),
        supplementalConstraints,
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library\n" +
          '\n**COMPLEXITY:**\n- Keep files under 300 lines',
      );
    });

    it('VALID: {supplementalConstraints: not provided} => excludes supplemental content', () => {
      const constraints = folderConstraintsTransformer({
        folderType: 'brokers',
        config: FolderConfigStub({}),
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library",
      );
    });

    it('VALID: {supplementalConstraints: with examples} => includes example code', () => {
      const supplementalConstraints =
        '\n**EXAMPLES:**\n```typescript\nexport const example = () => {};\n```';

      const constraints = folderConstraintsTransformer({
        folderType: 'transformers',
        config: FolderConfigStub({}),
        supplementalConstraints,
      });

      expect(constraints).toBe(
        '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation\n- Import an outside package, type or value, only through `#gateway/<folder>/<subpath>`\n- Return `void` from an exported function only when every gateway or broker call it discards also returned void\n' +
          "\n**MUST NOT:**\n- Define inline types or interfaces\n- A field of an object contract is branded; a loose string or number in a signature or local stays plain, except a parameter that holds another object's field, which takes `Owner['key']`\n- Our own types come from contracts/; a library's types are imported from the library\n" +
          '\n**EXAMPLES:**\n```typescript\nexport const example = () => {};\n```',
      );
    });
  });
});
