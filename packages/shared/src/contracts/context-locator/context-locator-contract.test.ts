import { contextLocatorContract } from './context-locator-contract';
import { ContextLocatorStub } from './context-locator.stub';

describe('contextLocatorContract', () => {
  it('VALID: {page, section} => parses successfully', () => {
    const locator = ContextLocatorStub({
      page: '/admin/users',
      section: '#permissions',
    });

    expect(locator).toStrictEqual({
      page: '/admin/users',
      section: '#permissions',
    });
  });

  it('VALID: {page only} => parses with page only', () => {
    const locator = ContextLocatorStub({ page: '/dashboard' });

    expect(locator).toStrictEqual({
      page: '/dashboard',
    });
  });

  it('VALID: {section only} => parses with section only', () => {
    const locator = ContextLocatorStub({ section: '.modal' });

    expect(locator).toStrictEqual({
      section: '.modal',
    });
  });

  it('EMPTY: {} => parses empty locator', () => {
    const locator = ContextLocatorStub({});

    expect(locator).toStrictEqual({});
  });

  it('VALID: {default} => parses with default empty locator', () => {
    const locator = ContextLocatorStub();

    expect(locator).toStrictEqual({});
  });

  it('INVALID_PAGE: {page: 123} => throws validation error', () => {
    const parseInvalidPage = (): unknown => contextLocatorContract.parse({ page: 123 });

    expect(parseInvalidPage).toThrow(/Expected string/u);
  });
});
