import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';

import { isReexportOnlyProgramGuard } from './is-reexport-only-program-guard';

describe('isReexportOnlyProgramGuard', () => {
  it('VALID: {body: export * from} => returns true', () => {
    const node = ProgramStub({ code: 'export * from "./a";' });

    expect(isReexportOnlyProgramGuard({ node })).toBe(true);
  });

  it('VALID: {body: export { x } from} => returns true', () => {
    const node = ProgramStub({ code: 'export { x } from "./a";' });

    expect(isReexportOnlyProgramGuard({ node })).toBe(true);
  });

  it('EMPTY: {body: []} => returns true', () => {
    const node = ProgramStub({ code: '' });

    expect(isReexportOnlyProgramGuard({ node })).toBe(true);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isReexportOnlyProgramGuard({})).toBe(false);
  });

  it('INVALID: {body: export const} => returns false', () => {
    const node = ProgramStub({ code: 'export const x;' });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: export { x } with no source} => returns false', () => {
    const node = ProgramStub({ code: 'export {  };' });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: an import beside a re-export} => returns false', () => {
    const node = ProgramStub({ code: 'import "./a";\nexport * from "./b";' });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });
});
