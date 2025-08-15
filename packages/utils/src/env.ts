/**
 * Environment variable utilities
 */

export function validateEnvVars(): void {
  const requiredVars = [
    'TWITTER_API_KEY',
    'SLACK_WEBHOOK_URL'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

export function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}
