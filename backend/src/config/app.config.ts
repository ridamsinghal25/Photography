import { getEnv } from "../lib/getEnv";

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),

  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "localhost"),

  DB_SERVER: getEnv("DB_SERVER", ""),
  DB_DATABASE: getEnv("DB_DATABASE", ""),
  DB_USER: getEnv("DB_USER", ""),
  DB_PASSWORD: getEnv("DB_PASSWORD", ""),
  DB_PORT: getEnv("DB_PORT", "1433"),

  AZURE_STORAGE_CONNECTION_STRING: getEnv("AZURE_STORAGE_CONNECTION_STRING"),
  AZURE_STORAGE_CONTAINER_NAME: getEnv("AZURE_STORAGE_CONTAINER_NAME"),

  CLERK_WEBHOOK_SECRET: getEnv("CLERK_WEBHOOK_SECRET"),
  CLERK_PUBLISHABLE_KEY: getEnv("CLERK_PUBLISHABLE_KEY"),
  CLERK_SECRET_KEY: getEnv("CLERK_SECRET_KEY"),
  APPLICATION_PORT: getEnv("APPLICATION_PORT", "4000"),
});

export const config = appConfig();
