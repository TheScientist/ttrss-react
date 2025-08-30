import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock IntersectionObserver to avoid hanging observers in JSDOM
class MockIntersectionObserver {
  constructor() {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [] as any[];
}
// @ts-expect-error jsdom lacks IO
global.IntersectionObserver = MockIntersectionObserver as any;

// Mock ResizeObserver if used by MUI / TreeView
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
// @ts-expect-error jsdom lacks RO
global.ResizeObserver = MockResizeObserver as any;

// Ensure RAF is synchronous to avoid lingering callbacks
const rafIds = new Set<number>();
let rafSeq = 1;
// @ts-expect-error jsdom lacks RAF
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  const id = rafSeq++;
  rafIds.add(id);
  // execute immediately
  cb(performance.now());
  rafIds.delete(id);
  return id as any;
};
// @ts-expect-error jsdom lacks cancelRAF
global.cancelAnimationFrame = (id: number) => {
  rafIds.delete(id);
};

// Ensure we restore mocks between tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});
