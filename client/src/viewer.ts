import { io } from "socket.io-client";
import { Spinner } from "spin.js";

const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
async function fetchRoomConditions() {
  if (!temperatureElement || !humidityElement) return;
  try {
    const response = await fetch("http://raspberrypi.local:5000", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { temperature, humidity } = await response.json();

    temperatureElement.textContent = temperature;
    humidityElement.textContent = humidity;
  } catch (error) {
    console.error("Error fetching room conditions:", error);

    temperatureElement.textContent = "N/A";
    humidityElement.textContent = "N/A";
  }
}

fetchRoomConditions();
setInterval(fetchRoomConditions, 1000 * 60);

let peerConnection: RTCPeerConnection | null = null;

const videoElement = document.getElementById("video") as HTMLVideoElement;
const startButton = document.getElementById("startButton") as HTMLButtonElement;
const stopButton = document.getElementById("stopButton") as HTMLButtonElement;
if (!videoElement || !startButton || !stopButton) {
  throw new Error("Required elements not found in the DOM");
}
stopButton.disabled = true;

const spinnerOptions = {
  lines: 12, // The number of lines to draw
  length: 42, // The length of each line
  width: 18, // The line thickness
  radius: 46, // The radius of the inner circle
  scale: 0.15, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: "spinner-line-fade-default", // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: "#ffffff", // CSS color or array of colors
  fadeColor: "transparent", // CSS color or array of colors
  top: "50%", // Top position relative to parent
  left: "50%", // Left position relative to parent
  shadow: "0 0 1px transparent", // Box-shadow for the lines
  zIndex: 2000000000, // The z-index (defaults to 2e9)
  className: "spinner", // The CSS class to assign to the spinner
  position: "absolute", // Element positioning
};
const spinner = new Spinner(spinnerOptions);
const videoWrapperElement = document.getElementById("videoWrapper");

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

function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;

  if (!videoWrapperElement) {
    console.error("Video wrapper element not found");
    return;
  }
  startLoading(videoWrapperElement);

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

function startLoading(element: HTMLElement) {
  spinner.spin(element);
}

function stopLoading() {
  spinner.stop();
}
