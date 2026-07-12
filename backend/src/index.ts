import express from "express";
import cors from "cors";
import { config as loadEnv } from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { config } from "./config/app.config";
import connectToDatabase from "./db/connection";
import webhookRoutes from "./routes/webhook.routes";
import blobRoutes from "./routes/blob.routes";
import photoDetailsRoutes from "./routes/photoDetails.routes";
import subjectsRoutes from "./routes/subjects.routes";
import appUsersRoutes from "./routes/appUsers.routes";
import { errorHandler } from "./middlewares/error.middlewares";
import cookieParser from "cookie-parser";

loadEnv({ path: ".env", override: true });

const app = express();
const port = config.APPLICATION_PORT;

app.use(cors({
  origin: [config.FRONTEND_ORIGIN],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

app.use("/webhooks", webhookRoutes);

app.use(clerkMiddleware());

app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/blob", blobRoutes);
app.use("/photos", photoDetailsRoutes);
app.use("/subjects", subjectsRoutes);
app.use("/users", appUsersRoutes);

app.use(errorHandler);

connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
