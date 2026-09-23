import '@testing-library/jest-dom/vitest';

/**
 * jsdom does not implement ResizeObserver, and the Radix primitives behind the
 * shadcn slider measure their thumbs with it on mount. A no-op observer is
 * enough: nothing in these tests asserts on layout.
 */
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

/**
 * The pricing scenario picker is a Radix select, which captures the pointer
 * and scrolls its options into view. jsdom implements neither, so opening one
 * in a test throws before anything can be asserted about what it selected.
 */
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;
Element.prototype.scrollIntoView ??= () => undefined;
