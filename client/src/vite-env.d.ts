/// <reference types="vite/client" />

declare module 'firebase/app' {
  export function initializeApp(config: any): any;
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export class GoogleAuthProvider {
    constructor();
    setCustomParameters(params: any): void;
  }
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
}
