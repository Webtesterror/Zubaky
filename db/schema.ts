// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const content=sqliteTable('content',{id:text('id').primaryKey(),body:text('body').notNull(),revision:integer('revision').notNull().default(0),updated:text('updated').notNull()});
export const administrator=sqliteTable('administrator',{id:integer('id').primaryKey(),userId:text('user_id').notNull()});
