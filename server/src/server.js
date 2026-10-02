import app from "./app.js";
import { env } from "./core/config/env.js";
import { connectDatabase } from "./core/config/db.js";
await connectDatabase();
app.listen(env.port, () => console.log(`Employee ERP API listening on port ${env.port}`));
