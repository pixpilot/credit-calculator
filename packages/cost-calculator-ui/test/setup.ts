import '@testing-library/jest-dom/vitest';

/** No-op layout observer for the shadcn slider in jsdom. */
class NoopResizeObserver implements ResizeObserver {
  observe(): undefined {
    return undefined;
  }

  unobserve(): undefined {
    return undefined;
  }

  disconnect(): undefined {
    return undefined;
  }
}

globalThis.ResizeObserver ??= NoopResizeObserver;
