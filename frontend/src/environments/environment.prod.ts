export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
  apiKey: '__API_KEY__', // Placeholder sẽ được replace bởi Docker entrypoint
  encryption: {
    enabled: true,
    secretKey: '__ENCRYPT_SECRET__', // Placeholder sẽ được replace bởi Docker entrypoint
  },
  logging: {
    level: 'WARN', // Only show WARN and ERROR in prod console
    sendErrorToServer: false, // Auto send ERRORs to backend (Disabled as endpoint is missing)
  }
};
