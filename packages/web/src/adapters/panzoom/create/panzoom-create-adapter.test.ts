import { panzoomCreateAdapter } from './panzoom-create-adapter';
import { panzoomCreateAdapterProxy } from './panzoom-create-adapter.proxy';

describe('panzoomCreateAdapter', () => {
  describe('instance creation', () => {
    it('VALID: {element} => creates panzoom instance with correct options', () => {
      const proxy = panzoomCreateAdapterProxy();
      const element = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(element);

      panzoomCreateAdapter({ element });

      expect(proxy.getConstructor()).toHaveBeenCalledWith(element, {
        maxScale: 5,
        minScale: 0.1,
        step: 0.3,
        startScale: 0.7,
      });
    });
  });

  describe('zoom controls', () => {
    it('VALID: {zoomIn called} => delegates to panzoom instance', () => {
      const proxy = panzoomCreateAdapterProxy();
      const element = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(element);

      const instance = panzoomCreateAdapter({ element });
      instance.zoomIn();

      expect(proxy.getInstance().zoomIn).toHaveBeenCalledTimes(1);
    });

    it('VALID: {zoomOut called} => delegates to panzoom instance', () => {
      const proxy = panzoomCreateAdapterProxy();
      const element = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(element);

      const instance = panzoomCreateAdapter({ element });
      instance.zoomOut();

      expect(proxy.getInstance().zoomOut).toHaveBeenCalledTimes(1);
    });

    it('VALID: {reset called} => delegates to panzoom instance', () => {
      const proxy = panzoomCreateAdapterProxy();
      const element = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(element);

      const instance = panzoomCreateAdapter({ element });
      instance.reset();

      expect(proxy.getInstance().reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('VALID: {destroy called} => destroys panzoom instance', () => {
      const proxy = panzoomCreateAdapterProxy();
      const element = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(element);

      const instance = panzoomCreateAdapter({ element });
      instance.destroy();

      expect(proxy.getInstance().destroy).toHaveBeenCalledTimes(1);
    });
  });
});
