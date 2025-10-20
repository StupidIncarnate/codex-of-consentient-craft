import { isNpmPackageImportGuard } from './is-npm-package-import-guard';

describe('isNpmPackageImportGuard', () => {
  it('VALID: {importSource: "axios"} => returns true', () => {
    expect(isNpmPackageImportGuard({ importSource: 'axios' })).toBe(true);
  });

  it('VALID: {importSource: "@questmaestro/shared"} => returns true', () => {
    expect(isNpmPackageImportGuard({ importSource: '@questmaestro/shared' })).toBe(true);
  });

  it('VALID: {importSource: "react"} => returns true', () => {
    expect(isNpmPackageImportGuard({ importSource: 'react' })).toBe(true);
  });

  it('VALID: {importSource: "@types/node"} => returns true', () => {
    expect(isNpmPackageImportGuard({ importSource: '@types/node' })).toBe(true);
  });

  it('VALID: {importSource: "lodash/get"} => returns true', () => {
    expect(isNpmPackageImportGuard({ importSource: 'lodash/get' })).toBe(true);
  });

  it('INVALID_RELATIVE: {importSource: "./foo"} => returns false', () => {
    expect(isNpmPackageImportGuard({ importSource: './foo' })).toBe(false);
  });

  it('INVALID_RELATIVE: {importSource: "../bar"} => returns false', () => {
    expect(isNpmPackageImportGuard({ importSource: '../bar' })).toBe(false);
  });

  it('INVALID_RELATIVE: {importSource: "./utils/helper"} => returns false', () => {
    expect(isNpmPackageImportGuard({ importSource: './utils/helper' })).toBe(false);
  });

  it('INVALID_RELATIVE: {importSource: "../../shared"} => returns false', () => {
    expect(isNpmPackageImportGuard({ importSource: '../../shared' })).toBe(false);
  });

  it('INVALID_ABSOLUTE: {importSource: "/absolute/path"} => returns false', () => {
    expect(isNpmPackageImportGuard({ importSource: '/absolute/path' })).toBe(false);
  });

  it('EMPTY: {importSource: ""} => returns false', () => {
    expect(isNpmPackageImportGuard({ importSource: '' })).toBe(false);
  });

  it('EMPTY: {importSource omitted} => returns false', () => {
    expect(isNpmPackageImportGuard({})).toBe(false);
  });
});
