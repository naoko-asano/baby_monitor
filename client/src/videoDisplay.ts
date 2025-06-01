import { io } from "socket.io-client";
import { startLoading, stopLoading, getIsLoading } from "@/loading";

let peerConnection: RTCPeerConnection | null = null;

const videoElement = document.getElementById("video") as HTMLVideoElement;
const videoWrapperElement = document.getElementById("videoWrapper");
const startButton = document.getElementById("startButton") as HTMLButtonElement;
const stopButton = document.getElementById("stopButton") as HTMLButtonElement;
const errorElement = document.getElementById("errorMessage");

if (
  !videoElement ||
  !videoWrapperElement ||
  !startButton ||
  !stopButton ||
  !errorElement
) {
  throw new Error("Required elements not found in the DOM");
}
stopButton.disabled = true;

startButton.addEventListener("click", () => {
  handleStartButtonClick();
});

stopButton.addEventListener("click", () => {
  handleStopButtonClick();
});

const socket = io(import.meta.env.VITE_SERVER_URL, {
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("disconnect", () => {
  if (getIsLoading()) stopLoading();
  if (startButton.disabled) {
    startButton.disabled = false;
    stopButton.disabled = true;
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
  startButton.disabled = false;
  stopButton.disabled = true;
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
    if (event.candidate) {
      sendIceCandidate(event.candidate);
    }
  };
}

async function sendOffer() {
  ensurePeerConnectionInitialized();

  peerConnection?.addTransceiver("video", { direction: "recvonly" });
  peerConnection?.addTransceiver("audio", { direction: "recvonly" });

  const offer = await peerConnection?.createOffer();
  await peerConnection?.setLocalDescription(offer);
  socket.emit("offer", offer);
  console.log("Sent offer: ", offer);
}

async function handleReceiveAnswer(answer: RTCSessionDescription) {
  ensurePeerConnectionInitialized();

  console.log("Received answer: ", answer);
  await peerConnection?.setRemoteDescription(answer);
}

async function handleReceiveRemoteCandidate(iceCandidate: RTCIceCandidate) {
  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection?.addIceCandidate(iceCandidate);
}

function sendIceCandidate(iceCandidate: RTCIceCandidate) {
  socket.emit("iceCandidate", iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}

function stopWebRTC() {
  if (!peerConnection) return;

  peerConnection.close();
  peerConnection = null;
  videoElement.srcObject = null;
  socket.emit("close");
  console.log("Peer connection closed");
}

function ensurePeerConnectionInitialized() {
  if (peerConnection) return;
  throw new Error("Peer connection is not initialized");
}
