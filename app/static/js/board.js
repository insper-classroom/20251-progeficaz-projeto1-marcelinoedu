import { Flashcard } from "./flashcard.js";

export class Board {
  constructor() {
    this.board = document.getElementById("board");
    this.canvas = document.getElementById("gridCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.minScale = 0.25;
    this.maxScale = 2;
    this.boardWidth = 10000;
    this.boardHeight = 10000;
    this.flashcards = [];
    this.currentFlashcard = null;
  }

  init() {
    this.centerBoard();
    this.resizeCanvas();
    this.attachEventListeners();
    this.loadFlashcards();
    this.setupModal();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  _getEl(id) {
    return document.getElementById(id);
  }

  setupModal() {
    this.modal = this._getEl("flashcardModal");
    this.modalCard = this._getEl("modalCard");
    this.modalTitle = this._getEl("modalTitle");
    this.modalDescription = this._getEl("modalDescription");
    this.modalCardId = this._getEl("cardId");
    this.colorsControl = this._getEl("collorsControl");

    this.colorsControl.innerHTML = "";
    this.getAvailableColors().forEach((color) => {
      const colorElement = document.createElement("span");
      colorElement.style.backgroundColor = color;
      colorElement.classList.add("colorPicker");
      colorElement.addEventListener("click", () => {
        if (this.currentFlashcard) {
          this.currentFlashcard.changes.card_background_color = color;
          this.currentFlashcard.changes.card_text_color = this.getContrast(color);
          this.modalCard.style.backgroundColor = color;
          this.modalCard.style.color = this.getContrast(color);
        }
      });
      this.colorsControl.appendChild(colorElement);
    });

    this.modalSaveBtn = this._getEl("saveCardBtn");
    this.modalDeleteBtn = this._getEl("deleteCardBtn");

    this.modalSaveBtn.addEventListener("click", () => {
      if (this.currentFlashcard) {
        this.currentFlashcard.changes.card_title = this.modalTitle.value;
        this.currentFlashcard.changes.card_description = this.modalDescription.value;
        this.currentFlashcard.saveCard();
        this.hideModal();
      }
    });

    this.modalDeleteBtn.addEventListener("click", () => {
      if (this.currentFlashcard) {
        this.currentFlashcard.deleteCard();
        if (!this.currentFlashcard.flashCardData.id) {
          this.board.removeChild(this.currentFlashcard.flashcardElement);
        }
        this.hideModal();
      }
    });
  }

  showModal(flashcard) {
    this.currentFlashcard = flashcard;
    this.modalTitle.value = flashcard.flashCardData.card_title;
    this.modalDescription.value = flashcard.flashCardData.card_description;
    this.modalCard.style.backgroundColor = flashcard.flashCardData.card_background_color;
    this.modalCard.style.color = flashcard.flashCardData.card_text_color;
    this.modalCardId.value = flashcard.flashCardData.id || "";
    this.modal.style.display = "flex";
  }

  hideModal() {
    this.modal.style.display = "none";
    this.currentFlashcard = null;
  }

  getAvailableColors() {
    return [
      "#FF4B5C", "#FFD56B", "#AFFC41", "#1EA896", "#83E377",
      "#BEE3DB", "#FFB5E8", "#A389F4", "#FF9B71", "#F4FCD9",
      "#5b76fe",
    ];
  }

  getContrast(hexcolor) {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  }

  centerBoard() {
    this.translateX = (window.innerWidth - this.boardWidth) / 2;
    this.translateY = (window.innerHeight - this.boardHeight) / 2;
    this.updateTransform();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  updateTransform() {
    const minTranslateX = window.innerWidth - this.boardWidth * this.scale;
    const minTranslateY = window.innerHeight - this.boardHeight * this.scale;
    this.translateX = Math.min(Math.max(this.translateX, minTranslateX), 0);
    this.translateY = Math.min(Math.max(this.translateY, minTranslateY), 0);
    this.board.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;

    const zoomLevelElem = this._getEl("zoom-level");
    if (zoomLevelElem) {
      zoomLevelElem.textContent = Math.round(this.scale * 100) + "%";
    }
  }

  attachEventListeners() {
    this.board.addEventListener("mousedown", (e) => this.startPan(e));
    this.board.addEventListener("dblclick", (e) => this.createFlashcard(e));
    document.addEventListener("mousemove", (e) => this.pan(e));
    document.addEventListener("mouseup", () => this.endPan());
    document.addEventListener("wheel", (e) => this.zoom(e));
    document.addEventListener("keydown", (e) => this.keyboardShortcuts(e));
    this.attachButtonEvents();
  }

  attachButtonEvents() {
    const zoomInButton = this._getEl("zoom-in-btn");
    const zoomOutButton = this._getEl("zoom-out-btn");
    const createNoteButton = this._getEl("create-note-btn");

    zoomInButton.addEventListener("click", () => this.changeZoom(1.1));
    zoomOutButton.addEventListener("click", () => this.changeZoom(0.9));
    createNoteButton.addEventListener("click", () => {
      this.createFlashcard({
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
      });
    });
  }

  startPan(e) {
    if (e.target !== this.board) return;
    this.isPanning = true;
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
    this.board.style.cursor = "grabbing";
  }

  pan(e) {
    if (!this.isPanning) return;
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    this.updateTransform();
  }

  endPan() {
    this.isPanning = false;
    this.board.style.cursor = "default";
  }

  zoom(e) {
    e.preventDefault();
    this.changeZoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
  }

  changeZoom(factor, centerX = window.innerWidth / 2, centerY = window.innerHeight / 2) {
    const oldScale = this.scale;
    this.scale = Math.max(this.minScale, Math.min(this.scale * factor, this.maxScale));
    const beforeX = (centerX - this.translateX) / oldScale;
    const beforeY = (centerY - this.translateY) / oldScale;
    const afterX = (centerX - this.translateX) / this.scale;
    const afterY = (centerY - this.translateY) / this.scale;
    this.translateX += (afterX - beforeX) * this.scale;
    this.translateY += (afterY - beforeY) * this.scale;
    this.updateTransform();
  }

  keyboardShortcuts(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      this.createFlashcard({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    } else if ((e.key === "+" || e.key === "=") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.changeZoom(1.1);
    } else if ((e.key === "-" || e.key === "_") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.changeZoom(0.9);
    }
  }

  attachFlashcardClick(flashcard) {
    flashcard.flashcardElement.addEventListener("click", (e) => {
      if (!flashcard.isDragging) this.showModal(flashcard);
    });
  }

  createFlashcard(e) {
    const clientX = (e.clientX - this.translateX) / this.scale;
    const clientY = (e.clientY - this.translateY) / this.scale;
    const cardWidth = 200, cardHeight = 150;
    const flashcard = new Flashcard(
      null,
      clientX - cardWidth / 2,
      clientY - cardHeight / 2,
      "Adicione um título a nota",
      "Descreva do que se trata essa nota",
      cardWidth,
      cardHeight
    );
    flashcard.createElement();
    this.board.appendChild(flashcard.flashcardElement);
    this.flashcards.push(flashcard);
    this.attachFlashcardClick(flashcard);
    this.showModal(flashcard);
  }

  loadFlashcards() {
    fetch("/notes")
      .then((response) => response.json())
      .then((flashcardsData) => {
        flashcardsData.forEach((data) => {
          const flashcard = new Flashcard(
            data.id,
            data.position_x,
            data.position_y,
            data.title,
            data.description,
            data.width,
            data.height,
            data.text_color,
            data.background_color
          );
          flashcard.createElement();
          this.board.appendChild(flashcard.flashcardElement);
          this.flashcards.push(flashcard);
          this.attachFlashcardClick(flashcard);
        });
      })
      .catch((error) => console.error("Erro ao carregar notas:", error));
  }
}
