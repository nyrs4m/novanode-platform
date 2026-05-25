-- =============================================
-- NOVANODE INC. - STAGE 1 SCHEMA
-- Multi-tenant QR Restaurant Platform
-- =============================================

-- 1. NOVANODE SUPER ADMINS
CREATE TABLE novanode_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RESTAURANTS MASTER TABLE
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'GHS',
    logo_url TEXT,
    whatsapp_api_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RESTAURANT STAFF
CREATE TABLE restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MENU CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MENU ITEMS
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name_en VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),
    description_en TEXT,
    description_fr TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    customization_options JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    customer_whatsapp VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESTAURANT SUSPENSION SYSTEM
-- =============================================

-- Add suspension columns to restaurants
ALTER TABLE restaurants 
ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN suspension_reason TEXT,
ADD COLUMN suspended_by UUID REFERENCES auth.users(id);

-- Update the public view policy to block suspended restaurants
DROP POLICY "Public can view active restaurants" ON restaurants;
CREATE POLICY "Public can view active restaurants"
    ON restaurants FOR SELECT
    USING (
        is_active = TRUE 
        AND suspended_at IS NULL
    );

-- Suspension audit log
CREATE TABLE suspension_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL, -- 'suspended' or 'reinstated'
    reason TEXT,
    actioned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE suspension_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only superadmins can view logs"
    ON suspension_logs FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                SELECT email FROM novanode_admins
            )
        )
    );
    
-- 7. QR CODES PER TABLE
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    qr_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- NOVANODE ADMINS
ALTER TABLE novanode_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmins only"
    ON novanode_admins
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
        SELECT email FROM novanode_admins
    )));

-- RESTAURANTS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active restaurants"
    ON restaurants FOR SELECT
    USING (is_active = TRUE);
CREATE POLICY "Staff can view their restaurant"
    ON restaurants FOR SELECT
    USING (
        id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid()
        )
    );

-- RESTAURANT STAFF
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view own record"
    ON restaurant_staff FOR SELECT
    USING (user_id = auth.uid());

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view categories"
    ON categories FOR SELECT
    USING (TRUE);
CREATE POLICY "Staff can manage their categories"
    ON categories FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid()
        )
    );

-- MENU ITEMS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view available items"
    ON menu_items FOR SELECT
    USING (is_available = TRUE);
CREATE POLICY "Staff can manage their menu items"
    ON menu_items FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid()
        )
    );

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order"
    ON orders FOR INSERT
    WITH CHECK (TRUE);
CREATE POLICY "Staff can view and update their orders"
    ON orders FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Staff can update their orders"
    ON orders FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid()
        )
    );

-- QR CODES
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view QR codes"
    ON qr_codes FOR SELECT
    USING (TRUE);
CREATE POLICY "Staff can manage their QR codes"
    ON qr_codes FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- SEED DATA - TEST RESTAURANT
-- =============================================

INSERT INTO restaurants (name, slug, currency)
VALUES ('Starbite Kitchen', 'starbite', 'GHS');

INSERT INTO categories (restaurant_id, name_en, name_fr, sort_order)
VALUES 
    (
        (SELECT id FROM restaurants WHERE slug = 'starbite'),
        'Main Dishes', 'Plats Principaux', 1
    ),
    (
        (SELECT id FROM restaurants WHERE slug = 'starbite'),
        'Drinks', 'Boissons', 2
    ),
    (
        (SELECT id FROM restaurants WHERE slug = 'starbite'),
        'Sides', 'Accompagnements', 3
    );