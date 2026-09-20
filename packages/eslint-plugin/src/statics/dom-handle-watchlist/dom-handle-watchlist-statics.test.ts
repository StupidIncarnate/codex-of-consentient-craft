import { domHandleWatchlistStatics } from './dom-handle-watchlist-statics';

describe('domHandleWatchlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(domHandleWatchlistStatics).toStrictEqual({
      bannedImportSources: [
        'react',
        'react-dom',
        '@playwright/test',
        'playwright',
        'playwright-core',
      ],
      selectorMemberNames: [
        'getByTestId',
        'getByRole',
        'getByText',
        'getByLabel',
        'getByPlaceholder',
        'getByAltText',
        'getByTitle',
        'locator',
        'querySelector',
        'querySelectorAll',
        'getElementById',
      ],
      positionMemberNames: ['boundingBox', 'getBoundingClientRect'],
      refCallNames: ['useRef', 'createRef'],
    });
  });
});
