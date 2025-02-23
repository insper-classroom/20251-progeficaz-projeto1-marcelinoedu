from database import database

def get_notes():
    db_conn = database.database_conexion()
    cursor = db_conn.cursor()
    
    cursor.execute("SELECT * FROM notes")
    notes = [
        {
            'id': row[0], 'title': row[1], 'description': row[2],
            'position_x': row[3], 'position_y': row[4], 'width': row[5],
            'height': row[6], 'text_color': row[7], 'background_color': row[8]
        } for row in cursor.fetchall()
    ]
    
    db_conn.close()
    return notes


def add_note(note):
    db_conn = database.database_conexion()
    cursor = db_conn.cursor()
    
    cursor.execute("""
        INSERT INTO notes (title, description, position_x, position_y, width, height, text_color, background_color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (note['title'], note['description'], note['position_x'], note['position_y'], note['width'], note['height'], note['text_color'], note['background_color']))
    
    db_conn.commit()
    note_id = cursor.lastrowid
    
    db_conn.close()
    return note_id


def update_note(note_id, data):
    db_conn = database.database_conexion()
    cursor = db_conn.cursor()
    allowed_fields = ['title', 'description', 'position_x', 'position_y', 'width', 'height', 'text_color', 'background_color']
    
    fields = []
    values = []

    for field in allowed_fields:
        if field in data:
            fields.append(f"{field} = ?")
            values.append(data[field])

    if not fields:
        return False

    values.append(note_id) 

    query = f"UPDATE notes SET {', '.join(fields)} WHERE id = ?"
    
    cursor.execute(query, values)
    rows_affected = cursor.rowcount
    
    db_conn.commit()
    db_conn.close()

    return rows_affected > 0 



def delete_note(note_id):
    db_conn = database.database_conexion()
    cursor = db_conn.cursor()
    
    cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    rows_affected = cursor.rowcount
    
    db_conn.commit()
    db_conn.close()
    
    return rows_affected > 0
