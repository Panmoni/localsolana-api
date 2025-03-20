import { JwtPayload } from "jsonwebtoken";

declare module "express" {
  interface Request {
    user?: JwtPayload; // Optional because it’s only set after middleware
  }
}
