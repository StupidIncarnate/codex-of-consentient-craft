import { pasteStatics } from './paste-statics';

describe('pasteStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(pasteStatics).toStrictEqual({
      mimeTypes: {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        txt: 'text/plain',
        html: 'text/html',
        json: 'application/json',
        default: 'application/octet-stream',
      },
      templates: {
        text: {
          ref: 'pasted "{value}" into ref {ref}',
          target: 'pasted "{value}" into {target}',
          within: 'pasted "{value}" into {target} within {within}',
        },
        file: {
          ref: 'pasted file "{filePath}" into ref {ref}',
          target: 'pasted file "{filePath}" into {target}',
          within: 'pasted file "{filePath}" into {target} within {within}',
        },
      },
    });
  });
});
