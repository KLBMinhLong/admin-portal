import { TestBed } from '@angular/core';
import { AesGcmEncryptionService } from './aes-gcm-encryption.service';
import { environment } from '@env/environment';

describe('AesGcmEncryptionService', () => {
  let service: AesGcmEncryptionService;

  beforeEach(() => {
    // Đảm bảo environment có key chuẩn cho test
    environment.encryption.enabled = true;
    environment.encryption.secretKey = 'testkey_changeme_32chars_1234567';

    TestBed.configureTestingModule({
      providers: [AesGcmEncryptionService]
    });
    service = TestBed.inject(AesGcmEncryptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should verify enabled status', () => {
    expect(service.isEnabled()).toBeTrue();
  });

  it('should encrypt and decrypt payload successfully (round-trip)', async () => {
    const plainText = JSON.stringify({ message: 'Hello World', amount: 50000 });
    
    // Encrypt
    const encrypted = await service.encrypt(plainText);
    
    expect(encrypted).toBeDefined();
    expect(encrypted.data).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    
    // Decrypt
    const decryptedText = await service.decrypt(encrypted);
    
    expect(decryptedText).toEqual(plainText);
  });

  it('should throw error when decrypting with wrong IV format', async () => {
    const fakePayload = { data: 'someData', iv: 'wrongIvLength' };
    
    try {
      await service.decrypt(fakePayload);
      fail('Should have thrown an error');
    } catch (e: any) {
      expect(e.message).toContain('INVALID_ENCRYPTED_PAYLOAD');
    }
  });
});
