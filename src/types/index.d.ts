import MainReturnType from 'node-haxball/src/index';

declare global {
  interface Window {
    API: ReturnType<typeof MainReturnType>;
  }
}

export {};
