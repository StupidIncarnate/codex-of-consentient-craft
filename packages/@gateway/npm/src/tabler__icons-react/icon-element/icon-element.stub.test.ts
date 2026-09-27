import { IconElementStub } from './icon-element.stub';
import { IconSend } from '@tabler/icons-react';

describe('IconElementStub', () => {
  it('VALID: {} => a real ReactElement whose type is the real IconSend component', () => {
    const icon = IconElementStub();

    expect(icon.type).toBe(IconSend);
  });
});
