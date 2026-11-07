CREATE DATABASE IF NOT EXISTS online_pharmacy;
USE online_pharmacy;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) DEFAULT 'CUSTOMER'
);

CREATE TABLE IF NOT EXISTS medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    manufacturer VARCHAR(100),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    expiry_date DATE
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Pending',
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_items_order FOREIGN KEY (order_id)
      REFERENCES orders(order_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_items_medicine FOREIGN KEY (medicine_id)
      REFERENCES medicines(medicine_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Demo data. Passwords are plain text only for this database demonstration.
-- The application hashes passwords when a user is created through the website.
INSERT IGNORE INTO users (user_id, name, email, password, phone, role) VALUES
(1, 'Sindhuja', 'sindhuja@example.com', 'demo123', '9876543210', 'CUSTOMER'),
(2, 'Poojitha', 'poojitha@example.com', 'demo123', '9876543211', 'CUSTOMER'),
(3, 'Harika', 'harika@example.com', 'demo123', '9876543212', 'CUSTOMER'),
(4, 'Pharmacy Admin', 'admin@example.com', 'demo123', '9876543213', 'ADMIN'),
(5, 'Keerthi', 'keerthi@example.com', 'demo123', '9876543214', 'CUSTOMER');

INSERT IGNORE INTO medicines
(medicine_id, medicine_name, category, manufacturer, price, stock, expiry_date) VALUES
(1, 'Paracetamol 500mg', 'Tablet', 'ABC Pharma', 25.00, 100, '2027-12-31'),
(2, 'Cetirizine 10mg', 'Tablet', 'XYZ Pharma', 18.50, 80, '2027-10-31'),
(3, 'Amoxicillin 250mg', 'Capsule', 'MediCare Pharma', 65.00, 50, '2027-09-30'),
(4, 'Vitamin C 500mg', 'Tablet', 'HealthCare Pharma', 40.00, 120, '2028-01-31'),
(5, 'Antiseptic Cream', 'Cream', 'LifeCare Pharma', 55.00, 40, '2027-08-31'),
(6, 'Cough Syrup', 'Syrup', 'Wellness Pharma', 90.00, 35, '2027-11-30'),
(7, 'Calcium Tablets', 'Tablet', 'ABC Pharma', 75.00, 60, '2028-03-31'),
(8, 'ORS Powder', 'Powder', 'HealthCare Pharma', 20.00, 150, '2027-07-31'),
(9, 'Pain Relief Gel', 'Gel', 'MediCare Pharma', 110.00, 45, '2027-06-30'),
(10, 'Multivitamin Tablets', 'Tablet', 'Wellness Pharma', 150.00, 70, '2028-05-31');

INSERT IGNORE INTO orders (order_id, user_id, order_date, total_amount, status) VALUES
(1, 1, '2026-11-01', 50.00, 'Delivered'),
(2, 2, '2026-11-02', 130.00, 'Pending'),
(3, 3, '2026-11-03', 90.00, 'Processing'),
(4, 1, '2026-11-04', 150.00, 'Shipped'),
(5, 5, '2026-11-05', 75.00, 'Delivered'),
(6, 2, '2026-11-06', 80.00, 'Pending');

INSERT IGNORE INTO order_items (item_id, order_id, medicine_id, quantity, price) VALUES
(1, 1, 1, 2, 25.00),
(2, 2, 3, 2, 65.00),
(3, 3, 6, 1, 90.00),
(4, 4, 10, 1, 150.00),
(5, 5, 7, 1, 75.00),
(6, 6, 4, 2, 40.00);
