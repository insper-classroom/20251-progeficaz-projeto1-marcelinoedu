export class Flashcard {
  constructor(
    id,
    card_postion_x,
    card_postion_y,
    card_title,
    card_description,
    card_width = 200,
    card_height = 150,
    card_text_color,
    card_background_color
  ) {

    if (!card_text_color || !card_background_color) {
      const cardStyle = this.getFlashCardStyle();
      card_text_color = cardStyle.color;
      card_background_color = cardStyle.backgroundColor;
    }

    this.flashcardElement = document.createElement("div");
    this.flashCardData = {
      id,
      card_postion_x,
      card_postion_y,
      card_title,
      card_description,
      card_width,
      card_height,
      card_text_color,
      card_background_color,
    };
    this.changes = {};
    this.isDragging = false;
  }

  createElement() {
    this.flashcardElement.classList.add("note");

    Object.assign(this.flashcardElement.style, {
      width: `${this.flashCardData.card_width}px`,
      height: `${this.flashCardData.card_height}px`,
      left: `${this.flashCardData.card_postion_x}px`,
      top: `${this.flashCardData.card_postion_y}px`,
      backgroundColor: this.flashCardData.card_background_color,
      color: this.flashCardData.card_text_color,
    });

    this.flashcardElement.id = `flashcard-${this.flashCardData.id || Date.now()}`;

    this.flashcardElement.appendChild(this.createElementWithClass("div", "note-title", this.flashCardData.card_title));
    this.flashcardElement.appendChild(this.createElementWithClass("div", "note-description", this.flashCardData.card_description));

    this.attachDragEvent();
  }

  createElementWithClass(tag, className, text) {
    const element = document.createElement(tag);
    element.classList.add(className);
    element.innerText = text;
    return element;
  }

  getFlashCardStyle() {
    const colors = this.getAvailableColors();
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return { backgroundColor: randomColor, color: this.getContrast(randomColor) };
  }

  getAvailableColors() {
    return [
      "#FF4B5C",
      "#FFD56B",
      "#AFFC41",
      "#1EA896",
      "#83E377",
      "#BEE3DB",
      "#FFB5E8",
      "#A389F4",
      "#FF9B71",
      "#F4FCD9",
      "#5b76fe",
    ];
  }

  getContrast(hexcolor) {
    const hex = hexcolor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  }

  attachDragEvent() {
    let offsetX = 0, offsetY = 0;
    this.flashcardElement.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      offsetX = e.clientX - this.flashcardElement.offsetLeft;
      offsetY = e.clientY - this.flashcardElement.offsetTop;
      this.flashcardElement.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.flashcardElement.style.left = `${e.clientX - offsetX}px`;
      this.flashcardElement.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.flashcardElement.style.cursor = "grab";
      const newX = parseInt(this.flashcardElement.style.left, 10);
      const newY = parseInt(this.flashcardElement.style.top, 10);
      this.flashCardData.card_postion_x = newX;
      this.flashCardData.card_postion_y = newY;
      this.updateNotePositionAPI();
    });
  }

  saveCard() {
    if (!this.flashCardData.id) {
      this.createNoteAPI();
    } else {
      this.updateNoteAPI();
    }
  }

  updateDOM() {
    Object.assign(this.flashCardData, {
      card_title: this.changes.card_title || this.flashCardData.card_title,
      card_description: this.changes.card_description || this.flashCardData.card_description,
      card_text_color: this.changes.card_text_color || this.flashCardData.card_text_color,
      card_background_color: this.changes.card_background_color || this.flashCardData.card_background_color,
    });

    const titleElem = this.flashcardElement.querySelector(".note-title");
    const descElem = this.flashcardElement.querySelector(".note-description");
    if (titleElem) titleElem.innerText = this.flashCardData.card_title;
    if (descElem) descElem.innerText = this.flashCardData.card_description;

    Object.assign(this.flashcardElement.style, {
      color: this.flashCardData.card_text_color,
      backgroundColor: this.flashCardData.card_background_color,
    });

    this.changes = {};
  }

  createNoteAPI() {
    const payload = {
      title: this.changes.card_title || this.flashCardData.card_title,
      description: this.changes.card_description || this.flashCardData.card_description,
      position_x: this.flashCardData.card_postion_x,
      position_y: this.flashCardData.card_postion_y,
      width: this.flashCardData.card_width,
      height: this.flashCardData.card_height,
      text_color: this.changes.card_text_color || this.flashCardData.card_text_color,
      background_color: this.changes.card_background_color || this.flashCardData.card_background_color,
    };

    fetch("/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(response => response.json())
      .then(data => {
        if (data.id) {
          this.flashCardData.id = data.id;
          this.flashcardElement.id = `flashcard-${data.id}`;
          this.updateDOM();
        }
      })
      .catch(error => console.error("Erro ao criar nota:", error));
  }

  updateNoteAPI() {
    if (!this.flashCardData.id) return;

    const payload = {
      title: this.changes.card_title || this.flashCardData.card_title,
      description: this.changes.card_description || this.flashCardData.card_description,
      position_x: this.flashCardData.card_postion_x,
      position_y: this.flashCardData.card_postion_y,
      width: this.flashCardData.card_width,
      height: this.flashCardData.card_height,
      text_color: this.changes.card_text_color || this.flashCardData.card_text_color,
      background_color: this.changes.card_background_color || this.flashCardData.card_background_color,
    };

    fetch(`/note/${this.flashCardData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(response => response.json())
      .then(data => {
        console.log("Nota atualizada:", data);
        this.updateDOM();
      })
      .catch(error => console.error("Erro ao atualizar nota:", error));
  }

  deleteCard() {
    if (!this.flashCardData.id) return;
    fetch(`/note/${this.flashCardData.id}`, { method: "DELETE" })
      .then(response => response.json())
      .then(data => {
        console.log("Nota removida:", data);
        this.flashcardElement.remove();
      })
      .catch(error => console.error("Erro ao deletar nota:", error));
  }

  updateNotePositionAPI() {
    if (!this.flashCardData.id) return;
    const payload = {
      position_x: this.flashCardData.card_postion_x,
      position_y: this.flashCardData.card_postion_y,
    };
    fetch(`/note/${this.flashCardData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(response => response.json())
      .then(data => console.log("Posição da nota atualizada:", data))
      .catch(error => console.error("Erro ao atualizar posição da nota:", error));
  }
}
