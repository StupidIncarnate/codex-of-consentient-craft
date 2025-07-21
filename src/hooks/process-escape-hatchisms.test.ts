import { processEscapeHatchisms } from './process-escape-hatchisms';

describe('processEscapeHatchisms', () => {
  it('should detect : any type annotations', () => {
    const content = `function test(param: any) { return param; }`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Syntax Violation Found ': any'");
  });

  it('should detect as any type assertions', () => {
    const content = `const value = someVar as any;`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Found 'as any'");
  });

  it('should detect <any> type assertions', () => {
    const content = `const value = <any>someVar;`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Found '<any>'");
  });

  it('should detect @ts-ignore comments', () => {
    const content = `// @ts-ignore\nconst value = invalidCode;`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Found '@ts-ignore'");
  });

  it('should detect @ts-expect-error comments', () => {
    const content = `// @ts-expect-error\nconst value = invalidCode;`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Found '@ts-expect-error'");
  });

  it('should detect @ts-nocheck comments', () => {
    const content = `// @ts-nocheck\nconst value = anything;`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Found '@ts-nocheck'");
  });

  it('should detect eslint-disable comments', () => {
    const content = `// eslint-disable-next-line\nconst unused = 5;`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain("Found 'eslint-disable'");
  });

  it('should not detect escape hatches in clean code', () => {
    const content = `
export function add(a: number, b: number): number {
  return a + b;
}

export interface User {
  name: string;
  age: number;
}
`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(false);
    expect(result.message).toBe('');
  });

  it('should detect multiple escape hatches', () => {
    const content = `
// @ts-ignore
function test(param: any): any {
  // eslint-disable-next-line
  return param as any;
}
`;
    const result = processEscapeHatchisms(content);
    expect(result.found).toBe(true);
    expect(result.message).toContain('@ts-ignore');
    expect(result.message).toContain(': any');
    expect(result.message).toContain('as any');
    expect(result.message).toContain('eslint-disable');
  });
});
