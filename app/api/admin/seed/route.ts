import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

interface CatalogEntry { name: string; detail: string; size: string; category: string }

const CATALOG_ITEMS: CatalogEntry[] = [
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

  // ── Cereal & Breakfast ───────────────────────────────────────────────────
  { name: 'Cereal (bran flakes)', detail: 'Low sugar', size: '18 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (corn flakes)', detail: 'Any brand', size: '18 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (multigrain)', detail: 'Cheerios or similar', size: '18 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (oat clusters)', detail: 'Granola-style', size: '16 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (frosted flakes)', detail: 'Low sugar alternative ok', size: '19.2 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (rice crispy)', detail: 'Any brand', size: '12 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (honey oat clusters)', detail: 'Honey Bunches of Oats or similar', size: '18 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (raisin bran)', detail: 'Any brand', size: '20 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (granola)', detail: 'Any variety', size: '16 oz', category: 'Cereal & Breakfast' },
  { name: 'Cereal (kids variety)', detail: 'Family-friendly, any brand', size: '18 oz', category: 'Cereal & Breakfast' },
  { name: 'Granola bars', detail: 'Any variety', size: '6-ct box', category: 'Cereal & Breakfast' },
  { name: 'Granola bars (large box)', detail: 'Any variety', size: '12-ct box', category: 'Cereal & Breakfast' },
  { name: 'Pop-Tarts', detail: 'Any flavor', size: '8-ct box', category: 'Cereal & Breakfast' },
  { name: 'Pancake mix', detail: 'Just-add-water type', size: '32 oz', category: 'Cereal & Breakfast' },
  { name: 'Pancake syrup', detail: 'Any brand', size: '24 oz', category: 'Cereal & Breakfast' },
  { name: 'Peanut butter (squeeze pack)', detail: 'Variety packs', size: '8-ct', category: 'Cereal & Breakfast' },

  // ── Canned Goods (Vegetables & Fruit) ───────────────────────────────────
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

  // ── Cooking Staples ──────────────────────────────────────────────────────
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
  { name: 'Garlic powder', detail: 'Any brand', size: '3 oz', category: 'Cooking Staples' },
  { name: 'Onion powder', detail: 'Any brand', size: '3 oz', category: 'Cooking Staples' },
  { name: 'Cinnamon (ground)', detail: 'Any brand', size: '2.37 oz', category: 'Cooking Staples' },
  { name: 'Cumin (ground)', detail: 'Any brand', size: '2.1 oz', category: 'Cooking Staples' },
  { name: 'Chili powder', detail: 'Any brand', size: '2.5 oz', category: 'Cooking Staples' },
  { name: 'Paprika', detail: 'Sweet or smoked', size: '2.5 oz', category: 'Cooking Staples' },
  { name: 'Italian seasoning', detail: 'Any brand', size: '0.75 oz', category: 'Cooking Staples' },
  { name: 'Crushed red pepper', detail: 'Any brand', size: '1.5 oz', category: 'Cooking Staples' },
  { name: 'Taco seasoning packet', detail: 'Any brand', size: '1 oz packet', category: 'Cooking Staples' },
  { name: 'Ranch seasoning packet', detail: 'Hidden Valley or similar', size: '1 oz packet', category: 'Cooking Staples' },
  { name: 'Chicken bouillon cubes', detail: 'Or powder', size: '25-ct', category: 'Cooking Staples' },
  { name: 'Beef bouillon cubes', detail: 'Or powder', size: '25-ct', category: 'Cooking Staples' },
  { name: 'Pasta sauce (marinara)', detail: 'Any brand', size: '24 oz', category: 'Cooking Staples' },
  { name: 'Pasta sauce (meat)', detail: 'Any brand', size: '24 oz', category: 'Cooking Staples' },
  { name: 'Salsa', detail: 'Mild or medium', size: '16 oz', category: 'Cooking Staples' },
  { name: 'Ketchup', detail: 'Any brand', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Mustard', detail: 'Yellow', size: '14 oz', category: 'Cooking Staples' },
  { name: 'Mayonnaise', detail: 'Any brand', size: '30 oz', category: 'Cooking Staples' },
  { name: 'Soy sauce', detail: 'Regular or reduced sodium', size: '10 oz', category: 'Cooking Staples' },
  { name: 'Hot sauce', detail: 'Any brand', size: '5 oz', category: 'Cooking Staples' },
  { name: 'Worcestershire sauce', detail: 'Any brand', size: '10 oz', category: 'Cooking Staples' },
  { name: 'Vinegar (white)', detail: 'Distilled', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Honey', detail: 'Any variety', size: '12 oz', category: 'Cooking Staples' },
  { name: 'Maple syrup', detail: 'Any grade', size: '12 oz', category: 'Cooking Staples' },
  { name: 'Jelly (grape)', detail: 'Any brand', size: '18 oz', category: 'Cooking Staples' },
  { name: 'Jelly (strawberry)', detail: 'Any brand', size: '18 oz', category: 'Cooking Staples' },
  { name: 'Jelly (large jar)', detail: 'Any flavor', size: '32 oz', category: 'Cooking Staples' },
  { name: 'Coconut milk (canned)', detail: 'Full fat', size: '13.5 oz', category: 'Cooking Staples' },
  { name: 'Enchilada sauce', detail: 'Red, mild', size: '19 oz', category: 'Cooking Staples' },
  { name: 'Diced green chiles', detail: 'Mild', size: '4 oz can', category: 'Cooking Staples' },
  { name: 'Gravy mix (brown)', detail: 'Any brand', size: '1.2 oz packet', category: 'Cooking Staples' },
  { name: 'Corn starch', detail: 'Any brand', size: '16 oz', category: 'Cooking Staples' },
  { name: 'Cocoa powder', detail: 'Unsweetened', size: '8 oz', category: 'Cooking Staples' },
  { name: 'Brownie mix', detail: 'Any brand', size: '18.3 oz', category: 'Cooking Staples' },
  { name: 'Cake mix', detail: 'Any flavor', size: '15.25 oz', category: 'Cooking Staples' },
  { name: 'Ranch dressing', detail: 'Any brand', size: '16 oz', category: 'Cooking Staples' },
  { name: 'Teriyaki sauce', detail: 'Any brand', size: '10 oz', category: 'Cooking Staples' },
  { name: 'Hoisin sauce', detail: 'Any brand', size: '7.9 oz', category: 'Cooking Staples' },
  { name: 'Fish sauce', detail: 'Any brand', size: '6.76 oz', category: 'Cooking Staples' },

  // ── Dairy (shelf-stable) ─────────────────────────────────────────────────
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

  // ── Snacks ───────────────────────────────────────────────────────────────
  { name: 'Pretzels', detail: 'Any brand', size: '16 oz', category: 'Snacks' },
  { name: 'Popcorn (microwave)', detail: 'Any flavor', size: '6-ct box', category: 'Snacks' },
  { name: 'Popcorn (ready-to-eat)', detail: 'Any brand', size: '6 oz bag', category: 'Snacks' },
  { name: 'Rice cakes', detail: 'Any flavor', size: '4.47 oz', category: 'Snacks' },
  { name: 'Trail mix', detail: 'Nuts and dried fruit', size: '9 oz', category: 'Snacks' },
  { name: 'Fruit & nut bar', detail: 'Larabar or similar', size: '6-ct', category: 'Snacks' },
  { name: 'Pork rinds', detail: 'Any brand', size: '3 oz', category: 'Snacks' },
  { name: 'Beef jerky', detail: 'Original flavor', size: '3.25 oz', category: 'Snacks' },
  { name: 'Chips (potato)', detail: 'Any brand', size: '8 oz', category: 'Snacks' },
  { name: 'Tortilla chips', detail: 'Any brand', size: '11 oz', category: 'Snacks' },
  { name: 'Animal crackers', detail: 'Any brand', size: '11 oz', category: 'Snacks' },
  { name: 'Pudding cups', detail: 'Chocolate or vanilla', size: '4-ct', category: 'Snacks' },
  { name: 'Fruit leather', detail: 'Any flavor', size: '6-ct', category: 'Snacks' },
  { name: 'Cookies (sandwich)', detail: 'Oreo or similar', size: '14.3 oz', category: 'Snacks' },
  { name: 'Cookies (oatmeal raisin)', detail: 'Any brand', size: '13 oz', category: 'Snacks' },
  { name: 'Protein bar', detail: 'Any brand/flavor', size: '6-ct box', category: 'Snacks' },
  { name: 'Raisins', detail: 'Any brand', size: '15 oz', category: 'Snacks' },
  { name: 'Raisins (snack boxes)', detail: 'Individual boxes', size: '6-ct', category: 'Snacks' },
  { name: 'Dried cranberries', detail: 'Any brand', size: '12 oz', category: 'Snacks' },
  { name: 'Dried apricots', detail: 'Any brand', size: '6 oz', category: 'Snacks' },
  { name: 'Dried mango', detail: 'Unsweetened preferred', size: '6 oz', category: 'Snacks' },
  { name: 'Prunes (dried plums)', detail: 'Pitted', size: '12 oz', category: 'Snacks' },
  { name: 'Peanuts (roasted)', detail: 'Salted or unsalted', size: '16 oz', category: 'Snacks' },
  { name: 'Cashews', detail: 'Whole, salted or unsalted', size: '8 oz', category: 'Snacks' },

  // ── Baby & Kids ──────────────────────────────────────────────────────────
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

  // ── Diapers ──────────────────────────────────────────────────────────────
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

  // ── Hygiene & Personal Care ──────────────────────────────────────────────
  { name: 'Shampoo', detail: 'Any brand, adults', size: '12 oz', category: 'Hygiene' },
  { name: 'Shampoo (large)', detail: 'Any brand', size: '20 oz', category: 'Hygiene' },
  { name: 'Conditioner', detail: 'Any brand', size: '12 oz', category: 'Hygiene' },
  { name: 'Body wash', detail: 'Any scent', size: '18 oz', category: 'Hygiene' },
  { name: 'Body wash (large)', detail: 'Any scent', size: '32 oz', category: 'Hygiene' },
  { name: 'Bar soap', detail: 'Any brand', size: '4-ct pack', category: 'Hygiene' },
  { name: 'Hand soap (liquid)', detail: 'Pump bottle', size: '7.5 oz', category: 'Hygiene' },
  { name: 'Hand soap (refill)', detail: 'Any brand', size: '50 oz', category: 'Hygiene' },
  { name: 'Deodorant', detail: 'Any scent, men or women', size: '2.6 oz', category: 'Hygiene' },
  { name: 'Deodorant (large)', detail: 'Any scent', size: '3.0 oz', category: 'Hygiene' },
  { name: 'Toothpaste', detail: 'Fluoride, any brand', size: '4.1 oz', category: 'Hygiene' },
  { name: 'Toothpaste (large)', detail: 'Fluoride, any brand', size: '6 oz', category: 'Hygiene' },
  { name: 'Toothbrush', detail: 'Soft bristle', size: '1-pack', category: 'Hygiene' },
  { name: 'Toothbrush (family pack)', detail: 'Soft bristle', size: '4-pack', category: 'Hygiene' },
  { name: 'Dental floss', detail: 'Any brand', size: '40 m', category: 'Hygiene' },
  { name: 'Razors (disposable)', detail: 'Any brand', size: '4-ct', category: 'Hygiene' },
  { name: 'Razors (disposable, large)', detail: 'Any brand', size: '8-ct', category: 'Hygiene' },
  { name: 'Shaving cream', detail: 'Any brand', size: '7 oz', category: 'Hygiene' },
  { name: 'Feminine pads', detail: 'Regular or overnight', size: '36-ct', category: 'Hygiene' },
  { name: 'Feminine pads (large)', detail: 'Regular or overnight', size: '54-ct', category: 'Hygiene' },
  { name: 'Tampons', detail: 'Regular absorbency', size: '36-ct', category: 'Hygiene' },
  { name: 'Tampons (multi-pack)', detail: 'Regular/Super variety', size: '54-ct', category: 'Hygiene' },
  { name: 'Sunscreen', detail: 'SPF 30+, any brand', size: '3 oz', category: 'Hygiene' },
  { name: 'Lotion (body)', detail: 'Unscented preferred', size: '10 oz', category: 'Hygiene' },
  { name: 'Chapstick / lip balm', detail: 'Any brand', size: '2-pack', category: 'Hygiene' },
  { name: 'Hand sanitizer', detail: '62%+ alcohol', size: '8 oz', category: 'Hygiene' },
  { name: 'Face masks (disposable)', detail: '3-layer, adult', size: '50-ct', category: 'Hygiene' },

  // ── Household Supplies ───────────────────────────────────────────────────
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

  // ── Pet Food ─────────────────────────────────────────────────────────────
  { name: 'Dog food (dry)', detail: 'Adult formula, any brand', size: '8 lb', category: 'Pet Food' },
  { name: 'Dog food (dry, large)', detail: 'Adult formula, any brand', size: '20 lb', category: 'Pet Food' },
  { name: 'Dog food (wet/canned)', detail: 'Any flavor, adult', size: '13 oz can', category: 'Pet Food' },
  { name: 'Dog treats', detail: 'Any brand', size: '12 oz', category: 'Pet Food' },
  { name: 'Cat food (dry)', detail: 'Adult formula, any brand', size: '7 lb', category: 'Pet Food' },
  { name: 'Cat food (dry, large)', detail: 'Adult formula, any brand', size: '16 lb', category: 'Pet Food' },
  { name: 'Cat food (wet/canned)', detail: 'Any flavor, adult', size: '5.5 oz can', category: 'Pet Food' },
  { name: 'Cat treats', detail: 'Any brand', size: '3 oz', category: 'Pet Food' },
  { name: 'Cat litter', detail: 'Clumping, unscented preferred', size: '20 lb', category: 'Pet Food' },
  { name: 'Dog & cat food (mixed pack)', detail: 'Variety wet food cans', size: '12-ct', category: 'Pet Food' },
]

/**
 * POST /api/admin/seed
 * Super-admin only. Seeds all catalog items (idempotent) and ensures at least
 * one food bank exists. Safe to run multiple times.
 */
export async function POST() {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let catalogInserted = 0
  let catalogSkipped = 0

  // Insert catalog items in batches of 20 to stay within query limits
  for (const item of CATALOG_ITEMS) {
    try {
      const { rowCount } = await sql`
        INSERT INTO item_catalog (name, detail, size, category)
        VALUES (${item.name}, ${item.detail}, ${item.size}, ${item.category})
        ON CONFLICT (name) DO UPDATE
          SET detail   = EXCLUDED.detail,
              size     = EXCLUDED.size,
              category = EXCLUDED.category
        RETURNING id
      `
      if ((rowCount ?? 0) > 0) catalogInserted++
    } catch {
      catalogSkipped++
    }
  }

  // Ensure at least one food bank row exists
  let bankSeeded = false
  try {
    const { rows: existing } = await sql`SELECT COUNT(*)::int AS cnt FROM banks`
    if ((existing[0]?.cnt ?? 0) === 0) {
      await sql`
        INSERT INTO banks (name, location)
        VALUES ('My Food Bank', 'Update location in settings')
      `
      bankSeeded = true
    }
  } catch {
    // banks table may not exist yet — tell the user to run migrate first
    return NextResponse.json(
      { error: 'Run the database migration first (Setup → Run migration), then seed.' },
      { status: 422 }
    )
  }

  return NextResponse.json({
    ok: true,
    catalog: { inserted: catalogInserted, skipped: catalogSkipped, total: CATALOG_ITEMS.length },
    bankSeeded,
  })
}
