 Sindhuja PHARMACY - ONLINE PHARMACY MANAGEMENT SYSTEM
=====================================================

TECHNOLOGIES
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Database: MySQL
- Database driver: mysql2

FEATURES
- Dashboard with record counts
- Users: Create, Read, Update and Delete
- Medicines: Create, Read, Update and Delete
- Orders: Create, Read, Update and Delete
- Order Items: Create, Read, Update and Delete
- Basic password hashing for users created through the website
- Foreign-key error messages for invalid related IDs

IMPORTANT
This is an educational CRUD demonstration, not a production-ready online pharmacy.
It does not include customer login, prescription verification, payment processing,
medicine recommendations, or legal/licensing workflows. Do not use it to sell medicines.

SETUP ON WINDOWS
----------------

1. Install Node.js and MySQL Server / MySQL Workbench if they are not already installed.

2. Extract this ZIP file.

3. Open the extracted folder in VS Code:
   Online-Pharmacy-Management-System

4. Create the database:
   - Open MySQL Workbench.
   - Connect to your MySQL connection.
   - Open database.sql from this folder.
   - Copy all SQL commands into a new SQL tab.
   - Click the lightning bolt Execute button.
   - Wait for the commands to finish.

   The script creates the database and four tables:
   users, medicines, orders, order_items.
   It also inserts demo records.

   If you already have tables with a different structure, back up your data first.
   Do not blindly run conflicting CREATE TABLE statements over an existing project.
   For a clean new setup, use a new database or reconcile the old table structure.

5. Configure database credentials:
   - In VS Code, create a file named .env in the project root.
   - Copy the following into .env:

     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_actual_mysql_password
     DB_NAME=online_pharmacy
     PORT=3000

   - Replace your_actual_mysql_password with your MySQL root password.
   - If your MySQL root account has no password, leave DB_PASSWORD empty:
     DB_PASSWORD=

6. Open Terminal > New Terminal in VS Code. Confirm that the terminal path
   is the project folder, then run:

     npm install

7. Start the website:

     npm start

8. Open this address in Chrome or Edge:

     http://localhost:3000

9. The dashboard should show the totals for users, medicines, orders and order items.
   Open the Users, Medicines, Orders and Order Items pages to manage records.

TROUBLESHOOTING
---------------
- "Database connection failed": check that MySQL Server is running and .env values
  match your MySQL connection.
- "Access denied for user": correct DB_USER / DB_PASSWORD in .env.
- "Unknown database": execute database.sql in MySQL Workbench.
- "Unknown column": your existing table schema does not match database.sql.
  Check it with DESCRIBE table_name; and resolve the schema before inserting data.
- "Cannot add or update a child row": the referenced user_id, order_id or medicine_id
  must already exist in its parent table.
- Port 3000 in use: change PORT=3001 in .env and restart; then open localhost:3001.

DATA RELATIONSHIPS
------------------
users (1) -------- (many) orders
orders (1) ------- (many) order_items
medicines (1) ---- (many) order_items

DEMO DATA NOTE
--------------
The SQL demo users use plain-text placeholder passwords for easy database viewing.
They are not login accounts. User records created through the website have their
passwords hashed. This project currently has no login page.

Enjoy building your project!
