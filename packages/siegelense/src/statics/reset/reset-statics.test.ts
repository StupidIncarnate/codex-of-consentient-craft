import { resetStatics } from './reset-statics';

describe('resetStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(resetStatics).toStrictEqual({
      notCleared: {
        page: ['disk', 'server memory'],
        state: ['server memory', 'open websockets'],
        instance: [],
      },
      storageSkipped: {
        noOrigin: 'browser storage (page has no origin yet)',
      },
      blankPageUrl: 'about:blank',
    });
  });

  it('VALID: notCleared.page => contains disk and server memory', () => {
    expect(resetStatics.notCleared.page).toStrictEqual(['disk', 'server memory']);
  });

  it('VALID: notCleared.state => contains server memory and open websockets', () => {
    expect(resetStatics.notCleared.state).toStrictEqual(['server memory', 'open websockets']);
  });

  it('EMPTY: notCleared.instance => lists nothing, because the servers restart', () => {
    expect(resetStatics.notCleared.instance).toStrictEqual([]);
  });
});
