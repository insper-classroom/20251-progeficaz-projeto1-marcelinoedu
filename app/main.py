from flask import Flask, render_template
from database import database
import views

app = Flask(__name__)

app.route("/", methods=["GET"])(views.index)
app.route("/notes", methods=["GET"])(views.get_notes) 
app.route("/note", methods=["POST"])(views.add_note)  
app.route("/note/<int:note_id>", methods=["PUT"])(views.update_note)
app.route("/note/<int:note_id>", methods=["DELETE"])(views.delete_note)


@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

if __name__ == "__main__":
    database.create_table_notes()
    app.run(debug=True, port=5001)
