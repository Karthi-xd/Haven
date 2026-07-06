import os
import sqlite3

os.chdir('backend')

db_path = os.path.join(os.getcwd(), 'db.sqlite3')

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    exit()

print(f"Database exists at: {db_path}")
print()

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
    print()
    
    print("=== Table Structure ===")
    for table in tables:
        table_name = table[0]
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        print(f"\n{table_name}:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            
    print("\n=== Sample Data (first 3 rows) ===")
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
        rows = cursor.fetchall()
        
        if rows:
            print(f"\n{table_name} (showing first 3 rows):")
            
            # Get column names
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            col_names = [col[1] for col in columns]
            
            # Print header
            header = "  | ".join(f"{name:20}" for name in col_names[:3])
            print(f"  {header}")
            
            # Print data
            for row in rows:
                # Show first 3 columns
                row_str = "  | ".join(f"{str(val):20}" for val in row[:3])
                print(f"  {row_str}")
        
    conn.close()
    
    print("\n=== Indexes ===")
    for table in tables:
        table_name = table[0]
        cursor.execute(f"PRAGMA index_list({table_name})")
        indexes = cursor.fetchall()
        if indexes:
            print(f"\n{table_name}:")
            for idx in indexes:
                idx_name = idx[1]
                cursor.execute(f"PRAGMA index_info({idx_name})")
                idx_info = cursor.fetchall()
                print(f"  Index: {idx_name}")
                for i, info in enumerate(idx_info):
                    col_name = info[2]
                    print(f"    Column {i}: {col_name}")
                    
except Exception as e:
    print(f"Error: {e}")
END_PYTHON