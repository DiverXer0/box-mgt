// Check current database content
import { db } from './server/db.js';
import { boxes, items } from './shared/schema.js';

async function checkDatabase() {
  try {
    console.log('Checking current database content...');
    
    const allBoxes = await db.select().from(boxes);
    console.log(`Found ${allBoxes.length} boxes:`, allBoxes.map(b => ({id: b.id, name: b.name})));
    
    const allItems = await db.select().from(items);
    console.log(`Found ${allItems.length} items:`, allItems.map(i => ({id: i.id, name: i.name, boxId: i.boxId})));
    
  } catch (error) {
    console.error('Database check error:', error);
  }
}

checkDatabase();