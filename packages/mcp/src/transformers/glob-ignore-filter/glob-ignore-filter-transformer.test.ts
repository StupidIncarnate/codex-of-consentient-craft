import { globIgnoreFilterTransformer } from './glob-ignore-filter-transformer';
import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';

const STATIC_PATTERNS = fileDiscoveryStatics.globIgnorePatterns.map((value) =>
  value,
);

describe('globIgnoreFilterTransformer', () => {
  it('VALID: {glob: "src/..."} => returns all ignore rules (no targeted dir)', () => {
    const result = globIgnoreFilterTransformer({
      patterns: STATIC_PATTERNS,
      glob: 'src/**',
    });

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ]);
  });

  it('VALID: {glob: "node_modules/zod/..."} => removes node_modules rule', () => {
    const result = globIgnoreFilterTransformer({
      patterns: STATIC_PATTERNS,
      glob: 'node_modules/zod/**',
    });

    expect(result).toStrictEqual([
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ]);
  });

  it('VALID: {glob: "packages/mcp/dist/..."} => removes dist rule', () => {
    const result = globIgnoreFilterTransformer({
      patterns: STATIC_PATTERNS,
      glob: 'packages/mcp/dist/**',
    });

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/build/**',
      '**/.git/**',
    ]);
  });

  it('VALID: {glob: "node_modules/.../dist/..."} => removes both node_modules and dist rules', () => {
    const result = globIgnoreFilterTransformer({
      patterns: STATIC_PATTERNS,
      glob: 'node_modules/@hono/node-server/dist/**',
    });

    expect(result).toStrictEqual([
      '**/build/**',
      '**/.git/**',
    ]);
  });

  it('VALID: {glob: "build/output/..."} => removes build rule', () => {
    const result = globIgnoreFilterTransformer({
      patterns: STATIC_PATTERNS,
      glob: 'build/output/**',
    });

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
    ]);
  });

  it('EMPTY: {glob: ""} => returns all ignore rules', () => {
    const result = globIgnoreFilterTransformer({
      patterns: STATIC_PATTERNS,
      glob: '',
    });

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ]);
  });

  it('VALID: {glob: "tmp/..."} => removes the tmp rule so an agent can search scratch on purpose', () => {
    const result = globIgnoreFilterTransformer({
      patterns: [
        '**/node_modules/**',
        '**/tmp/**',
      ],
      glob: 'tmp/**/*',
    });

    expect(result).toStrictEqual(['**/node_modules/**']);
  });

  it('EDGE: {glob: unscoped, cwd under /tmp} => keeps the tmp rule (the cwd is not part of the glob)', () => {
    // The caller's glob is what opts out of a rule. A project that merely LIVES under /tmp — this
    // repo's own testbeds and e2e harness do — must not have its tmp rule silently disabled.
    const result = globIgnoreFilterTransformer({
      patterns: [
        '**/node_modules/**',
        '**/tmp/**',
      ],
      glob: '**/*',
    });

    expect(result).toStrictEqual([
      '**/node_modules/**',
      '**/tmp/**',
    ]);
  });

  it('EDGE: {glob: "packages/web/src/coverage-report/..."} => keeps the coverage rule (segment, not substring)', () => {
    const result = globIgnoreFilterTransformer({
      patterns: ['**/coverage/**'],
      glob: 'packages/web/src/coverage-report/**',
    });

    expect(result).toStrictEqual(['**/coverage/**']);
  });

  it('EDGE: {rule: "**/*.log", glob: any} => keeps a wildcard-only rule (no directory to target)', () => {
    const result = globIgnoreFilterTransformer({
      patterns: ['**/*.log'],
      glob: 'packages/**',
    });

    expect(result).toStrictEqual(['**/*.log']);
  });

  it('EDGE: {rule: "tests/tmp/**", glob: "tests/..."} => keeps the rule until every segment is targeted', () => {
    const result = globIgnoreFilterTransformer({
      patterns: ['tests/tmp/**'],
      glob: 'tests/**',
    });

    expect(result).toStrictEqual(['tests/tmp/**']);
  });

  it('VALID: {rule: "tests/tmp/**", glob: "tests/tmp/..."} => removes the rule when every segment is targeted', () => {
    const result = globIgnoreFilterTransformer({
      patterns: ['tests/tmp/**'],
      glob: 'tests/tmp/**',
    });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {patterns: []} => returns no rules', () => {
    const result = globIgnoreFilterTransformer({
      patterns: [],
      glob: 'src/**',
    });

    expect(result).toStrictEqual([]);
  });
});
