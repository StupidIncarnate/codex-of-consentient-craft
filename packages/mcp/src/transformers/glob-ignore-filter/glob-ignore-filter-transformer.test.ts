import { globIgnoreFilterTransformer } from './glob-ignore-filter-transformer';
import { GlobPatternStub } from '../../contracts/glob-pattern/glob-pattern.stub';

describe('globIgnoreFilterTransformer', () => {
  it('VALID: {pattern: "src/..."} => returns all ignore rules (no targeted dir)', () => {
    const result = globIgnoreFilterTransformer({
      pattern: GlobPatternStub({ value: 'src/**' }),
    });

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });

  it('VALID: {pattern: "node_modules/zod/..."} => removes node_modules rule', () => {
    const result = globIgnoreFilterTransformer({
      pattern: GlobPatternStub({ value: 'node_modules/zod/**' }),
    });

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });

  it('VALID: {pattern: "packages/mcp/dist/..."} => removes dist rule', () => {
    const result = globIgnoreFilterTransformer({
      pattern: GlobPatternStub({ value: 'packages/mcp/dist/**' }),
    });

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });

  it('VALID: {pattern: "node_modules/.../dist/..."} => removes both node_modules and dist rules', () => {
    const result = globIgnoreFilterTransformer({
      pattern: GlobPatternStub({ value: 'node_modules/@hono/node-server/dist/**' }),
    });

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });

  it('VALID: {pattern: "build/output/..."} => removes build rule', () => {
    const result = globIgnoreFilterTransformer({
      pattern: GlobPatternStub({ value: 'build/output/**' }),
    });

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });

  it('EDGE: {pattern: ""} => returns all ignore rules', () => {
    const result = globIgnoreFilterTransformer({
      pattern: GlobPatternStub({ value: '' }),
    });

    expect(result).toStrictEqual([
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/dist/**' }),
      GlobPatternStub({ value: '**/build/**' }),
      GlobPatternStub({ value: '**/.git/**' }),
    ]);
  });
});
