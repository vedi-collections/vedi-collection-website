CREATE TYPE order_status AS ENUM ('new', 'confirmed', 'shipped', 'cancelled');

CREATE TYPE user_role AS ENUM ('customer', 'admin');

CREATE TYPE product_status AS ENUM ('draft', 'scheduled', 'live', 'inactive');

CREATE TYPE product_audience AS ENUM ('women', 'men');

CREATE TYPE change_action AS ENUM ('create', 'update', 'delete');

CREATE TABLE products (
	id UUID NOT NULL,
	name VARCHAR(512) NOT NULL,
	description TEXT,
	price INTEGER NOT NULL,
	mrp INTEGER,
	stock_quantity INTEGER DEFAULT 0 NOT NULL,
	images JSONB DEFAULT '[]'::jsonb NOT NULL,
	audience product_audience DEFAULT 'women' NOT NULL,
	subcategory VARCHAR(128),
	status product_status DEFAULT 'draft' NOT NULL,
	is_active BOOLEAN DEFAULT true NOT NULL,
	go_live_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id UUID NOT NULL,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(320) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	role user_role NOT NULL,
	is_active BOOLEAN DEFAULT true NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE TABLE orders (
	id UUID NOT NULL,
	user_id UUID NOT NULL,
	status order_status NOT NULL,
	total_minor INTEGER NOT NULL,
	whatsapp_message_snapshot TEXT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_orders_user_id ON orders (user_id);

CREATE TABLE order_items (
	id UUID NOT NULL,
	order_id UUID NOT NULL,
	product_id UUID NOT NULL,
	qty INTEGER NOT NULL,
	unit_price_minor INTEGER NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(order_id) REFERENCES orders (id),
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE INDEX ix_order_items_order_id ON order_items (order_id);

CREATE INDEX ix_order_items_product_id ON order_items (product_id);

CREATE TABLE change_log (
	id UUID NOT NULL,
	admin_id UUID NOT NULL,
	product_id UUID NOT NULL,
	action change_action NOT NULL,
	field_changed VARCHAR(64),
	old_value TEXT,
	new_value TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(admin_id) REFERENCES users (id),
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE INDEX ix_change_log_product_id ON change_log (product_id);

CREATE INDEX ix_change_log_admin_id ON change_log (admin_id);

CREATE INDEX ix_change_log_created_at ON change_log (created_at);
