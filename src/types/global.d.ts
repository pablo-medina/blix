export {};

declare global {
  interface Window {
    electron?: {
      maximize: () => void;
      close: () => void;
    };
  }
  interface Document {
    getElementById(elementId: string): HTMLCanvasElement | null;
  }
}

