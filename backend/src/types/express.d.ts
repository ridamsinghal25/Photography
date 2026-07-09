declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        email: string;
        name: string;
      };
    }
  }
}

export {};
