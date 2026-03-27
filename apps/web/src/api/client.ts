import { treaty } from "@elysiajs/eden";
import type { app } from "@huntly/server/src/app";

export const api = treaty<typeof app>("http://localhost:3000");
