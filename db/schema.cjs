const {sqliteTable,text,integer}=require('drizzle-orm/sqlite-core');
exports.content=sqliteTable('content',{id:text('id').primaryKey(),body:text('body').notNull(),revision:integer('revision').notNull().default(0),updated:text('updated').notNull()});
exports.administrator=sqliteTable('administrator',{id:integer('id').primaryKey(),userId:text('user_id').notNull()});
