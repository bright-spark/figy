// Polyfills for Figma plugin environment
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

if (typeof global === 'undefined') {
  (window as any).global = window;
}

if (typeof self === 'undefined') {
  (window as any).self = window;
}

export {};
