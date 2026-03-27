import { app } from "./app";

app.listen(3000);
console.log(`Huntly server running at http://localhost:${app.server?.port}`);
