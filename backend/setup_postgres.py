# PostgreSQL Database Setup Script
# Run this to create the database and user

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# PostgreSQL admin connection (default user)
DB_ADMIN_USER = "postgres"
DB_ADMIN_PASSWORD = "Mavi@321"  # User's PostgreSQL password
DB_HOST = "localhost"
DB_PORT = "5432"

# New database details
DB_NAME = "lms_db"
DB_USER = "lms_user"
DB_PASSWORD = "lms_password"  # Change this for production!

def setup_database():
    """Create database and user for LMS"""
    try:
        # Connect to PostgreSQL server
        print(f"Connecting to PostgreSQL at {DB_HOST}:{DB_PORT}...")
        conn = psycopg2.connect(
            user=DB_ADMIN_USER,
            password=DB_ADMIN_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database="postgres"  # Connect to default database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        exists = cursor.fetchone()
        
        if not exists:
            # Create database
            print(f"Creating database '{DB_NAME}'...")
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"✅ Database '{DB_NAME}' created successfully!")
        else:
            print(f"ℹ️  Database '{DB_NAME}' already exists")
        
        # Check if user exists
        cursor.execute(f"SELECT 1 FROM pg_roles WHERE rolname = '{DB_USER}'")
        user_exists = cursor.fetchone()
        
        if not user_exists:
            # Create user
            print(f"Creating user '{DB_USER}'...")
            cursor.execute(f"CREATE USER {DB_USER} WITH PASSWORD '{DB_PASSWORD}'")
            print(f"✅ User '{DB_USER}' created successfully!")
        else:
            print(f"ℹ️  User '{DB_USER}' already exists")
        
        # Grant privileges
        print(f"Granting privileges to '{DB_USER}' on '{DB_NAME}'...")
        cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER}")
        print(f"✅ Privileges granted!")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("🎉 PostgreSQL Setup Complete!")
        print("="*60)
        print(f"\nDatabase URL:")
        print(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
        print("\nAdd this to your .env file:")
        print(f'DATABASE_URL=postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}')
        print("="*60)
        
    except psycopg2.Error as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check if the admin password is correct")
        print("3. Update DB_ADMIN_PASSWORD in this script if needed")

if __name__ == "__main__":
    setup_database()
