import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const videoElement = document.getElementById("videoElement");
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
  receiveAnswer(answer);
});

socket.on("iceCandidate", (iceCandidate) => {
  receiveIceCandidate(iceCandidate);
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
    socket.emit("iceCandidate", event.candidate);
  }
};

async function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;

  socket.connect();
  await sendOffer();
}

function handleStopButtonClick() {
  startButton.disabled = false;
  stopButton.disabled = true;

  socket.disconnect();
}

async function sendOffer() {
  const offer = await peerConnection.createOffer();
  peerConnection.setLocalDescription(offer);
  console.log("Sending offer: ", offer);
  socket.emit("offer", offer);
}

async function receiveAnswer(answer) {
  console.log("Received answer: ", answer);
  await peerConnection.setRemoteDescription(answer);
}

async function receiveIceCandidate(iceCandidate) {
  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}
