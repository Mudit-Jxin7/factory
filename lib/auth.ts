// Authentication credentials from environment variables
export const AUTH_CREDENTIALS = {
  username: process.env.NEXT_PUBLIC_LOGIN_USERNAME || 'admin',
  password: process.env.NEXT_PUBLIC_LOGIN_PASSWORD || 'admin123',
}
