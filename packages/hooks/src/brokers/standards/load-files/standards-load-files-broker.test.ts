import { standardsLoadFilesBroker } from './standards-load-files-broker';

describe('standardsLoadFilesBroker', () => {
  it('VALID: all standards files exist => returns concatenated content', async () => {
    const path = require('path');
    const fs = require('fs');
    const fsPromises = require('fs/promises');

    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-standards.md')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValueOnce('Coding content')
      .mockResolvedValueOnce('Testing content');

    const result = await standardsLoadFilesBroker({ cwd: '/test' });

    expect(result).toBe(
      '\n\n# CODING STANDARDS\n\nCoding content\n\n# TESTING STANDARDS\n\nTesting content',
    );

    resolveSpy.mockRestore();
    existsSpy.mockRestore();
    readSpy.mockRestore();
  });

  it('VALID: only coding-standards.md exists => returns partial content', async () => {
    const path = require('path');
    const fs = require('fs');
    const fsPromises = require('fs/promises');

    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-standards.md')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

    const existsSpy = jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true) // Coding-standards.md exists
      .mockReturnValueOnce(false); // Testing-standards.md doesn't exist

    const readSpy = jest.spyOn(fsPromises, 'readFile').mockResolvedValueOnce('Coding content only');

    const result = await standardsLoadFilesBroker({ cwd: '/test' });

    expect(result).toBe('\n\n# CODING STANDARDS\n\nCoding content only');

    resolveSpy.mockRestore();
    existsSpy.mockRestore();
    readSpy.mockRestore();
  });

  it('VALID: only testing-standards.md exists => returns partial content', async () => {
    const path = require('path');
    const fs = require('fs');
    const fsPromises = require('fs/promises');

    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-standards.md')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

    const existsSpy = jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(false) // Coding-standards.md doesn't exist
      .mockReturnValueOnce(true); // Testing-standards.md exists

    const readSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValueOnce('Testing content only');

    const result = await standardsLoadFilesBroker({ cwd: '/test' });

    expect(result).toBe('\n\n# TESTING STANDARDS\n\nTesting content only');

    resolveSpy.mockRestore();
    existsSpy.mockRestore();
    readSpy.mockRestore();
  });

  it('VALID: no standards files exist => returns empty content', async () => {
    const path = require('path');
    const fs = require('fs');

    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-standards.md')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await standardsLoadFilesBroker({ cwd: '/test' });

    expect(result).toBe('');

    resolveSpy.mockRestore();
    existsSpy.mockRestore();
  });

  it('ERROR: file read error => logs error and continues with other files', async () => {
    const path = require('path');
    const fs = require('fs');
    const fsPromises = require('fs/promises');

    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-standards.md')
      .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce('Testing content');

    const result = await standardsLoadFilesBroker({ cwd: '/test' });

    expect(result).toBe('\n\n# TESTING STANDARDS\n\nTesting content');

    resolveSpy.mockRestore();
    existsSpy.mockRestore();
    readSpy.mockRestore();
  });
});
