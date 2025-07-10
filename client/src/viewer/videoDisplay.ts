import { createMessagingClient } from "@/shared/messagingClient";
import {
  handleReceiveOffer,
  handleReceiveRemoteCandidate,
  sendIceCandidate,
  assertPeerConnection,
} from "@/shared/signaling";
import { startLoading, stopLoading, getIsLoading } from "@/viewer/loading";

// Variables
let peerConnection: RTCPeerConnection | null = null;

const videoElement = document.getElementById("video") as HTMLVideoElement;
const videoWrapperElement = document.getElementById("videoWrapper");
const startButton = document.getElementById("startButton") as HTMLButtonElement;
const stopButton = document.getElementById("stopButton") as HTMLButtonElement;
const errorElement = document.getElementById("errorMessage");

const messagingClient = createMessagingClient({
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
messagingClient.on("connect", () => {
  requestToStartSignaling();
});

messagingClient.on("disconnect", () => {
  if (startButton.disabled) {
    initializeButtons();
  }

  console.log("Disconnected from WebSocket server");
});

messagingClient.on("connect_error", (error: Error) => {
  console.log("Connection error: ", error);
});

messagingClient.on(
  "offer",
  async (params: { offer: RTCSessionDescription }) => {
    const { offer } = params;
    await handleReceiveOffer({
      peerConnection,
      offer,
      sendToServer: (answer) =>
        messagingClient.emit("answer", {
          viewerId: viewerId(),
          answer,
        }),
    });
  },
);

messagingClient.on("iceCandidate", (iceCandidate: RTCIceCandidate) => {
  handleReceiveRemoteCandidate({ peerConnection, iceCandidate });
});

messagingClient.on("abort", (errorMessage) => {
  handleAbort(errorMessage);
});

// Functions
function handleStartButtonClick() {
  startButton.disabled = true;
  stopButton.disabled = false;
  hideErrorMessage();

  startLoading(videoWrapperElement as HTMLElement);

  initPeerConnection();
  messagingClient.connect();
}

function handleStopButtonClick() {
  if (getIsLoading()) stopLoading();
  stopViewing();
  initializeButtons();
}

function initializeButtons() {
  startButton.disabled = false;
  stopButton.disabled = true;
}

function viewerId() {
  return messagingClient.id || "";
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
        messagingClient.emit("iceCandidate", {
          viewerId: viewerId(),
          iceCandidate,
        }),
    });
  };
}

function requestToStartSignaling() {
  messagingClient.emit("requestToStartSignaling", {
    viewerId: viewerId(),
  });
  console.log("Requested to start signaling. Viewer ID:", viewerId());
}

function handleAbort(errorMessage: string) {
  stopLoading();
  displayErrorMessage(errorMessage);
  console.log("Abort");
}

function stopViewing() {
  assertPeerConnection(peerConnection);

  peerConnection.close();
  peerConnection = null;
  videoElement.srcObject = null;
  messagingClient.emit("close", { viewerId: viewerId() });
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
