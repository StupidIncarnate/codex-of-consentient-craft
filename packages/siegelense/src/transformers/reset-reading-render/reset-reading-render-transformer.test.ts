import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ResetReadingStub } from '../../contracts/reset-reading/reset-reading.stub';
import { ResetUndidStub } from '../../contracts/reset-undid/reset-undid.stub';
import { resetReadingRenderTransformer } from './reset-reading-render-transformer';

describe('resetReadingRenderTransformer', () => {
  it('VALID: {default stub} => serializes to ContentText JSON string', () => {
    const reading = ResetReadingStub();

    const result = resetReadingRenderTransformer({ reading });

    expect(result).toBe(
      '{"restored":"clean","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}',
    );
  });

  it('VALID: {reading with custom diff} => serializes full reset reading to ContentText JSON string', () => {
    const reading = ResetReadingStub({
      restored: ContentTextStub({ value: 'page storage' }),
      undid: ResetUndidStub({ files: 3, added: 1, modified: 2, removed: 0 }),
      NOT_cleared: [
        ContentTextStub({ value: 'disk' }),
        ContentTextStub({ value: 'server memory' }),
      ],
    });

    const result = resetReadingRenderTransformer({ reading });

    expect(result).toBe(
      '{"restored":"page storage","undid":{"files":3,"added":1,"modified":2,"removed":0},"NOT_cleared":["disk","server memory"]}',
    );
  });
});
