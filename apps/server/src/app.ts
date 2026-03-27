import { Elysia } from "elysia";
import { statsRoutes } from "./routes/stats";
import { jobRoutes } from "./routes/jobs";
import { tagRoutes, jobTagRoutes } from "./routes/tags";

export const app = new Elysia()
  .use(statsRoutes)
  .use(jobRoutes)
  .use(tagRoutes)
  .use(jobTagRoutes);
