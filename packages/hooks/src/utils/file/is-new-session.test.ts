import { isNewSession } from './is-new-session';

describe('isNewSession', () => {
  it("VALID: file doesn't exist => returns true", async () => {
    const fs = require('fs');
    const spy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await isNewSession({ transcriptPath: '/test/nonexistent.txt' });

    expect(result).toBe(true);
    spy.mockRestore();
  });

  it('VALID: file exists and size < 1024 => returns true', async () => {
    const fs = require('fs');
    const fsPromises = require('fs/promises');
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const statSpy = jest
      .spyOn(fsPromises, 'stat')
      .mockResolvedValue({ size: 500 } as import('fs').Stats);

    const result = await isNewSession({ transcriptPath: '/test/small.txt' });

    expect(result).toBe(true);
    existsSpy.mockRestore();
    statSpy.mockRestore();
  });

  it('VALID: file exists and size >= 1024 => returns false', async () => {
    const fs = require('fs');
    const fsPromises = require('fs/promises');
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const statSpy = jest
      .spyOn(fsPromises, 'stat')
      .mockResolvedValue({ size: 2048 } as import('fs').Stats);

    const result = await isNewSession({ transcriptPath: '/test/large.txt' });

    expect(result).toBe(false);
    existsSpy.mockRestore();
    statSpy.mockRestore();
  });

  it('ERROR: file stat error => returns true', async () => {
    const fs = require('fs');
    const fsPromises = require('fs/promises');
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const statSpy = jest
      .spyOn(fsPromises, 'stat')
      .mockRejectedValue(new Error('Permission denied'));

    const result = await isNewSession({ transcriptPath: '/test/error.txt' });

    expect(result).toBe(true);
    existsSpy.mockRestore();
    statSpy.mockRestore();
  });
});
