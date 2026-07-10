import sqlite3
import os

# Define the path for the dummy database
db_path = os.path.join(os.path.dirname(__file__), "dummy.db")

# Remove the file if it already exists so we can start fresh
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create 'departments' table
cursor.execute('''
CREATE TABLE departments (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
)
''')

# Create 'employees' table
cursor.execute('''
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department_id INTEGER,
    salary INTEGER,
    FOREIGN KEY(department_id) REFERENCES departments(id)
)
''')

# Insert dummy departments
departments = [
    (1, 'Engineering'),
    (2, 'Sales'),
    (3, 'HR'),
    (4, 'Marketing')
]
cursor.executemany('INSERT INTO departments VALUES (?, ?)', departments)

# Insert dummy employees
employees = [
    (1, 'Alice Smith', 1, 120000),
    (2, 'Bob Jones', 1, 115000),
    (3, 'Charlie Brown', 2, 85000),
    (4, 'David Wilson', 2, 90000),
    (5, 'Eve Davis', 3, 75000),
    (6, 'Frank Miller', 1, 105000),
    (7, 'Grace Lee', 4, 82000)
]
cursor.executemany('INSERT INTO employees VALUES (?, ?, ?, ?)', employees)

# Commit changes and close
conn.commit()
conn.close()

print(f"✅ Dummy database created successfully at: {db_path}")
print("\n🔗 Use the following Connection URL in the SQLWizard UI when creating a new playground:")
print(f"sqlite:///{os.path.abspath(db_path)}")
