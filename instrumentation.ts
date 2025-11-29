export async function register() {
  // Mock localStorage for server-side rendering
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Create a minimal localStorage mock for Node.js environment
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
}
