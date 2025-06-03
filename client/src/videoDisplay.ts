import { io } from "socket.io-client";
import { startLoading, stopLoading, getIsLoading } from "@/loading";

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
  console.log("Connected to WebSocket server");
});

socket.on("disconnect", () => {
  if (getIsLoading()) stopLoading();
  if (startButton.disabled) {
    initializeButtons();
  }

  console.log("Disconnected from WebSocket server");
});

socket.on("connect_error", (error: Error) => {
  console.log("Connection error: ", error);
});

socket.on("signalingReady", () => {
  sendOffer();
});

socket.on("answer", (answer: RTCSessionDescription) => {
  handleReceiveAnswer(answer);
});

socket.on("iceCandidate", (iceCandidate: RTCIceCandidate) => {
  handleReceiveRemoteCandidate(iceCandidate);
});

socket.on("abort", (errorMessage) => {
  console.log("abort");
  errorElement.textContent = errorMessage;
});

// Functions
function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;

  if (errorElement?.textContent) {
    errorElement.textContent = "";
  }

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

function ensurePeerConnectionInitialized(
  peerConnection: RTCPeerConnection | null,
): asserts peerConnection is RTCPeerConnection {
  if (peerConnection) return;
  throw new Error("Peer connection is not initialized");
}

function requestToStartSignaling() {
  socket.connect();
  socket.emit("requestToStartSignaling");
  console.log("Requested to start signaling");
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
    sendIceCandidate(event.candidate);
  };
}

async function sendOffer() {
  ensurePeerConnectionInitialized(peerConnection);

  peerConnection.addTransceiver("video", { direction: "recvonly" });
  peerConnection.addTransceiver("audio", { direction: "recvonly" });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
  console.log("Sent offer: ", offer);
}

async function handleReceiveAnswer(answer: RTCSessionDescription) {
  ensurePeerConnectionInitialized(peerConnection);

  console.log("Received answer: ", answer);
  await peerConnection?.setRemoteDescription(answer);
}

async function handleReceiveRemoteCandidate(iceCandidate: RTCIceCandidate) {
  ensurePeerConnectionInitialized(peerConnection);

  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}

function sendIceCandidate(iceCandidate: RTCIceCandidate) {
  socket.emit("iceCandidate", iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}

function stopWebRTC() {
  ensurePeerConnectionInitialized(peerConnection);

  peerConnection.close();
  peerConnection = null;
  videoElement.srcObject = null;
  socket.emit("close");
  console.log("Peer connection closed");
}
