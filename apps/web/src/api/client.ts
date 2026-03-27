import { treaty } from "@elysiajs/eden";
import type { app } from "../../../server/src/app";

export const client = treaty<typeof app>("http://localhost:3000");
