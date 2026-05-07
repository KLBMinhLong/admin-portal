export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  encryption: {
    enabled: true,
    // Phải trùng với ENCRYPT_SECRET ở backend (32 ký tự UTF-8)
    secretKey: '__ENCRYPT_SECRET__',
  },
  logging: {
    level: 'DEBUG', // log everything locally
    sendErrorToServer: false, // no need to upload errors to server in dev
  }
};
