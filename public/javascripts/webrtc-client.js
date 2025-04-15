import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

const socket = io({
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server");
});

socket.on("message", (message) => {
  console.log("Message received: ", message);
});

socket.on("connect_error", (error) => {
  console.log("Connection error: ", error);
});

function init() {
  stopButton.disabled = true;

  startButton.addEventListener("click", () => {
    handleStartButtonClick();
  });

  stopButton.addEventListener("click", () => {
    handleStopButtonClick();
  });
}

function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;

  socket.connect();
  socket.send("Hello from the client!");
}

function handleStopButtonClick() {
  startButton.disabled = false;
  stopButton.disabled = true;

  socket.disconnect();
}

init();
