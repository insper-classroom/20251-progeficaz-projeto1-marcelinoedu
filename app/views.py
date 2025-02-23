from flask import jsonify, render_template, request
import services


def index():
    return render_template('index.html')
    
def get_notes():
    notes = services.get_notes()
    return jsonify(notes), 200


def add_note():
    data = request.get_json()
    
    required_fields = ['title', 'description', 'position_x', 'position_y', 'width', 'height', 'text_color', 'background_color']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Campos obrigatórios ausentes'}), 400

    note_id = services.add_note(data)
    return jsonify({'message': 'Nota criada', 'id': note_id}), 201


def update_note(note_id):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Nenhum dado enviado'}), 400

    updated = services.update_note(note_id, data)
    if not updated:
        return jsonify({'error': 'Nota não encontrada'}), 404

    return jsonify({'message': 'Nota atualizada'}), 200



def delete_note(note_id):
    deleted = services.delete_note(note_id)
    if not deleted:
        return jsonify({'error': 'Nota não encontrada'}), 404

    return jsonify({'message': 'Nota removida'}), 200
