// Polyfills for browser APIs missing in jsdom that Mantine components require

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
