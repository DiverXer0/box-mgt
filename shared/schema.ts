import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const boxes = sqliteTable("boxes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  boxId: text("box_id").notNull().references(() => boxes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  details: text("details").notNull(),
  value: real("value"),
  receiptFilename: text("receipt_filename"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const boxesRelations = relations(boxes, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  box: one(boxes, {
    fields: [items.boxId],
    references: [boxes.id],
  }),
}));

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'backup', 'restore'
  entityType: text("entity_type").notNull(), // 'box', 'item', 'location', 'system'
  entityId: text("entity_id"),
  entityName: text("entity_name"),
  details: text("details"), // JSON string with additional details
  timestamp: text("timestamp").default(sql`(datetime('now'))`),
});

export const insertBoxSchema = createInsertSchema(boxes).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertBox = z.infer<typeof insertBoxSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Box = typeof boxes.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

export interface BoxWithStats extends Box {
  itemCount: number;
  totalValue: number;
  withReceipts: number;
}

export interface BoxWithItems extends BoxWithStats {
  items: Item[];
}
