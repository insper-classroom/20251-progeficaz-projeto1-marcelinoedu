import sqlite3


def database_conexion():
    conn = sqlite3.connect("database/main.db")   
    return conn



def create_table_notes():
    db_conn = database_conexion()
    cursor = db_conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        position_x INTEGER NOT NULL,
        position_y INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        text_color TEXT NOT NULL,
        background_color TEXT NOT NULL
    )
    """)

    db_conn.commit()
    db_conn.close()
    return True
