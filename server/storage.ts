import { type Box, type Item, type InsertBox, type InsertItem, type BoxWithStats, type BoxWithItems } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private boxes: Map<string, Box>;
  private items: Map<string, Item>;

  constructor() {
    this.boxes = new Map();
    this.items = new Map();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample boxes
    const box1: Box = {
      id: "box-kitchen-storage",
      name: "Kitchen Storage",
      location: "Basement Shelf A-1",
      description: "Kitchen appliances and utensils stored for seasonal use. Includes stand mixer, food processor, and specialty cookware.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    };

    const box2: Box = {
      id: "box-garage-tools",
      name: "Garage Tools", 
      location: "Garage Wall Mount",
      description: "Hand tools and hardware for home maintenance and DIY projects. Includes screwdrivers, wrenches, drill bits.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    };

    const box3: Box = {
      id: "box-office-supplies",
      name: "Office Supplies",
      location: "Closet Top Shelf", 
      description: "Stationery, printer supplies, and office equipment. Includes paper, pens, staplers, and backup cables.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    };

    this.boxes.set(box1.id, box1);
    this.boxes.set(box2.id, box2);
    this.boxes.set(box3.id, box3);

    // Create sample items
    const items: Item[] = [
      // Kitchen Storage items
      {
        id: "item-stand-mixer",
        boxId: box1.id,
        name: "KitchenAid Stand Mixer",
        quantity: 1,
        details: "Professional 5-quart bowl-lift mixer with attachments",
        value: 349.99,
        receiptFilename: "mixer-receipt.pdf",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: "item-utensil-set",
        boxId: box1.id,
        name: "Stainless Steel Utensil Set",
        quantity: 1,
        details: "12-piece professional kitchen utensil set with holder",
        value: 89.99,
        receiptFilename: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: "item-food-processor",
        boxId: box1.id,
        name: "Food Processor",
        quantity: 1,
        details: "Cuisinart 14-cup food processor with multiple blades",
        value: 199.99,
        receiptFilename: "processor-receipt.jpg",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },

      // Garage Tools items
      {
        id: "item-power-drill",
        boxId: box2.id,
        name: "Cordless Power Drill",
        quantity: 1,
        details: "18V lithium-ion drill with battery and charger",
        value: 129.99,
        receiptFilename: "drill-receipt.pdf",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        id: "item-wrench-set",
        boxId: box2.id,
        name: "Wrench Set",
        quantity: 12,
        details: "Metric and SAE combination wrench set 8mm-19mm",
        value: 45.99,
        receiptFilename: null,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },

      // Office Supplies items  
      {
        id: "item-printer-paper",
        boxId: box3.id,
        name: "Printer Paper",
        quantity: 5,
        details: "20lb white copy paper, 500 sheets per ream",
        value: 25.99,
        receiptFilename: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    ];

    items.forEach(item => this.items.set(item.id, item));
  }

  async getBoxes(): Promise<BoxWithStats[]> {
    const boxesArray = Array.from(this.boxes.values());
    return boxesArray.map(box => this.addBoxStats(box));
  }

  async getBox(id: string): Promise<BoxWithItems | undefined> {
    const box = this.boxes.get(id);
    if (!box) return undefined;

    const items = Array.from(this.items.values()).filter(item => item.boxId === id);
    const boxWithStats = this.addBoxStats(box);
    
    return {
      ...boxWithStats,
      items,
    };
  }

  async createBox(insertBox: InsertBox): Promise<Box> {
    const id = randomUUID();
    const box: Box = {
      ...insertBox,
      id,
      createdAt: new Date().toISOString(),
    };
    this.boxes.set(id, box);
    return box;
  }

  async updateBox(id: string, updateData: Partial<InsertBox>): Promise<Box | undefined> {
    const box = this.boxes.get(id);
    if (!box) return undefined;

    const updatedBox = { ...box, ...updateData };
    this.boxes.set(id, updatedBox);
    return updatedBox;
  }

  async deleteBox(id: string): Promise<boolean> {
    const deleted = this.boxes.delete(id);
    if (deleted) {
      // Delete all items in this box
      const itemsToDelete = Array.from(this.items.entries())
        .filter(([, item]) => item.boxId === id)
        .map(([itemId]) => itemId);
      
      itemsToDelete.forEach(itemId => this.items.delete(itemId));
    }
    return deleted;
  }

  async getBoxItems(boxId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.boxId === boxId);
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
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
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: string, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updateData };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async searchBoxesAndItems(query: string): Promise<{ boxes: BoxWithStats[]; items: Item[] }> {
    const lowerQuery = query.toLowerCase();
    
    const boxes = Array.from(this.boxes.values())
      .filter(box => 
        box.name.toLowerCase().includes(lowerQuery) ||
        box.location.toLowerCase().includes(lowerQuery) ||
        box.description.toLowerCase().includes(lowerQuery)
      )
      .map(box => this.addBoxStats(box));

    const items = Array.from(this.items.values())
      .filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.details.toLowerCase().includes(lowerQuery)
      );

    return { boxes, items };
  }

  async getStats(): Promise<{
    totalBoxes: number;
    totalItems: number;
    totalValue: number;
    itemsWithReceipts: number;
  }> {
    const totalBoxes = this.boxes.size;
    const allItems = Array.from(this.items.values());
    const totalItems = allItems.length;
    const totalValue = allItems.reduce((sum, item) => sum + ((item.value || 0) * item.quantity), 0);
    const itemsWithReceipts = allItems.filter(item => item.receiptFilename).length;

    return {
      totalBoxes,
      totalItems,
      totalValue,
      itemsWithReceipts,
    };
  }

  private addBoxStats(box: Box): BoxWithStats {
    const boxItems = Array.from(this.items.values()).filter(item => item.boxId === box.id);
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

export const storage = new MemStorage();
