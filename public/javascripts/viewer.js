import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const videoElement = document.getElementById("video");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
stopButton.disabled = true;
let peerConnection;

startButton.addEventListener("click", () => {
  handleStartButtonClick();
});

stopButton.addEventListener("click", () => {
  handleStopButtonClick();
});

const socket = io({
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server");
});

socket.on("connect_error", (error) => {
  console.log("Connection error: ", error);
});

socket.on("signalingReady", () => {
  sendOffer();
});

socket.on("answer", (answer) => {
  handleReceiveAnswer(answer);
});

socket.on("iceCandidate", (iceCandidate) => {
  handleReceiveRemoteCandidate(iceCandidate);
});

function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;

  initPeerConnection();
  requestToStartSignaling();
}

function handleStopButtonClick() {
  startButton.disabled = false;
  stopButton.disabled = true;
  stopWebRTC();
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
    videoElement.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendIceCandidate(event.candidate);
    }
  };
}

async function sendOffer() {
  if (!peerConnection) {
    throw new Error("Peer connection not initialized");
  }

  peerConnection.addTransceiver("video", { direction: "recvonly" });
  peerConnection.addTransceiver("audio", { direction: "recvonly" });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
  console.log("Sent offer: ", offer);
}

async function handleReceiveAnswer(answer) {
  if (!peerConnection) {
    throw new Error("Peer connection not initialized");
  }
  console.log("Received answer: ", answer);
  await peerConnection.setRemoteDescription(answer);
}

async function handleReceiveRemoteCandidate(iceCandidate) {
  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}

function sendIceCandidate(iceCandidate) {
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
