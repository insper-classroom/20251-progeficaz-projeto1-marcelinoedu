import { Board } from "./board.js"; 

class App {
  constructor() {
    this.board = new Board();
    this.board.init();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App();
});
