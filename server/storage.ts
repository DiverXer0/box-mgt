import { type Box, type Item, type InsertBox, type InsertItem, type BoxWithStats, type BoxWithItems, boxes, items } from "@shared/schema";
import { randomUUID } from "crypto";
import { db, initializeDatabase } from "./db";
import { eq, like, or, sql } from "drizzle-orm";

export interface IStorage {
  // Box operations
  getBoxes(): Promise<BoxWithStats[]>;
  getBox(id: string): Promise<BoxWithItems | undefined>;
  createBox(box: InsertBox): Promise<Box>;
  updateBox(id: string, box: Partial<InsertBox>): Promise<Box | undefined>;
  deleteBox(id: string): Promise<boolean>;

  // Item operations
  getBoxItems(boxId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;

  // Search
  searchBoxesAndItems(query: string): Promise<{ boxes: BoxWithStats[]; items: Item[] }>;

  // Stats
  getStats(): Promise<{
    totalBoxes: number;
    totalItems: number;
    totalValue: number;
    itemsWithReceipts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    initializeDatabase();
    this.initializeSampleData();
  }

  // Reinitialize after database restore
  public reinitialize() {
    initializeDatabase();
  }

  private async initializeSampleData() {
    // Check if we already have data
    const existingBoxes = await db.select().from(boxes).limit(1);
    if (existingBoxes.length > 0) {
      return; // Sample data already exists
    }

    console.log('Initializing sample data...');
    
    // Create sample boxes
    const sampleBoxes = [
      {
        id: "box-kitchen-storage",
        name: "Kitchen Storage",
        location: "Basement Shelf A-1",
        description: "Kitchen appliances and utensils stored for seasonal use. Includes stand mixer, food processor, and specialty cookware.",
      },
      {
        id: "box-garage-tools",
        name: "Garage Tools", 
        location: "Garage Wall Mount",
        description: "Hand tools and hardware for home maintenance and DIY projects. Includes screwdrivers, wrenches, drill bits.",
      },
      {
        id: "box-office-supplies",
        name: "Office Supplies",
        location: "Closet Top Shelf", 
        description: "Stationery, printer supplies, and office equipment. Includes paper, pens, staplers, and backup cables.",
      }
    ];

    await db.insert(boxes).values(sampleBoxes);

    // Create sample items
    const sampleItems = [
      {
        id: "item-stand-mixer",
        boxId: "box-kitchen-storage",
        name: "KitchenAid Stand Mixer",
        quantity: 1,
        details: "Professional 5-quart bowl-lift mixer with attachments",
        value: 349.99,
        receiptFilename: "mixer-receipt.pdf",
      },
      {
        id: "item-utensil-set",
        boxId: "box-kitchen-storage",
        name: "Stainless Steel Utensil Set",
        quantity: 1,
        details: "12-piece professional kitchen utensil set with holder",
        value: 89.99,
        receiptFilename: null,
      },
      {
        id: "item-food-processor",
        boxId: "box-kitchen-storage",
        name: "Food Processor",
        quantity: 1,
        details: "Cuisinart 14-cup food processor with multiple blades",
        value: 199.99,
        receiptFilename: "processor-receipt.jpg",
      },
      {
        id: "item-power-drill",
        boxId: "box-garage-tools",
        name: "Cordless Power Drill",
        quantity: 1,
        details: "18V lithium-ion drill with battery and charger",
        value: 129.99,
        receiptFilename: "drill-receipt.pdf",
      },
      {
        id: "item-wrench-set",
        boxId: "box-garage-tools",
        name: "Wrench Set",
        quantity: 12,
        details: "Metric and SAE combination wrench set 8mm-19mm",
        value: 45.99,
        receiptFilename: null,
      },
      {
        id: "item-printer-paper",
        boxId: "box-office-supplies",
        name: "Printer Paper",
        quantity: 5,
        details: "20lb white copy paper, 500 sheets per ream",
        value: 25.99,
        receiptFilename: null,
      },
    ];

    await db.insert(items).values(sampleItems);
    console.log('Sample data initialized successfully');
  }

  async getBoxes(): Promise<BoxWithStats[]> {
    const allBoxes = await db.select().from(boxes);
    const boxesWithStats = await Promise.all(
      allBoxes.map(async (box) => this.addBoxStats(box))
    );
    return boxesWithStats;
  }

  async getBox(id: string): Promise<BoxWithItems | undefined> {
    const box = await db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
    if (box.length === 0) return undefined;

    const boxItems = await db.select().from(items).where(eq(items.boxId, id));
    const boxWithStats = await this.addBoxStats(box[0]);
    
    return {
      ...boxWithStats,
      items: boxItems,
    };
  }

  async createBox(insertBox: InsertBox): Promise<Box> {
    const id = randomUUID();
    const box: Box = {
      ...insertBox,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.insert(boxes).values(box);
    return box;
  }

  async updateBox(id: string, updateData: Partial<InsertBox>): Promise<Box | undefined> {
    await db.update(boxes).set(updateData).where(eq(boxes.id, id));
    const updated = await db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
    return updated[0] || undefined;
  }

  async deleteBox(id: string): Promise<boolean> {
    const result = await db.delete(boxes).where(eq(boxes.id, id));
    return result.changes > 0;
  }

  async getBoxItems(boxId: string): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.boxId, boxId));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return item[0] || undefined;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const item: Item = {
      ...insertItem,
      id,
      value: insertItem.value ?? null,
      receiptFilename: insertItem.receiptFilename ?? null,
      createdAt: new Date().toISOString(),
    };
    await db.insert(items).values(item);
    return item;
  }

  async updateItem(id: string, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    await db.update(items).set(updateData).where(eq(items.id, id));
    const updated = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return updated[0] || undefined;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return result.changes > 0;
  }

  async searchBoxesAndItems(query: string): Promise<{ boxes: BoxWithStats[]; items: Item[] }> {
    const searchPattern = `%${query}%`;
    
    const searchBoxes = await db.select().from(boxes).where(
      or(
        like(boxes.name, searchPattern),
        like(boxes.location, searchPattern),
        like(boxes.description, searchPattern)
      )
    );

    const searchItems = await db.select().from(items).where(
      or(
        like(items.name, searchPattern),
        like(items.details, searchPattern)
      )
    );

    const boxesWithStats = await Promise.all(
      searchBoxes.map(async (box) => this.addBoxStats(box))
    );

    return { boxes: boxesWithStats, items: searchItems };
  }

  async getStats(): Promise<{
    totalBoxes: number;
    totalItems: number;
    totalValue: number;
    itemsWithReceipts: number;
  }> {
    const [boxCount] = await db.select({ count: sql<number>`count(*)` }).from(boxes);
    const [itemCount] = await db.select({ count: sql<number>`count(*)` }).from(items);
    const [valueSum] = await db.select({ 
      total: sql<number>`coalesce(sum(value * quantity), 0)` 
    }).from(items);
    const [receiptCount] = await db.select({ 
      count: sql<number>`count(*)` 
    }).from(items).where(sql`receipt_filename IS NOT NULL`);

    return {
      totalBoxes: boxCount.count,
      totalItems: itemCount.count,
      totalValue: valueSum.total,
      itemsWithReceipts: receiptCount.count,
    };
  }

  private async addBoxStats(box: Box): Promise<BoxWithStats> {
    const boxItems = await db.select().from(items).where(eq(items.boxId, box.id));
    const itemCount = boxItems.length;
    const totalValue = boxItems.reduce((sum, item) => sum + ((item.value || 0) * item.quantity), 0);
    const withReceipts = boxItems.filter(item => item.receiptFilename).length;

    return {
      ...box,
      itemCount,
      totalValue,
      withReceipts,
    };
  }
}

export const storage = new DatabaseStorage();
