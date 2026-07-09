import { config as loadEnv } from "dotenv";
loadEnv({
  path: ".env",
  override: true,
});

export const getEnv = (key: string, defaultValue: string = ""): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`Enviroment variable ${key} is not set`);
  }
  return value;
};
