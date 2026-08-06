-- Create Store table
CREATE TABLE IF NOT EXISTS finsync."Store" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company_id INTEGER NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES finsync."Project"(id) ON DELETE SET NULL,
    storekeeper_id INTEGER REFERENCES finsync."User"(id) ON DELETE SET NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Store_companyId_name_key" ON finsync."Store"(company_id, name);
CREATE INDEX IF NOT EXISTS "Store_companyId_idx" ON finsync."Store"(company_id);
CREATE INDEX IF NOT EXISTS "Store_projectId_idx" ON finsync."Store"(project_id);

-- Create StoreTransfer table
CREATE TABLE IF NOT EXISTS finsync."StoreTransfer" (
    id SERIAL PRIMARY KEY,
    from_store_id INTEGER NOT NULL REFERENCES finsync."Store"(id),
    to_store_id INTEGER NOT NULL REFERENCES finsync."Store"(id),
    item_id INTEGER NOT NULL REFERENCES finsync."StoreItem"(id),
    quantity DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    requested_by_id INTEGER NOT NULL REFERENCES finsync."User"(id),
    approved_by_id INTEGER REFERENCES finsync."User"(id),
    completed_at TIMESTAMP(3),
    note TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StoreTransfer_fromStoreId_idx" ON finsync."StoreTransfer"(from_store_id);
CREATE INDEX IF NOT EXISTS "StoreTransfer_toStoreId_idx" ON finsync."StoreTransfer"(to_store_id);
CREATE INDEX IF NOT EXISTS "StoreTransfer_status_idx" ON finsync."StoreTransfer"(status);

-- Add storeId to StoreItem (nullable first, then we'll backfill)
ALTER TABLE finsync."StoreItem" ADD COLUMN IF NOT EXISTS store_id INTEGER;
CREATE INDEX IF NOT EXISTS "StoreItem_storeId_idx" ON finsync."StoreItem"(store_id);

-- Add storeId to StoreTransaction
ALTER TABLE finsync."StoreTransaction" ADD COLUMN IF NOT EXISTS store_id INTEGER;
CREATE INDEX IF NOT EXISTS "StoreTransaction_storeId_idx" ON finsync."StoreTransaction"(store_id);

-- Add storeId to StoreRequest
ALTER TABLE finsync."StoreRequest" ADD COLUMN IF NOT EXISTS store_id INTEGER;

-- Add storeId to StoreCategory
ALTER TABLE finsync."StoreCategory" ADD COLUMN IF NOT EXISTS store_id INTEGER;
