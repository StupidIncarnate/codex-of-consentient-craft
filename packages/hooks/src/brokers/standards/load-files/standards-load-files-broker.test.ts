import { standardsLoadFilesBroker } from './standards-load-files-broker';
import { standardsLoadFilesBrokerProxy } from './standards-load-files-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('standardsLoadFilesBroker', () => {
  it('VALID: standards files exist => returns concatenated content with headers', async () => {
    const proxy = standardsLoadFilesBrokerProxy();
    const cwd = FilePathStub({ value: '/test' });

    proxy.setupStandardsLoad({ content: 'Test standards content' });

    const result = await standardsLoadFilesBroker({ cwd });

    expect(result).toBe(
      '\n\n# CODING STANDARDS\n\nTest standards content\n\n# TESTING STANDARDS\n\nTest standards content',
    );
  });

  it('VALID: no standards files exist => returns empty string', async () => {
    const proxy = standardsLoadFilesBrokerProxy();
    const cwd = FilePathStub({ value: '/test' });

    proxy.setupFileNotFound();

    const result = await standardsLoadFilesBroker({ cwd });

    expect(result).toBe('');
  });
});
