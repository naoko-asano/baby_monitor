import { startLoading, stopLoading, getIsLoading } from "@/viewer/loading";
import {
  handleReceiveOffer,
  handleReceiveRemoteCandidate,
  sendIceCandidate,
  assertPeerConnection,
} from "@/shared/signaling";
import { createMessagingClient } from "@/shared/messagingClient";

// Variables
let peerConnection: RTCPeerConnection | null = null;

const videoElement = document.getElementById("video") as HTMLVideoElement;
const videoWrapperElement = document.getElementById("videoWrapper");
const startButton = document.getElementById("startButton") as HTMLButtonElement;
const stopButton = document.getElementById("stopButton") as HTMLButtonElement;
const errorElement = document.getElementById("errorMessage");

const signalingClient = createMessagingClient({
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
signalingClient.on("connect", () => {
  console.log(
    "Connected to WebSocket server. SignalingClient.id:",
    signalingClient.id,
  );
});

signalingClient.on("disconnect", () => {
  if (startButton.disabled) {
    initializeButtons();
  }

  console.log("Disconnected from WebSocket server");
});

signalingClient.on("connect_error", (error: Error) => {
  console.log("Connection error: ", error);
});

signalingClient.on("offer", async (offer: RTCSessionDescription) => {
  await handleReceiveOffer({
    peerConnection,
    offer,
    sendToServer: (answer) => signalingClient.emit("answer", answer),
  });
});

signalingClient.on("iceCandidate", (iceCandidate: RTCIceCandidate) => {
  handleReceiveRemoteCandidate({ peerConnection, iceCandidate });
});

signalingClient.on("abort", (errorMessage) => {
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
    sendIceCandidate({
      iceCandidate: event.candidate,
      sendToServer: (iceCandidate) =>
        signalingClient.emit("iceCandidate", iceCandidate),
    });
  };
}

function requestToStartSignaling() {
  signalingClient.connect();
  signalingClient.emit("requestToStartSignaling");
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
  signalingClient.emit("close");
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
