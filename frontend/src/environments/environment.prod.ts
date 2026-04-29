export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
  apiKey: '__API_KEY__', // Placeholder sẽ được replace bởi Docker entrypoint
  encryption: {
    enabled: true,
    secretKey: '__ENCRYPT_SECRET__', // Placeholder sẽ được replace bởi Docker entrypoint
  },
};
