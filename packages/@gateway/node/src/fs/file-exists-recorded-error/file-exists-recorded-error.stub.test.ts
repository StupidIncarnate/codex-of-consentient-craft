import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from '../../os/os';
import { writeFileExclusive } from '../../fs__promises/write-file-exclusive/write-file-exclusive';
import { FileExistsRecordedErrorStub } from './file-exists-recorded-error.stub';

describe('FileExistsRecordedErrorStub', () => {
  it('VALID: {path of a file that exists} => matches a real exclusive-create EEXIST field for field', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-eexist-'));
    const path = join(dir, 'boot.lock');
    writeFileSync(path, 'held');

    const caught: unknown = await writeFileExclusive(path, 'mine').catch((error: unknown) => error);
    const real = caught as NodeJS.ErrnoException;
    rmSync(dir, { recursive: true, force: true });
    const recorded = FileExistsRecordedErrorStub({ path });

    expect({
      message: recorded.message,
      errno: recorded.errno,
      code: recorded.code,
      syscall: recorded.syscall,
      path: recorded.path,
    }).toStrictEqual({
      message: real.message,
      errno: real.errno,
      code: real.code,
      syscall: real.syscall,
      path: real.path,
    });
  });
});
