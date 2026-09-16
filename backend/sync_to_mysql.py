import os
import getpass
import pymysql

def sync_mysql(password="root", host="localhost", user="root", port=3306):
    sql_file = os.path.join(os.path.dirname(__file__), "mplad_monitor_mysql.sql")
    
    print(f"Connecting to MySQL server at {host}:{port} as user '{user}'...")
    try:
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            port=port,
            client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
        )
    except Exception as e:
        print(f"Failed to connect: {e}")
        return False

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print("Executing mplad_monitor_mysql.sql...")
    with conn.cursor() as cursor:
        cursor.execute(sql_content)
    conn.commit()
    conn.close()

    print("\nSUCCESS! Database 'mplad_monitor' created and seeded in MySQL!")
    print("You can now open MySQL Workbench 8.0 CE, refresh Schemas, and see 'mplad_monitor' with all tables!")
    return True

if __name__ == "__main__":
    import sys
    pwd = sys.argv[1] if len(sys.argv) > 1 else "root"
    sync_mysql(password=pwd)
