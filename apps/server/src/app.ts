import { Elysia } from "elysia";
import { jobRoutes } from "./routes/jobs";

export const app = new Elysia().use(jobRoutes);
