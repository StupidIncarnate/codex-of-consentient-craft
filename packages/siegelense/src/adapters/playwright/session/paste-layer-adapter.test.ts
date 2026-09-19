import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { SelectorStub } from '../../../contracts/selector/selector.stub';
import { refRegistryLayerAdapter } from './ref-registry-layer-adapter';
import { pasteLayerAdapter } from './paste-layer-adapter';
import { pasteLayerAdapterProxy } from './paste-layer-adapter.proxy';

describe('pasteLayerAdapter', () => {
  it('VALID: pastes text into target element', async () => {
    const proxy = pasteLayerAdapterProxy();
    const { page, getFocusCalls, getKeyboardPressCalls, getEvaluateCalls } = proxy.page();

    const target = SelectorStub({ value: '[data-testid="INPUT"]' });
    const result = await pasteLayerAdapter({
      page,
      target,
      within: null,
      ref: null,
      filePath: null,
      value: 'hello world',
      timeoutMs: 5000,
    });

    expect(result).toStrictEqual({ success: true });
    expect(getFocusCalls()).toStrictEqual([{ selector: target, options: { timeout: 5000 } }]);
    expect(getKeyboardPressCalls()).toStrictEqual(['ControlOrMeta+V']);
    expect(getEvaluateCalls()).toStrictEqual([{ fn: expect.any(Function), arg: 'hello world' }]);
  });

  it('VALID: pastes text into scoped target element with within', async () => {
    const proxy = pasteLayerAdapterProxy();
    const { page, getFocusCalls, getKeyboardPressCalls } = proxy.page();

    const target = '[data-testid="INPUT"]';
    const within = '[data-testid="FORM"]';
    const result = await pasteLayerAdapter({
      page,
      target,
      within,
      ref: null,
      filePath: null,
      value: 'scoped-text',
      timeoutMs: 3000,
    });

    expect(result).toStrictEqual({ success: true });
    expect(getFocusCalls()).toStrictEqual([
      {
        selector: '[data-testid="FORM"] [data-testid="INPUT"]',
        options: { timeout: 3000 },
      },
    ]);
    expect(getKeyboardPressCalls()).toStrictEqual(['ControlOrMeta+V']);
  });

  it('VALID: pastes text into ref element', async () => {
    const proxy = pasteLayerAdapterProxy();
    const refRegistry = refRegistryLayerAdapter();
    const { page, getFocusCalls, getKeyboardPressCalls, getEvaluateCalls } = proxy.page();

    const result = await pasteLayerAdapter({
      page,
      target: null,
      within: null,
      ref: 14,
      filePath: null,
      value: 'ref-text',
      timeoutMs: 4000,
    });

    expect(result).toStrictEqual({ success: true });
    expect(getFocusCalls()).toStrictEqual([
      { selector: '[siege-target]', options: { timeout: 4000 } },
    ]);
    expect(getKeyboardPressCalls()).toStrictEqual(['ControlOrMeta+V']);
    expect(getEvaluateCalls()).toStrictEqual([
      { fn: refRegistry.stampSource({ ref: 14 }), arg: undefined },
      { fn: refRegistry.unstampSource(), arg: undefined },
      { fn: expect.any(Function), arg: 'ref-text' },
    ]);
  });

  it('VALID: pastes file into target element', async () => {
    const proxy = pasteLayerAdapterProxy();
    const filePath = FilePathStub({ value: '/tmp/test-image.png' });
    proxy.setupFileExists({ filePath, content: Buffer.from('fake-png') });
    const { page, getFocusCalls, getKeyboardPressCalls, getEvaluateCalls } = proxy.page();

    const target = SelectorStub({ value: '[data-testid="DROPZONE"]' });
    const result = await pasteLayerAdapter({
      page,
      target,
      within: null,
      ref: null,
      filePath,
      value: null,
      timeoutMs: 5000,
    });

    expect(result).toStrictEqual({ success: true });
    expect(getFocusCalls()).toStrictEqual([{ selector: target, options: { timeout: 5000 } }]);
    expect(getKeyboardPressCalls()).toStrictEqual(['ControlOrMeta+V']);
    expect(getEvaluateCalls()).toStrictEqual([
      {
        fn: expect.any(Function),
        arg: { base64: Buffer.from('fake-png').toString('base64'), type: 'image/png' },
      },
    ]);
  });

  it('EDGE: pastes file with unknown extension using default mime type', async () => {
    const proxy = pasteLayerAdapterProxy();
    const filePath = FilePathStub({ value: '/tmp/data.custom' });
    proxy.setupFileExists({ filePath, content: Buffer.from('fake-custom') });
    const { page, getFocusCalls, getKeyboardPressCalls } = proxy.page();

    const target = SelectorStub({ value: '[data-testid="INPUT"]' });
    const result = await pasteLayerAdapter({
      page,
      target,
      within: null,
      ref: null,
      filePath,
      value: null,
      timeoutMs: 5000,
    });

    expect(result).toStrictEqual({ success: true });
    expect(getFocusCalls()).toStrictEqual([{ selector: target, options: { timeout: 5000 } }]);
    expect(getKeyboardPressCalls()).toStrictEqual(['ControlOrMeta+V']);
  });

  it('ERROR: throws error when file does not exist', async () => {
    const proxy = pasteLayerAdapterProxy();
    const filePath = FilePathStub({ value: '/tmp/nonexistent.png' });
    proxy.setupFileNotFound({ filePath });
    const { page } = proxy.page();

    await expect(
      pasteLayerAdapter({
        page,
        target: '[data-testid="INPUT"]',
        within: null,
        ref: null,
        filePath,
        value: null,
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('file at "/tmp/nonexistent.png" does not exist');
  });

  it('ERROR: throws error when neither target nor ref is provided', async () => {
    const proxy = pasteLayerAdapterProxy();
    const { page } = proxy.page();

    await expect(
      pasteLayerAdapter({
        page,
        target: null,
        within: null,
        ref: null,
        filePath: null,
        value: 'text',
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('either target or ref must be provided');
  });

  it('ERROR: throws error when neither filePath nor value is provided', async () => {
    const proxy = pasteLayerAdapterProxy();
    const { page } = proxy.page();

    await expect(
      pasteLayerAdapter({
        page,
        target: '[data-testid="INPUT"]',
        within: null,
        ref: null,
        filePath: null,
        value: null,
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('either filePath or value must be provided');
  });
});
