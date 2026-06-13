CREATE TYPE order_status AS ENUM ('new', 'confirmed', 'shipped', 'cancelled');

CREATE TYPE user_role AS ENUM ('customer', 'seller');

CREATE TABLE products (
	id UUID NOT NULL, 
	retailer_id VARCHAR(255) NOT NULL, 
	name VARCHAR(512) NOT NULL, 
	description TEXT, 
	price_minor INTEGER NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	availability VARCHAR(32), 
	image_url VARCHAR(1024), 
	meta_raw JSONB, 
	synced_at TIMESTAMP WITH TIME ZONE, 
	is_active BOOLEAN NOT NULL, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_products_retailer_id ON products (retailer_id);

CREATE TABLE sync_logs (
	id UUID NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	finished_at TIMESTAMP WITH TIME ZONE, 
	status VARCHAR(32) NOT NULL, 
	products_upserted INTEGER NOT NULL, 
	error_text TEXT, 
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id UUID NOT NULL, 
	email VARCHAR(320) NOT NULL, 
	password_hash VARCHAR(255), 
	google_sub VARCHAR(255), 
	role user_role NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (google_sub)
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

CREATE TABLE product_extras (
	product_id UUID NOT NULL, 
	long_description TEXT, 
	extra_images JSONB, 
	tags JSONB, 
	PRIMARY KEY (product_id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

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
