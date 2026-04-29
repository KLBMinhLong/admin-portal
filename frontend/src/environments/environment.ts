export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  apiKey: 'changeme',
  encryption: {
    enabled: true,
    // Phải trùng với ENCRYPT_SECRET ở backend (32 ký tự UTF-8)
    secretKey: 'encryptkey_changeme_32chars_1234',
  },
};
