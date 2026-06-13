export {};

declare global {
  interface Window {
    __TAURI__?: boolean;
  }
  interface Document {
    getElementById(elementId: string): HTMLCanvasElement | null;
  }
}

