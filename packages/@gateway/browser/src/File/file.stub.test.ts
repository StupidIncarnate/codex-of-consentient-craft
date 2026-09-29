import { File } from './File';
import { FileStub } from './file.stub';

describe('FileStub', () => {
  it('VALID: {given fields} => a real File carrying them', () => {
    const file = FileStub({ text: 'abcd', name: 'shot.png', type: 'image/jpeg' });

    expect({
      isFile: file instanceof File,
      name: file.name,
      type: file.type,
      size: file.size,
    }).toStrictEqual({ isFile: true, name: 'shot.png', type: 'image/jpeg', size: 4 });
  });

  it('VALID: {} => the documented defaults', () => {
    const file = FileStub();

    expect({ name: file.name, type: file.type, size: file.size }).toStrictEqual({
      name: 'pasted-image',
      type: 'image/png',
      size: 5,
    });
  });
});
