import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';

import { isTypesOnlyProgramGuard } from './is-types-only-program-guard';

describe('isTypesOnlyProgramGuard', () => {
  it('VALID: {body: export type alias} => returns true', () => {
    const node = ProgramStub({ code: 'export type OnLine = (line: string) => void;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(true);
  });

  it('VALID: {body: export interface} => returns true', () => {
    const node = ProgramStub({ code: 'export interface Api { load: () => void }' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(true);
  });

  it('VALID: {body: import type beside export type} => returns true', () => {
    const node = ProgramStub({
      code: 'import type { Line } from "./line";\nexport type OnLine = (line: Line) => void;',
    });

    expect(isTypesOnlyProgramGuard({ node })).toBe(true);
  });

  it('VALID: {body: unexported const beside export type} => returns true', () => {
    const node = ProgramStub({ code: 'const x = 1;\nexport type Y = number;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(true);
  });

  it('EMPTY: {body: []} => returns false', () => {
    const node = ProgramStub({ code: '' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isTypesOnlyProgramGuard({})).toBe(false);
  });

  it('INVALID: {body: export const and export type} => returns false', () => {
    const node = ProgramStub({ code: 'export const xContract = 1;\nexport type X = number;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: export function beside export type} => returns false', () => {
    const node = ProgramStub({ code: 'export function f() {}\nexport type X = number;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: export default beside export type} => returns false', () => {
    const node = ProgramStub({ code: 'export default 1;\nexport type X = number;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: export * beside export type} => returns false', () => {
    const node = ProgramStub({ code: 'export * from "./a";\nexport type X = number;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: value export list beside export type} => returns false', () => {
    const node = ProgramStub({ code: 'const a = 1;\nexport { a };\nexport type X = number;' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: only export type specifier list} => returns false', () => {
    const node = ProgramStub({ code: 'type X = number;\nexport type { X };' });

    expect(isTypesOnlyProgramGuard({ node })).toBe(false);
  });
});
