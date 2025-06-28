import { io } from "socket.io-client";
import { startLoading, stopLoading, getIsLoading } from "@/viewer/loading";
import {
  handleReceiveOffer,
  handleReceiveRemoteCandidate,
  sendIceCandidate,
  assertPeerConnection,
} from "@/shared/signaling";

// Variables
let peerConnection: RTCPeerConnection | null = null;

const videoElement = document.getElementById("video") as HTMLVideoElement;
const videoWrapperElement = document.getElementById("videoWrapper");
const startButton = document.getElementById("startButton") as HTMLButtonElement;
const stopButton = document.getElementById("stopButton") as HTMLButtonElement;
const errorElement = document.getElementById("errorMessage");

const socket = io(import.meta.env.VITE_SERVER_URL, {
  autoConnect: false,
});

// Initialization
if (
  !videoElement ||
  !videoWrapperElement ||
  !startButton ||
  !stopButton ||
  !errorElement
) {
  throw new Error("Required elements not found in the DOM");
}
initializeButtons();

// Event listeners
startButton.addEventListener("click", () => {
  handleStartButtonClick();
});

stopButton.addEventListener("click", () => {
  handleStopButtonClick();
});

// WebSocket event listeners
socket.on("connect", () => {
  console.log("Connected to WebSocket server. Socket.id:", socket.id);
});

socket.on("disconnect", () => {
  if (startButton.disabled) {
    initializeButtons();
  }

  console.log("Disconnected from WebSocket server");
});

socket.on("connect_error", (error: Error) => {
  console.log("Connection error: ", error);
});

socket.on("offer", async (offer: RTCSessionDescription) => {
  await handleReceiveOffer({ peerConnection, offer, socket });
});

socket.on("iceCandidate", (iceCandidate: RTCIceCandidate) => {
  handleReceiveRemoteCandidate({ peerConnection, iceCandidate });
});

socket.on("abort", (errorMessage) => {
  handleAbort(errorMessage);
});

// Functions
function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;
  hideErrorMessage();

  startLoading(videoWrapperElement as HTMLElement);

  initPeerConnection();
  requestToStartSignaling();
}

function handleStopButtonClick() {
  if (getIsLoading()) stopLoading();
  stopWebRTC();
  initializeButtons();
}

function initializeButtons() {
  startButton.disabled = false;
  stopButton.disabled = true;
}

function initPeerConnection() {
  if (peerConnection) return;

  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  peerConnection.ontrack = (event) => {
    stopLoading();
    videoElement.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (!event.candidate) return;
    sendIceCandidate({ iceCandidate: event.candidate, socket });
  };
}

function requestToStartSignaling() {
  socket.connect();
  socket.emit("requestToStartSignaling");
  console.log("Requested to start signaling");
}

function handleAbort(errorMessage: string) {
  stopLoading();
  displayErrorMessage(errorMessage);
  console.log("Abort");
}

function stopWebRTC() {
  assertPeerConnection(peerConnection);

  peerConnection.close();
  peerConnection = null;
  videoElement.srcObject = null;
  socket.emit("close");
  console.log("Peer connection closed");
}

function displayErrorMessage(message: string) {
  errorElement!.classList.remove("hidden");
  errorElement!.textContent = message;
}

function hideErrorMessage() {
  if (!errorElement?.textContent) return;

  errorElement!.classList.add("hidden");
  errorElement!.textContent = "";
}
