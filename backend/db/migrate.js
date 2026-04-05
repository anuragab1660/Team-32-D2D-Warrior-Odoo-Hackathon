const pool = require('./index');

async function runMigrations() {
  const migrations = [
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(10,2)`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20)`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_id UUID REFERENCES taxes(id) ON DELETE SET NULL`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS default_discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL`,
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('Migration failed:', sql, '\n', err.message);
    }
  }
  console.log('Migrations complete');
}

module.exports = runMigrations;
