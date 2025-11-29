// Mock localStorage for server-side rendering BEFORE importing SuperJSON
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

import SuperJSON from 'superjson';

// Create and export a SuperJSON instance
export const superjson = new SuperJSON();
