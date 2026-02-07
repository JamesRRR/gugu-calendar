/**
 * Jest Configuration - Gugu Calendar
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.spec.js'],
  setupFilesAfterEnv: ['<rootDir>/e2e/utils/init.js'],
  testTimeout: 30000,
  verbose: true
};
