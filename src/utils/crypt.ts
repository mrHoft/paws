export class Crypt {
  private key: string

  constructor() {
    const variant: string[] = [
      navigator.language || 'en',
      navigator.userAgent.slice(navigator.userAgent.lastIndexOf(' ') + 1) || 'Chrome/141.0',
      (navigator.hardwareConcurrency || 12).toString()
    ]
    this.key = btoa(variant.join('')).slice(0, 16);
  }

  protected encrypt<T = Record<string, unknown>>(data: T) {
    return this.simpleObfuscate<T>(data, this.key);
  }

  protected decrypt<T>(encryptedData: string) {
    return this.simpleDeobfuscate<T>(encryptedData, this.key);
  }

  private simpleObfuscate<T = Record<string, unknown>>(data: T, key: string): string {
    const jsonString = JSON.stringify(data);
    let result = '';
    for (let i = 0; i < jsonString.length; i++) {
      result += String.fromCharCode(jsonString.charCodeAt(i) ^ key.charCodeAt(i % 16));
    }
    return btoa(result);
  }

  private simpleDeobfuscate<T = Record<string, unknown>>(encryptedData: string, key: string): T | null {
    try {
      const decoded = atob(encryptedData);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % 16));
      }
      return JSON.parse(result);
    } catch {
      return null
    }
  }
}
