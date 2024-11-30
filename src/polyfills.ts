// Polyfills for Figma plugin environment
declare global {
  interface Window {
    globalThis: typeof globalThis;
    global: GlobalWithFetch & GlobalWithFormData & GlobalWithBlob;
    self: typeof self;
  }
}

if (typeof globalThis === 'undefined') {
  (window as Window).globalThis = window;
}

if (typeof global === 'undefined') {
  (window as Window).global = window as GlobalWithFetch & GlobalWithFormData & GlobalWithBlob;
}

if (typeof self === 'undefined') {
  (window as Window).self = window;
}

interface GlobalWithFetch extends NodeJS.Global {
  fetch: typeof fetch;
}

interface GlobalWithFormData extends NodeJS.Global {
  FormData: typeof FormData;
}

interface GlobalWithBlob extends NodeJS.Global {
  Blob: typeof Blob;
}

export {};
