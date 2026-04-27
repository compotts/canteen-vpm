import { neon } from "@neondatabase/serverless";
import { catalogByCategory } from "../src/data/catalog.js";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting migration...");

  // 1. Create table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name_lt TEXT NOT NULL,
      name_ru TEXT,
      name_en TEXT,
      weight TEXT,
      price_student DECIMAL(10, 2),
      price_teacher DECIMAL(10, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log("Table 'dishes' ensured.");

  // 2. Prepare data
  const allDishes = [];
  for (const [category, dishes] of Object.entries(catalogByCategory)) {
    if (category === 'forTranslate') continue;
    
    for (const dish of dishes) {
      allDishes.push({
        id: dish.id,
        category: category,
        name_lt: dish.name,
        name_ru: dish.nameRu,
        name_en: dish.nameEn,
        weight: dish.weight,
        price_student: dish.priceStudent,
        price_teacher: dish.priceTeacher
      });
    }
  }

  console.log(`Found ${allDishes.length} dishes to migrate.`);

  // 3. Insert/Upsert data
  for (const dish of allDishes) {
    await sql`
      INSERT INTO dishes (id, category, name_lt, name_ru, name_en, weight, price_student, price_teacher)
      VALUES (${dish.id}, ${dish.category}, ${dish.name_lt}, ${dish.name_ru}, ${dish.name_en}, ${dish.weight}, ${dish.price_student}, ${dish.price_teacher})
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        name_lt = EXCLUDED.name_lt,
        name_ru = EXCLUDED.name_ru,
        name_en = EXCLUDED.name_en,
        weight = EXCLUDED.weight,
        price_student = EXCLUDED.price_student,
        price_teacher = EXCLUDED.price_teacher,
        updated_at = CURRENT_TIMESTAMP
    `;
  }

  // 4. Handle 'forTranslate' as a separate table or just additional entries
  // For now, let's just focus on the main catalog. 
  // If we want to store translations for dynamic menu items, we might need another table.
  
  console.log("Migration completed successfully.");
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
