import { Request, Response } from "express";
import { Webhook } from "svix";
import { config } from "../config/app.config";
import appUsersService from "../services/appUsers.services";
import { ApiError } from "../lib/ApiError";
import { ApiResponse } from "../lib/ApiResponse";

export const clerkWebhook = async (req: Request, res: Response) => {
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json(new ApiError(400, "Missing svix headers"));
    return;
  }

  const body = req.body.toString(); // req.body is a Buffer from express.raw()
  const wh = new Webhook(config.CLERK_WEBHOOK_SECRET);

  let event: any;
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch {
    res
      .status(400)
      .json(
        new ApiError(400, "Invalid webhook signature"),
      );
    return;
  }

  if (event.type === "user.created") {
    const { id, email_addresses, primary_email_address_id, first_name, last_name } = event.data;

    const primaryEmail = email_addresses.find(
      (e: any) => e.id === primary_email_address_id
    );

    if (!primaryEmail) {
      res
        .status(400)
        .json(
          new ApiError(400, "No primary email found"),
        );
      return;
    }

    await appUsersService.createUser(
      id,
      primaryEmail.email_address,
      `${first_name ?? ""} ${last_name ?? ""}`.trim()
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Webhook received successfully"),
    );
};
