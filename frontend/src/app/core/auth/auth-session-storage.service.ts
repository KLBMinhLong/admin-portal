import { Injectable } from '@angular/core';
import { UserProfile } from '../models/auth.models';
import { AesGcmEncryptionService, EncryptedPayload } from '../security';

export interface StoredAuthSession {
  token: string;
  user: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionStorageService {
  private readonly tokenKey = 'auth_token_enc';
  private readonly userKey = 'auth_user_enc';

  constructor(private readonly encryptionService: AesGcmEncryptionService) {}

  async saveSession(session: StoredAuthSession): Promise<void> {
    try {
      await Promise.all([
        this.storeEncrypted(this.tokenKey, session.token),
        this.storeEncrypted(this.userKey, JSON.stringify(session.user)),
      ]);
    } catch {
      this.clearSession();
    }
  }

  async loadSession(): Promise<StoredAuthSession | null> {
    const tokenEnc = localStorage.getItem(this.tokenKey);
    const userEnc = localStorage.getItem(this.userKey);

    if (!tokenEnc || !userEnc) {
      return null;
    }

    try {
      const token = await this.decryptStored(tokenEnc);
      const userJson = await this.decryptStored(userEnc);
      const user = JSON.parse(userJson) as UserProfile;

      return { token, user };
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  private async storeEncrypted(key: string, plaintext: string): Promise<void> {
    const encrypted = await this.encryptionService.encrypt(plaintext);
    localStorage.setItem(key, JSON.stringify(encrypted));
  }

  private async decryptStored(stored: string): Promise<string> {
    const payload = JSON.parse(stored) as EncryptedPayload;
    return this.encryptionService.decrypt(payload);
  }
}
