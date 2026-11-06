import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});
export const roleGrants = sqliteTable("role_grants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  scope: text("scope").notNull(),
  createdAt: text("created_at").notNull(),
});
export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull(),
  profession: text("profession").notNull().default(""),
  location: text("location").notNull().default(""),
  bio: text("bio").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});
export const workspaceRecords = sqliteTable("workspace_records", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  scope: text("scope").notNull(),
  ownerId: text("owner_id").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  scope: text("scope").notNull(),
  createdAt: text("created_at").notNull(),
});
