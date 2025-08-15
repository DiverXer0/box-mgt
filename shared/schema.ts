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

export const insertBoxSchema = createInsertSchema(boxes).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export type InsertBox = z.infer<typeof insertBoxSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Box = typeof boxes.$inferSelect;
export type Item = typeof items.$inferSelect;

export interface BoxWithStats extends Box {
  itemCount: number;
  totalValue: number;
  withReceipts: number;
}

export interface BoxWithItems extends BoxWithStats {
  items: Item[];
}
