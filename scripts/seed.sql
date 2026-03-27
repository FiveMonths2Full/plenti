CREATE TABLE IF NOT EXISTS banks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Nearby'
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER NOT NULL REFERENCES banks(id),
  name TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  qty INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE banks ADD COLUMN IF NOT EXISTS admin_password_hash TEXT;

-- Seed banks
INSERT INTO banks (id, name, location) VALUES
  (1, 'Blacksburg Community Pantry', 'Downtown Blacksburg'),
  (2, 'Christiansburg Food Bank', 'Christiansburg'),
  (3, 'NRV Community Kitchen', 'NRV Region')
ON CONFLICT (id) DO NOTHING;

-- Seed items
INSERT INTO items (id, bank_id, name, detail, priority, qty) VALUES
  (1,  1, 'Peanut butter',   'Any size',                'high',   10),
  (2,  1, 'Canned beans',    'Black, kidney, or pinto', 'high',   20),
  (3,  1, 'Canned tuna',     'In water preferred',      'high',   15),
  (4,  1, 'Pasta',           'Spaghetti or penne',      'medium', 12),
  (5,  1, 'Rice (2 lb)',     'White or brown',           'medium',  8),
  (6,  1, 'Oatmeal',         'Instant or old-fashioned', 'low',    6),
  (7,  2, 'Canned soup',     'Any variety',             'high',   18),
  (8,  2, 'Mac & cheese',    'Any brand',               'high',   14),
  (9,  2, 'Cooking oil',     'Vegetable or canola',     'medium',  5),
  (10, 2, 'Cereal',          'Low sugar preferred',     'medium',  9),
  (11, 2, 'Canned fruit',    'In juice, not syrup',     'low',     7),
  (12, 3, 'Dried lentils',   'Any color',               'high',   11),
  (13, 3, 'Canned tomatoes', 'Diced or whole',          'medium',  8),
  (14, 3, 'Flour',           'All-purpose',             'low',     4)
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to avoid conflicts with future inserts
SELECT setval('banks_id_seq', (SELECT MAX(id) FROM banks));
SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));

-- Master item catalog
CREATE TABLE IF NOT EXISTS item_catalog (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  detail   TEXT NOT NULL DEFAULT '',
  category TEXT
);

CREATE TABLE IF NOT EXISTS catalog_requests (
  id         SERIAL PRIMARY KEY,
  bank_id    INTEGER REFERENCES banks(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed catalog (~80 common food bank items)
INSERT INTO item_catalog (name, detail, category) VALUES
  -- Protein
  ('Peanut butter',          'Any size',                        'Protein'),
  ('Canned tuna',            'In water preferred',              'Protein'),
  ('Canned chicken',         'Any brand',                       'Protein'),
  ('Canned salmon',          'Any brand',                       'Protein'),
  ('Canned beans (black)',   'Low sodium preferred',            'Protein'),
  ('Canned beans (kidney)',  'Low sodium preferred',            'Protein'),
  ('Canned beans (pinto)',   'Low sodium preferred',            'Protein'),
  ('Canned lentils',         'Any brand',                       'Protein'),
  ('Dried lentils',          'Any color',                       'Protein'),
  ('Dried beans',            'Any variety',                     'Protein'),
  ('Canned chickpeas',       'Low sodium preferred',            'Protein'),
  ('Nuts (mixed)',           'Unsalted preferred',              'Protein'),
  ('Almond butter',          'Any brand',                       'Protein'),
  ('Beef jerky',             'Any flavor',                      'Protein'),
  ('Sardines',               'In water or olive oil',           'Protein'),
  -- Grains
  ('Pasta (spaghetti)',      'Any brand, 1 lb',                 'Grains'),
  ('Pasta (penne)',          'Any brand, 1 lb',                 'Grains'),
  ('Rice (white)',           '2 lb bag',                        'Grains'),
  ('Rice (brown)',           '2 lb bag',                        'Grains'),
  ('Oatmeal',                'Instant or old-fashioned',        'Grains'),
  ('Grits',                  'Quick-cooking',                   'Grains'),
  ('Cornmeal',               'Any brand',                       'Grains'),
  ('Flour',                  'All-purpose',                     'Grains'),
  ('Bread mix',              'Any variety',                     'Grains'),
  ('Crackers',               'Whole grain preferred',           'Grains'),
  ('Cereal',                 'Low sugar preferred',             'Grains'),
  ('Granola bars',           'Any variety',                     'Grains'),
  ('Rice cakes',             'Any flavor',                      'Grains'),
  ('Instant potatoes',       'Any brand',                       'Grains'),
  -- Canned Goods
  ('Canned tomatoes (diced)','Low sodium preferred',            'Canned Goods'),
  ('Canned tomatoes (whole)','Low sodium preferred',            'Canned Goods'),
  ('Canned tomato sauce',    'No added sugar preferred',        'Canned Goods'),
  ('Canned corn',            'Low sodium preferred',            'Canned Goods'),
  ('Canned green beans',     'Low sodium preferred',            'Canned Goods'),
  ('Canned peas',            'Low sodium preferred',            'Canned Goods'),
  ('Canned carrots',         'Low sodium preferred',            'Canned Goods'),
  ('Canned mixed vegetables','Low sodium preferred',            'Canned Goods'),
  ('Canned soup (chicken noodle)', 'Low sodium preferred',      'Canned Goods'),
  ('Canned soup (tomato)',   'Low sodium preferred',            'Canned Goods'),
  ('Canned soup (vegetable)','Low sodium preferred',            'Canned Goods'),
  ('Canned fruit (peaches)', 'In juice, not syrup',             'Canned Goods'),
  ('Canned fruit (pears)',   'In juice, not syrup',             'Canned Goods'),
  ('Canned fruit (mixed)',   'In juice, not syrup',             'Canned Goods'),
  ('Applesauce',             'Unsweetened preferred',           'Canned Goods'),
  ('Canned pumpkin',         '100% pure, not pie mix',          'Canned Goods'),
  -- Cooking Staples
  ('Cooking oil (vegetable)','Any brand, 32 oz',                'Cooking Staples'),
  ('Cooking oil (olive)',    'Any brand',                       'Cooking Staples'),
  ('Sugar (white)',          '4 lb bag',                        'Cooking Staples'),
  ('Sugar (brown)',          '2 lb bag',                        'Cooking Staples'),
  ('Salt',                   'Iodized, any size',               'Cooking Staples'),
  ('Black pepper',           'Ground, any size',                'Cooking Staples'),
  ('Garlic powder',          'Any brand',                       'Cooking Staples'),
  ('Onion powder',           'Any brand',                       'Cooking Staples'),
  ('Chicken bouillon',       'Cubes or powder',                 'Cooking Staples'),
  ('Soy sauce',              'Low sodium preferred',            'Cooking Staples'),
  ('Hot sauce',              'Any variety',                     'Cooking Staples'),
  ('Vinegar',                'White or apple cider',            'Cooking Staples'),
  ('Baking powder',          'Any brand',                       'Cooking Staples'),
  ('Baking soda',            'Any brand',                       'Cooking Staples'),
  ('Yeast',                  'Active dry or instant',           'Cooking Staples'),
  -- Dairy & Eggs
  ('Shelf-stable milk',      '1% or 2%, any brand',             'Dairy & Eggs'),
  ('Powdered milk',          'Non-fat, any brand',              'Dairy & Eggs'),
  ('Evaporated milk',        'Any brand, 12 oz',                'Dairy & Eggs'),
  ('Condensed milk',         'Sweetened, any brand',            'Dairy & Eggs'),
  ('Peanut butter powder',   'Any brand',                       'Dairy & Eggs'),
  -- Beverages
  ('100% juice boxes',       'Any flavor, 6-pack',              'Beverages'),
  ('Apple juice',            '64 oz, 100% juice',               'Beverages'),
  ('Orange juice',           '64 oz, 100% juice',               'Beverages'),
  ('Instant coffee',         'Any brand',                       'Beverages'),
  ('Tea bags',               'Any variety, box of 20+',         'Beverages'),
  ('Hot cocoa mix',          'Any brand',                       'Beverages'),
  ('Powdered lemonade',      'Any brand',                       'Beverages'),
  -- Baby & Kids
  ('Baby formula',           'Check expiration date',           'Baby & Kids'),
  ('Baby food (pureed vegetables)', 'Stage 1 or 2',            'Baby & Kids'),
  ('Baby food (pureed fruit)',      'Stage 1 or 2',            'Baby & Kids'),
  ('Infant cereal',          'Rice or oatmeal, any brand',      'Baby & Kids'),
  ('Fruit pouches',          'Applesauce or mixed fruit',       'Baby & Kids'),
  ('Mac & cheese',           'Any brand',                       'Baby & Kids'),
  -- Household
  ('Dish soap',              'Any brand, 16 oz+',               'Household'),
  ('Laundry detergent',      'Any brand, small box or bottle',  'Household'),
  ('Shampoo',                'Any brand',                       'Household'),
  ('Bar soap',               'Any brand, 3-pack',               'Household'),
  ('Toothpaste',             'Any brand, fluoride',             'Household'),
  ('Toilet paper',           '4-pack or larger',                'Household'),
  ('Paper towels',           '2-pack or larger',                'Household'),
  ('Feminine hygiene products', 'Pads or tampons, any brand',   'Household'),
  ('Diapers (size 1-2)',     'Any brand',                       'Household'),
  ('Diapers (size 3-4)',     'Any brand',                       'Household')
ON CONFLICT (name) DO NOTHING;
