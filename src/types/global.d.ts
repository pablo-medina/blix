export {};

declare global {
  interface Window {
    electron?: {
      maximize: () => void;
      close: () => void;
    };
  }
}

