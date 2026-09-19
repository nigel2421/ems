import os
import json
import sqlite3
import sys

def get_env_credentials():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    creds = {
        'host': 'localhost',
        'port': 5432,
        'dbname': 'wemisico_ems',
        'user': 'wemisico_adminuser',
        'password': 'OPxpBO,dqGrsQ9,#'
    }
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('DB_HOST='):
                    creds['host'] = line.split('=', 1)[1]
                elif line.startswith('DB_PORT='):
                    creds['port'] = int(line.split('=', 1)[1])
                elif line.startswith('DB_NAME='):
                    creds['dbname'] = line.split('=', 1)[1]
                elif line.startswith('DB_USER='):
                    creds['user'] = line.split('=', 1)[1]
                elif line.startswith('DB_PASSWORD='):
                    creds['password'] = line.split('=', 1)[1]
    return creds

def print_setup_instructions():
    creds = get_env_credentials()
    schema_path = os.path.join(os.path.dirname(__file__), 'postgres_schema.sql')
    print("=" * 70)
    print("      POSTGRESQL DATABASE SETUP FOR EMS (wemisico_ems)")
    print("=" * 70)
    print(f"Target Database: {creds['dbname']}")
    print(f"User / Owner:    {creds['user']}")
    print(f"Host:            {creds['host']}:{creds['port']}")
    print(f"Password:        {creds['password']}")
    print("=" * 70)
    print("\nTo initialize this database on your PostgreSQL server, run:")
    print("\n1. Create the Database & User (if not already created in psql or cPanel):")
    print(f"   CREATE DATABASE {creds['dbname']};")
    print(f"   CREATE USER {creds['user']} WITH PASSWORD '{creds['password']}';")
    print(f"   GRANT ALL PRIVILEGES ON DATABASE {creds['dbname']} TO {creds['user']};")
    print("\n2. Execute the Schema Script:")
    print(f"   psql -h {creds['host']} -U {creds['user']} -d {creds['dbname']} -f \"{schema_path}\"")
    print("\nOr in psql console:")
    print(f"   \\i {schema_path.replace('\\', '/')}")
    print("=" * 70)

def main():
    creds = get_env_credentials()
    try:
        import psycopg2
        print(f"Connecting to PostgreSQL database '{creds['dbname']}' on {creds['host']}...")
        conn = psycopg2.connect(
            host=creds['host'],
            port=creds['port'],
            dbname=creds['dbname'],
            user=creds['user'],
            password=creds['password']
        )
        cursor = conn.cursor()
        schema_path = os.path.join(os.path.dirname(__file__), 'postgres_schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        cursor.execute(sql_script)
        conn.commit()
        print("Schema successfully applied to PostgreSQL database!")
        conn.close()
    except ImportError:
        print("\n[NOTE] 'psycopg2' Python driver is not installed locally.")
        print_setup_instructions()
    except Exception as e:
        print(f"\n[NOTE] Could not connect directly to local PostgreSQL server: {e}")
        print_setup_instructions()

if __name__ == '__main__':
    main()
