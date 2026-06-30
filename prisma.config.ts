import "dotenv/config";
import { defineConfig } from "prisma/config";

const url =
  process.env.NODE_ENV === "production"
    ? process.env["TURSO_DATABASE_URL"]
    : process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: { url },
});