import { toolInputGetContentChangesBroker } from './tool-input-get-content-changes-broker';
import { toolInputGetContentChangesBrokerProxy } from './tool-input-get-content-changes-broker.proxy';
import { EditToolInputStub } from '../../../contracts/edit-tool-input/edit-tool-input.stub';
import { MultiEditToolInputStub } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input.stub';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('toolInputGetContentChangesBroker', () => {
  describe('Write tool', () => {
    it('VALID: WriteToolInput with existing file => returns old and new content', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/file.txt' });
      const toolInput = WriteToolInputStub({
        file_path: filePath,
        content: 'New content',
      });

      proxy.setupReadFileSuccess({ filePath, content: FileContentsStub({ value: 'Old content' }) });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Old content',
          newContent: 'New content',
        },
      ]);
    });

    it('VALID: WriteToolInput with new file (ENOENT) => returns empty old content and new content', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/newfile.txt' });
      const toolInput = WriteToolInputStub({
        file_path: filePath,
        content: 'New file content',
      });

      proxy.setupReadFileNotFound({ filePath });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: '',
          newContent: 'New file content',
        },
      ]);
    });

    it('ERROR: WriteToolInput file read error (not ENOENT) => throws error', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/file.txt' });
      const toolInput = WriteToolInputStub({
        file_path: filePath,
        content: 'New content',
      });

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      proxy.setupReadFileError({ filePath, error });

      await expect(toolInputGetContentChangesBroker({ toolInput })).rejects.toThrow(
        /Permission denied/u,
      );
    });
  });

  describe('Edit tool', () => {
    it('VALID: EditToolInput simple text replacement => returns full file content with changes applied', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/file.txt' });
      const toolInput = EditToolInputStub({
        file_path: filePath,
        old_string: 'Hello',
        new_string: 'Hi',
      });

      const existingContent = FileContentsStub({ value: 'Hello world!' });
      proxy.setupReadFileSuccess({ filePath, content: existingContent });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Hello world!',
          newContent: 'Hi world!',
        },
      ]);
    });

    it('EDGE: EditToolInput with full file context => should return full file content before and after edit for proper linting', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const existingFileContent = `function test(param: string): void {
  console.log(param);
}`;

      const filePath = FilePathStub({ value: '/test/example.ts' });
      const toolInput = EditToolInputStub({
        file_path: filePath,
        old_string: 'function test(param: string): void {',
        new_string: 'function test(param: any): void {',
      });

      const contents = FileContentsStub({ value: existingFileContent });
      proxy.setupReadFileSuccess({ filePath, content: contents });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: existingFileContent,
          newContent: `function test(param: any): void {
  console.log(param);
}`,
        },
      ]);
    });
  });

  describe('MultiEdit tool', () => {
    it('VALID: MultiEditToolInput with existing file => returns full file before and after changes', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/file.txt' });
      const toolInput = MultiEditToolInputStub({
        file_path: filePath,
        edits: [
          { old_string: 'Hello', new_string: 'Hi' },
          { old_string: 'world', new_string: 'universe' },
        ],
      });

      const contents = FileContentsStub({ value: 'Hello world' });
      proxy.setupReadFileSuccess({ filePath, content: contents });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Hello world',
          newContent: 'Hi universe',
        },
      ]);
    });

    it('VALID: MultiEditToolInput with new file (ENOENT) => returns empty array', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/newfile.txt' });
      const toolInput = MultiEditToolInputStub({
        file_path: filePath,
        edits: [{ old_string: 'placeholder', new_string: 'content' }],
      });

      proxy.setupReadFileNotFound({ filePath });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: MultiEditToolInput file read error (not ENOENT) => throws error', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const filePath = FilePathStub({ value: '/test/file.txt' });
      const toolInput = MultiEditToolInputStub({
        file_path: filePath,
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      });

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      proxy.setupReadFileError({ filePath, error });

      await expect(toolInputGetContentChangesBroker({ toolInput })).rejects.toThrow(
        /Permission denied/u,
      );
    });
  });
});
