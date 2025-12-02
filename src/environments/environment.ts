export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  timeout: 30000, 
  retryAttempts: 3,
  features: {
    auth: true,
    notifications: true
  }
};

