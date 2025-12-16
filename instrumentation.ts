export async function register() {
  // Mock localStorage for server-side rendering
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Create a minimal localStorage mock for Node.js environment
    interface LocalStorageMock {
      getItem: () => null;
      setItem: () => void;
      removeItem: () => void;
      clear: () => void;
      key: () => null;
      length: number;
    }

    (global as typeof global & { localStorage: LocalStorageMock }).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
}
