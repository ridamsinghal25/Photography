import sql from "mssql";
import { config } from "../config/app.config";
import { NodeEnv } from "../enums/enum";

const dbConfig = {
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  server: config.DB_SERVER,
  database: config.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: config.NODE_ENV === NodeEnv.Development ? true : false,
  },
};

async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log("✅ Connected to Azure SQL Database");
  } catch (err) {
    console.error("❌ Failed to connect to Azure SQL Database", err);
    process.exit(1);
  }
}

export default connectToDatabase;