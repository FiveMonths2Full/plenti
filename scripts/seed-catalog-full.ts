/**
 * Comprehensive catalog seed script.
 * Run via: npx tsx scripts/seed-catalog-full.ts
 *
 * Inserts all shelf-stable food and non-food items with size details.
 * Uses ON CONFLICT (name) DO UPDATE to keep size/detail fresh on re-runs.
 */

import { sql } from '@vercel/postgres'

interface CatalogEntry {
  name: string
  detail: string
  size: string
  category: string
}

const items: CatalogEntry[] = [
  // ── Canned Protein ──────────────────────────────────────────────────────
  { name: 'Canned tuna (in water)', detail: 'In water preferred', size: '5 oz', category: 'Protein' },
  { name: 'Canned tuna (chunk light)', detail: 'Chunk light in water', size: '12 oz', category: 'Protein' },
  { name: 'Canned chicken', detail: 'Chunk white meat', size: '12.5 oz', category: 'Protein' },
  { name: 'Canned salmon', detail: 'Pink or red salmon', size: '14.75 oz', category: 'Protein' },
  { name: 'Canned sardines', detail: 'In water or olive oil', size: '3.75 oz', category: 'Protein' },
  { name: 'Canned black beans', detail: 'Low sodium preferred', size: '15 oz', category: 'Protein' },
  { name: 'Canned kidney beans', detail: 'Dark or light red', size: '15 oz', category: 'Protein' },
  { name: 'Canned pinto beans', detail: 'Any brand', size: '15 oz', category: 'Protein' },
  { name: 'Canned chickpeas', detail: 'Also called garbanzo beans', size: '15 oz', category: 'Protein' },
  { name: 'Canned lentils', detail: 'Green or brown', size: '15 oz', category: 'Protein' },
  { name: 'Canned white beans', detail: 'Great Northern or cannellini', size: '15 oz', category: 'Protein' },
  { name: 'Canned baked beans', detail: 'Any variety', size: '16 oz', category: 'Protein' },
  { name: 'Canned refried beans', detail: 'Traditional or fat-free', size: '16 oz', category: 'Protein' },
  { name: 'Peanut butter', detail: 'Creamy or chunky', size: '16 oz', category: 'Protein' },
  { name: 'Peanut butter (large)', detail: 'Creamy or chunky', size: '40 oz', category: 'Protein' },
  { name: 'Almond butter', detail: 'Any brand', size: '16 oz', category: 'Protein' },
  { name: 'Dried lentils', detail: 'Green, red, or brown', size: '1 lb', category: 'Protein' },
  { name: 'Dried black beans', detail: 'Any brand', size: '1 lb', category: 'Protein' },
  { name: 'Dried pinto beans', detail: 'Any brand', size: '1 lb', category: 'Protein' },
  { name: 'Dried split peas', detail: 'Green or yellow', size: '1 lb', category: 'Protein' },
  { name: 'Dried chickpeas', detail: 'Any brand', size: '1 lb', category: 'Protein' },
  { name: 'Nuts (mixed)', detail: 'Unsalted preferred', size: '16 oz', category: 'Protein' },
  { name: 'Sunflower seeds', detail: 'Shelled, unsalted', size: '8 oz', category: 'Protein' },

  // ── Grains & Pasta ──────────────────────────────────────────────────────
  { name: 'White rice', detail: 'Long grain', size: '2 lb', category: 'Grains' },
  { name: 'White rice (large)', detail: 'Long grain', size: '5 lb', category: 'Grains' },
  { name: 'Brown rice', detail: 'Long grain', size: '2 lb', category: 'Grains' },
  { name: 'Jasmine rice', detail: 'Any brand', size: '5 lb', category: 'Grains' },
  { name: 'Pasta (spaghetti)', detail: 'Any brand', size: '16 oz', category: 'Grains' },
  { name: 'Pasta (penne)', detail: 'Any brand', size: '16 oz', category: 'Grains' },
  { name: 'Pasta (rotini)', detail: 'Any brand', size: '16 oz', category: 'Grains' },
  { name: 'Pasta (elbow)', detail: 'For mac & cheese or soups', size: '16 oz', category: 'Grains' },
  { name: 'Egg noodles', detail: 'Wide or medium', size: '12 oz', category: 'Grains' },
  { name: 'Ramen noodles', detail: 'Any flavor', size: '3 oz', category: 'Grains' },
  { name: 'Mac & cheese (boxed)', detail: 'Any brand', size: '7.25 oz', category: 'Grains' },
  { name: 'Instant mashed potatoes', detail: 'Any brand', size: '13.75 oz', category: 'Grains' },
  { name: 'Oatmeal (old-fashioned)', detail: 'Rolled oats', size: '18 oz', category: 'Grains' },
  { name: 'Oatmeal (quick cook)', detail: 'Quick-cook rolled oats', size: '18 oz', category: 'Grains' },
  { name: 'Oatmeal (canister)', detail: 'Old-fashioned or quick-cook', size: '42 oz', category: 'Grains' },
  { name: 'Instant oatmeal packets', detail: 'Variety pack', size: '10-ct', category: 'Grains' },
  { name: 'Grits', detail: 'Quick or regular', size: '24 oz', category: 'Grains' },
  { name: 'Cornmeal', detail: 'Yellow or white', size: '2 lb', category: 'Grains' },
  { name: 'Flour (all-purpose)', detail: 'Bleached or unbleached', size: '5 lb', category: 'Grains' },
  { name: 'Flour (large)', detail: 'All-purpose', size: '10 lb', category: 'Grains' },
  { name: 'Whole wheat flour', detail: 'Any brand', size: '5 lb', category: 'Grains' },
  { name: 'Bread (sandwich)', detail: 'White or wheat', size: '20 oz loaf', category: 'Grains' },
  { name: 'Crackers (saltine)', detail: 'Any brand', size: '16 oz', category: 'Grains' },
  { name: 'Crackers (whole grain)', detail: 'Any brand', size: '13.7 oz', category: 'Grains' },
  { name: 'Graham crackers', detail: 'Any brand', size: '14.4 oz', category: 'Grains' },
  { name: 'Quinoa', detail: 'White or tri-color', size: '16 oz', category: 'Grains' },
  { name: 'Cereal (bran flakes)', detail: 'Low sugar', size: '18 oz', category: 'Grains' },
  { name: 'Cereal (corn flakes)', detail: 'Any brand', size: '18 oz', category: 'Grains' },
  { name: 'Cereal (multigrain)', detail: 'Cheerios or similar', size: '18 oz', category: 'Grains' },
  { name: 'Cereal (oat clusters)', detail: 'Granola-style', size: '16 oz', category: 'Grains' },
  { name: 'Granola bars', detail: 'Any variety', size: '6-ct box', category: 'Grains' },
  { name: 'Granola bars (large box)', detail: 'Any variety', size: '12-ct box', category: 'Grains' },

  // ── Canned Vegetables & Produce ────────────────────────────────────────
  { name: 'Canned diced tomatoes', detail: 'No salt or regular', size: '14.5 oz', category: 'Canned Goods' },
  { name: 'Canned crushed tomatoes', detail: 'Any brand', size: '28 oz', category: 'Canned Goods' },
  { name: 'Canned tomato paste', detail: 'Any brand', size: '6 oz', category: 'Canned Goods' },
  { name: 'Canned tomato sauce', detail: 'Plain, no seasoning', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned whole tomatoes', detail: 'Any brand', size: '28 oz', category: 'Canned Goods' },
  { name: 'Canned corn', detail: 'Whole kernel, no salt preferred', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned green beans', detail: 'Cut or french-style', size: '14.5 oz', category: 'Canned Goods' },
  { name: 'Canned peas', detail: 'No salt preferred', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned carrots', detail: 'Sliced', size: '14.5 oz', category: 'Canned Goods' },
  { name: 'Canned sweet potatoes', detail: 'In light syrup or water', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned mixed vegetables', detail: 'Any brand', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned spinach', detail: 'Any brand', size: '13.5 oz', category: 'Canned Goods' },
  { name: 'Canned fruit cocktail', detail: 'In juice, not syrup', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned peaches', detail: 'In juice preferred', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned pears', detail: 'In juice preferred', size: '15 oz', category: 'Canned Goods' },
  { name: 'Canned mandarin oranges', detail: 'In juice', size: '11 oz', category: 'Canned Goods' },
  { name: 'Canned pineapple', detail: 'Chunks or tidbits, in juice', size: '20 oz', category: 'Canned Goods' },
  { name: 'Canned applesauce', detail: 'Unsweetened', size: '24 oz', category: 'Canned Goods' },
  { name: 'Applesauce cups', detail: 'Individual, unsweetened', size: '4-ct', category: 'Canned Goods' },

  // ── Soups & Stews ──────────────────────────────────────────────────────
  { name: 'Canned chicken noodle soup', detail: 'Any brand', size: '10.75 oz', category: 'Canned Goods' },
  { name: 'Canned tomato soup', detail: 'Any brand', size: '10.75 oz', category: 'Canned Goods' },
  { name: 'Canned vegetable soup', detail: 'Any brand', size: '10.5 oz', category: 'Canned Goods' },
  { name: 'Canned beef stew', detail: 'Any brand', size: '20 oz', category: 'Canned Goods' },
  { name: 'Canned lentil soup', detail: 'Any brand', size: '19 oz', category: 'Canned Goods' },
  { name: 'Canned minestrone soup', detail: 'Any brand', size: '19 oz', category: 'Canned Goods' },
  { name: 'Canned black bean soup', detail: 'Any brand', size: '19 oz', category: 'Canned Goods' },
  { name: 'Canned chili with beans', detail: 'Any brand', size: '15 oz', category: 'Canned Goods' },
  { name: 'Ramen cup noodles', detail: 'Any flavor', size: '2.25 oz cup', category: 'Canned Goods' },

  // ── Cooking Staples ─────────────────────────────────────────────────────
  { name: 'Vegetable oil', detail: 'Canola or soybean', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Vegetable oil (large)', detail: 'Canola or soybean', size: '48 oz', category: 'Cooking Staples' },
  { name: 'Olive oil', detail: 'Extra virgin or pure', size: '16.9 oz', category: 'Cooking Staples' },
  { name: 'Canola oil', detail: 'Any brand', size: '48 oz', category: 'Cooking Staples' },
  { name: 'Non-stick cooking spray', detail: 'Original or canola', size: '6 oz', category: 'Cooking Staples' },
  { name: 'Sugar (white)', detail: 'Granulated', size: '4 lb', category: 'Cooking Staples' },
  { name: 'Sugar (large)', detail: 'Granulated white', size: '10 lb', category: 'Cooking Staples' },
  { name: 'Brown sugar', detail: 'Light or dark', size: '2 lb', category: 'Cooking Staples' },
  { name: 'Salt (table)', detail: 'Iodized', size: '26 oz', category: 'Cooking Staples' },
  { name: 'Black pepper', detail: 'Ground', size: '3 oz', category: 'Cooking Staples' },
  { name: 'Baking powder', detail: 'Double-acting', size: '10 oz', category: 'Cooking Staples' },
  { name: 'Baking soda', detail: 'Any brand', size: '16 oz', category: 'Cooking Staples' },
  { name: 'Yeast (active dry)', detail: 'For bread baking', size: '3-ct strip', category: 'Cooking Staples' },
  { name: 'Vanilla extract', detail: 'Pure or imitation', size: '4 oz', category: 'Cooking Staples' },
  { name: 'Mixed spice pack', detail: 'Garlic powder, onion powder, paprika', size: 'Variety', category: 'Cooking Staples' },
  { name: 'Garlic powder', detail: 'Any brand', size: '3 oz', category: 'Cooking Staples' },
  { name: 'Onion powder', detail: 'Any brand', size: '3 oz', category: 'Cooking Staples' },
  { name: 'Chicken bouillon cubes', detail: 'Or powder', size: '25-ct', category: 'Cooking Staples' },
  { name: 'Beef bouillon cubes', detail: 'Or powder', size: '25-ct', category: 'Cooking Staples' },
  { name: 'Pasta sauce (marinara)', detail: 'Any brand', size: '24 oz', category: 'Cooking Staples' },
  { name: 'Pasta sauce (meat)', detail: 'Any brand', size: '24 oz', category: 'Cooking Staples' },
  { name: 'Salsa', detail: 'Mild or medium', size: '16 oz', category: 'Cooking Staples' },
  { name: 'Ketchup', detail: 'Any brand', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Mustard', detail: 'Yellow', size: '14 oz', category: 'Cooking Staples' },
  { name: 'Soy sauce', detail: 'Regular or reduced sodium', size: '10 oz', category: 'Cooking Staples' },
  { name: 'Hot sauce', detail: 'Any brand', size: '5 oz', category: 'Cooking Staples' },
  { name: 'Vinegar (white)', detail: 'Distilled', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Honey', detail: 'Any variety', size: '12 oz', category: 'Cooking Staples' },
  { name: 'Jelly (grape)', detail: 'Any brand', size: '18 oz', category: 'Cooking Staples' },
  { name: 'Jelly (strawberry)', detail: 'Any brand', size: '18 oz', category: 'Cooking Staples' },
  { name: 'Jelly (large jar)', detail: 'Any flavor', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Mayonnaise', detail: 'Any brand', size: '30 oz', category: 'Cooking Staples' },
  { name: 'Ranch dressing', detail: 'Any brand', size: '16 oz', category: 'Cooking Staples' },

  // ── Dairy & Shelf-Stable ────────────────────────────────────────────────
  { name: 'Powdered milk', detail: 'Whole or non-fat', size: '25.6 oz', category: 'Dairy & Eggs' },
  { name: 'Evaporated milk', detail: 'Whole', size: '12 oz', category: 'Dairy & Eggs' },
  { name: 'Sweetened condensed milk', detail: 'Any brand', size: '14 oz', category: 'Dairy & Eggs' },
  { name: 'Shelf-stable almond milk', detail: 'Unsweetened', size: '32 oz', category: 'Dairy & Eggs' },
  { name: 'Shelf-stable oat milk', detail: 'Any brand', size: '32 oz', category: 'Dairy & Eggs' },
  { name: 'Parmesan cheese (shaker)', detail: 'Grated', size: '8 oz', category: 'Dairy & Eggs' },

  // ── Beverages ───────────────────────────────────────────────────────────
  { name: 'Apple juice', detail: '100% juice', size: '64 oz', category: 'Beverages' },
  { name: 'Orange juice', detail: '100% juice', size: '52 oz', category: 'Beverages' },
  { name: 'Grape juice', detail: '100% juice', size: '64 oz', category: 'Beverages' },
  { name: 'Juice boxes (apple)', detail: 'Individual, 100% juice', size: '6.75 oz', category: 'Beverages' },
  { name: 'Juice boxes (variety)', detail: 'Assorted flavors', size: '8-ct', category: 'Beverages' },
  { name: 'Coffee (ground)', detail: 'Medium roast', size: '12 oz', category: 'Beverages' },
  { name: 'Coffee (large)', detail: 'Medium roast, ground', size: '30 oz', category: 'Beverages' },
  { name: 'Instant coffee', detail: 'Any brand', size: '8 oz', category: 'Beverages' },
  { name: 'Tea bags (black)', detail: 'Any brand', size: '100-ct box', category: 'Beverages' },
  { name: 'Tea bags (green)', detail: 'Any brand', size: '20-ct box', category: 'Beverages' },
  { name: 'Hot cocoa mix', detail: 'Any brand', size: '10-ct box', category: 'Beverages' },
  { name: 'Sports drink powder', detail: 'Gatorade or similar', size: '19.4 oz canister', category: 'Beverages' },
  { name: 'Water (bottled)', detail: 'Individual bottles', size: '16.9 oz', category: 'Beverages' },

  // ── Baby & Kids ─────────────────────────────────────────────────────────
  { name: 'Baby formula (powder)', detail: 'Enfamil or Similac', size: '12.5 oz', category: 'Baby & Kids' },
  { name: 'Baby formula (medium)', detail: 'Enfamil or Similac', size: '22.5 oz', category: 'Baby & Kids' },
  { name: 'Baby formula (large)', detail: 'Enfamil or Similac', size: '32 oz', category: 'Baby & Kids' },
  { name: 'Baby food pouches', detail: 'Stage 1 or 2, any flavor', size: '3.5 oz', category: 'Baby & Kids' },
  { name: 'Baby food jars', detail: 'Stage 1 or 2', size: '4 oz jar', category: 'Baby & Kids' },
  { name: 'Baby cereal (rice)', detail: 'Iron-fortified', size: '8 oz', category: 'Baby & Kids' },
  { name: 'Baby cereal (oatmeal)', detail: 'Iron-fortified', size: '8 oz', category: 'Baby & Kids' },
  { name: 'Toddler snacks (puffs)', detail: 'Any flavor', size: '1.48 oz', category: 'Baby & Kids' },
  { name: 'Toddler meals (pouches)', detail: 'Stage 3, age 12+ months', size: '4.5 oz', category: 'Baby & Kids' },
  { name: 'Kids fruit snacks', detail: 'Any brand', size: '10-ct box', category: 'Baby & Kids' },
  { name: 'Pediasure (shake)', detail: 'Vanilla or chocolate', size: '8 oz', category: 'Baby & Kids' },

  // ── Diapers ─────────────────────────────────────────────────────────────
  { name: 'Diapers — Newborn', detail: 'Up to 10 lb', size: 'Newborn (32 ct)', category: 'Baby & Kids' },
  { name: 'Diapers — Size 1', detail: '8–14 lb', size: 'Size 1 (40 ct)', category: 'Baby & Kids' },
  { name: 'Diapers — Size 2', detail: '12–18 lb', size: 'Size 2 (37 ct)', category: 'Baby & Kids' },
  { name: 'Diapers — Size 3', detail: '16–28 lb', size: 'Size 3 (34 ct)', category: 'Baby & Kids' },
  { name: 'Diapers — Size 4', detail: '22–37 lb', size: 'Size 4 (27 ct)', category: 'Baby & Kids' },
  { name: 'Diapers — Size 5', detail: '27+ lb', size: 'Size 5 (27 ct)', category: 'Baby & Kids' },
  { name: 'Diapers — Size 6', detail: '35+ lb', size: 'Size 6 (25 ct)', category: 'Baby & Kids' },
  { name: 'Pull-Ups — 2T-3T', detail: '18–34 lb training pants', size: '2T-3T (23 ct)', category: 'Baby & Kids' },
  { name: 'Pull-Ups — 3T-4T', detail: '32–40 lb training pants', size: '3T-4T (20 ct)', category: 'Baby & Kids' },
  { name: 'Pull-Ups — 4T-5T', detail: '38–50 lb training pants', size: '4T-5T (17 ct)', category: 'Baby & Kids' },
  { name: 'Baby wipes', detail: 'Fragrance-free preferred', size: '72-ct pack', category: 'Baby & Kids' },
  { name: 'Baby wipes (large)', detail: 'Fragrance-free preferred', size: '256-ct', category: 'Baby & Kids' },
  { name: 'Diaper cream', detail: 'Desitin or A+D', size: '4 oz', category: 'Baby & Kids' },

  // ── Hygiene & Personal Care ─────────────────────────────────────────────
  { name: 'Shampoo', detail: 'Any brand, adults', size: '12 oz', category: 'Household' },
  { name: 'Shampoo (large)', detail: 'Any brand', size: '20 oz', category: 'Household' },
  { name: 'Conditioner', detail: 'Any brand', size: '12 oz', category: 'Household' },
  { name: 'Body wash', detail: 'Any scent', size: '18 oz', category: 'Household' },
  { name: 'Body wash (large)', detail: 'Any scent', size: '32 oz', category: 'Household' },
  { name: 'Bar soap', detail: 'Any brand', size: '4-ct pack', category: 'Household' },
  { name: 'Hand soap (liquid)', detail: 'Pump bottle', size: '7.5 oz', category: 'Household' },
  { name: 'Hand soap (refill)', detail: 'Any brand', size: '50 oz', category: 'Household' },
  { name: 'Deodorant', detail: 'Any scent, men or women', size: '2.6 oz', category: 'Household' },
  { name: 'Deodorant (large)', detail: 'Any scent', size: '3.0 oz', category: 'Household' },
  { name: 'Toothpaste', detail: 'Fluoride, any brand', size: '4.1 oz', category: 'Household' },
  { name: 'Toothpaste (large)', detail: 'Fluoride, any brand', size: '6 oz', category: 'Household' },
  { name: 'Toothbrush', detail: 'Soft bristle', size: '1-pack', category: 'Household' },
  { name: 'Toothbrush (family pack)', detail: 'Soft bristle', size: '4-pack', category: 'Household' },
  { name: 'Dental floss', detail: 'Any brand', size: '40 m', category: 'Household' },
  { name: 'Razors (disposable)', detail: 'Any brand', size: '4-ct', category: 'Household' },
  { name: 'Razors (disposable, large)', detail: 'Any brand', size: '8-ct', category: 'Household' },
  { name: 'Shaving cream', detail: 'Any brand', size: '7 oz', category: 'Household' },
  { name: 'Feminine pads', detail: 'Regular or overnight', size: '36-ct', category: 'Household' },
  { name: 'Feminine pads (large)', detail: 'Regular or overnight', size: '54-ct', category: 'Household' },
  { name: 'Tampons', detail: 'Regular absorbency', size: '36-ct', category: 'Household' },
  { name: 'Tampons (multi-pack)', detail: 'Regular/Super variety', size: '54-ct', category: 'Household' },
  { name: 'Sunscreen', detail: 'SPF 30+, any brand', size: '3 oz', category: 'Household' },
  { name: 'Lotion (body)', detail: 'Unscented preferred', size: '10 oz', category: 'Household' },
  { name: 'Chapstick / lip balm', detail: 'Any brand', size: '2-pack', category: 'Household' },

  // ── Household Supplies ──────────────────────────────────────────────────
  { name: 'Paper towels', detail: 'Any brand', size: '6-roll pack', category: 'Household' },
  { name: 'Paper towels (single roll)', detail: 'Any brand', size: '1 roll', category: 'Household' },
  { name: 'Toilet paper', detail: 'Any brand, 2-ply', size: '4-roll pack', category: 'Household' },
  { name: 'Toilet paper (large)', detail: 'Any brand, 2-ply', size: '12-roll pack', category: 'Household' },
  { name: 'Toilet paper (mega pack)', detail: 'Any brand', size: '24-roll pack', category: 'Household' },
  { name: 'Dish soap', detail: 'Any brand', size: '16 oz', category: 'Household' },
  { name: 'Dish soap (large)', detail: 'Any brand', size: '32 oz', category: 'Household' },
  { name: 'Dish soap (ultra)', detail: 'Dawn or similar', size: '56 oz', category: 'Household' },
  { name: 'Laundry detergent (liquid)', detail: 'Free & clear or any', size: '50 oz', category: 'Household' },
  { name: 'Laundry detergent (large)', detail: 'Free & clear or any', size: '96 oz', category: 'Household' },
  { name: 'Laundry pods', detail: 'Any brand', size: '42-ct', category: 'Household' },
  { name: 'Laundry pods (large)', detail: 'Any brand', size: '67-ct', category: 'Household' },
  { name: 'All-purpose cleaner', detail: 'Any brand, spray', size: '32 oz', category: 'Household' },
  { name: 'Bleach', detail: 'Regular strength', size: '64 oz', category: 'Household' },
  { name: 'Sponges (scrub)', detail: 'Any brand', size: '6-ct pack', category: 'Household' },
  { name: 'Trash bags (kitchen)', detail: '13-gallon drawstring', size: '13 gal, 40-ct', category: 'Household' },
  { name: 'Trash bags (large)', detail: '30-gallon', size: '30 gal, 28-ct', category: 'Household' },
  { name: 'Ziploc bags (sandwich)', detail: 'Any brand', size: '50-ct', category: 'Household' },
  { name: 'Ziploc bags (gallon)', detail: 'Any brand', size: '15-ct', category: 'Household' },
  { name: 'Aluminum foil', detail: 'Standard width', size: '75 sq ft', category: 'Household' },
  { name: 'Plastic wrap', detail: 'Any brand', size: '200 sq ft', category: 'Household' },
  { name: 'Tissues (facial)', detail: 'Any brand', size: '100-ct box', category: 'Household' },
  { name: 'Napkins (paper)', detail: 'Any brand', size: '200-ct pack', category: 'Household' },
  { name: 'Disposable plates', detail: 'Paper or foam', size: '50-ct', category: 'Household' },
  { name: 'Disposable cups', detail: 'Paper, 9 oz', size: '150-ct', category: 'Household' },
  { name: 'Disposable utensils', detail: 'Fork/knife/spoon variety', size: '48-ct', category: 'Household' },
  { name: 'First aid kit', detail: 'Basic wound care', size: '50-piece', category: 'Household' },
  { name: 'Bandages (adhesive)', detail: 'Assorted sizes', size: '30-ct', category: 'Household' },
  { name: 'Ibuprofen (generic)', detail: '200 mg tablets', size: '100-ct', category: 'Household' },
  { name: 'Acetaminophen (generic)', detail: '500 mg tablets', size: '100-ct', category: 'Household' },
  { name: 'Antacids', detail: 'Tums or generic', size: '96-ct', category: 'Household' },
  { name: 'Hand sanitizer', detail: '62%+ alcohol', size: '8 oz', category: 'Household' },
  { name: 'Face masks (disposable)', detail: '3-layer, adult', size: '50-ct', category: 'Household' },
]

async function main() {
  console.log(`Seeding ${items.length} catalog items…`)
  let inserted = 0
  let updated = 0

  for (const item of items) {
    try {
      const result = await sql`
        INSERT INTO item_catalog (name, detail, size, category)
        VALUES (${item.name}, ${item.detail}, ${item.size}, ${item.category})
        ON CONFLICT (name) DO UPDATE
          SET detail = EXCLUDED.detail,
              size = EXCLUDED.size,
              category = EXCLUDED.category
        RETURNING (xmax = 0) AS is_insert
      `
      if (result.rows[0]?.is_insert) {
        inserted++
      } else {
        updated++
      }
    } catch (err) {
      console.error(`Failed: ${item.name}`, err)
    }
  }

  console.log(`Done. ${inserted} inserted, ${updated} updated.`)
  process.exit(0)
}

main()
