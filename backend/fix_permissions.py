# Fix PostgreSQL Permissions for Schema Access
import psycopg2

DB_ADMIN_USER = "postgres"
DB_ADMIN_PASSWORD = "Mavi@321"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "lms_db"
DB_USER = "lms_user"

def fix_permissions():
    """Grant all necessary permissions to lms_user"""
    try:
        print("Connecting to lms_db...")
        conn = psycopg2.connect(
            user=DB_ADMIN_USER,
            password=DB_ADMIN_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print(f"Granting schema permissions to {DB_USER}...")
        
        # Grant usage on public schema
        cursor.execute(f"GRANT ALL ON SCHEMA public TO {DB_USER}")
        
        # Grant all privileges on all tables
        cursor.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {DB_USER}")
        
        # Grant all privileges on all sequences
        cursor.execute(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {DB_USER}")
        
        # Make lms_user the owner of the database for future tables
        cursor.execute(f"ALTER DATABASE {DB_NAME} OWNER TO {DB_USER}")
        
        print("✅ Permissions fixed!")
        print(f"\nNow the {DB_USER} can create tables.")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_permissions()
