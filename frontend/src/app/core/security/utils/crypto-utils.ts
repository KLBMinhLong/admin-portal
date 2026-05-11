/**
 * CryptoUtils - Helper chuyển đổi dữ liệu phục vụ mã hóa.
 */
export class CryptoUtils {
  static encodeUtf8(text: string): ArrayBuffer {
    const bytes = new TextEncoder().encode(text);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }

  static decodeUtf8(bytes: ArrayBufferLike): string {
    return new TextDecoder().decode(bytes);
  }

  static arrayBufferToBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let index = 0; index < bytes.length; index++) {
      binary += String.fromCharCode(bytes[index]);
    }

    return btoa(binary);
  }

  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes.buffer;
  }

  static isEmptyText(value: unknown): value is '' {
    return typeof value === 'string' && value.length === 0;
  }

  static isValidEncryptedPayload(payload: unknown): payload is { data: string; iv: string } {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as { data?: unknown }).data === 'string' &&
      typeof (payload as { iv?: unknown }).iv === 'string'
    );
  }
}