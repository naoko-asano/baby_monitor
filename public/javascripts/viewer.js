import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const videoElement = document.getElementById("video");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
stopButton.disabled = true;

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

socket.on("answer", (answer) => {
  handleReceiveAnswer(answer);
});

socket.on("iceCandidate", (iceCandidate) => {
  handleReceiveRemoteCandidate(iceCandidate);
});

let peerConnection = new RTCPeerConnection({
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

function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;

  socket.connect();
  sendOffer();
}

function handleStopButtonClick() {
  startButton.disabled = false;
  stopButton.disabled = true;
  stopWebRTC();
}

async function sendOffer() {
  peerConnection.addTransceiver("video", { direction: "recvonly" });
  peerConnection.addTransceiver("audio", { direction: "recvonly" });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
  console.log("Sent offer: ", offer);
}

async function handleReceiveAnswer(answer) {
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
