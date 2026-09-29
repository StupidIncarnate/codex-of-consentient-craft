import { NowMsStub } from '../now/now-ms.stub';
import { nowIso } from './now-iso';
import { nowIsoProxy } from './now-iso.proxy';

describe('nowIso', () => {
  it('VALID: {clock staged at 2024-01-01} => returns that instant as an ISO string', () => {
    const proxy = nowIsoProxy();
    proxy.setupNow({ ms: NowMsStub() });

    expect(nowIso()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('VALID: {two one-shots then setupNow} => successive reads follow the staged clock', () => {
    const proxy = nowIsoProxy();
    proxy.setupNow({ ms: 3000 });
    proxy.setupNowOnce({ ms: 1000 });
    proxy.setupNowOnce({ ms: 2000 });

    expect([nowIso(), nowIso(), nowIso()]).toStrictEqual([
      '1970-01-01T00:00:01.000Z',
      '1970-01-01T00:00:02.000Z',
      '1970-01-01T00:00:03.000Z',
    ]);
  });
});
