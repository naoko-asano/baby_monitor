import { createMessagingClient } from "@/shared/messagingClient";
import {
  sendOffer,
  handleReceiveAnswer,
  sendIceCandidate,
  handleReceiveRemoteCandidate,
} from "@/shared/signaling";

let peerConnection: RTCPeerConnection | null = null;
let stream: MediaStream | null = null;

const messagingClient = createMessagingClient();
messagingClient.emit("registerAsBroadcaster");

messagingClient.on("connect", () => {
  console.log(
    "Connected to WebSocket server. messagingClient.id:",
    messagingClient.id,
  );
});

messagingClient.on("requestToStartSignaling", async () => {
  console.log("Viewer wants to start signaling");
  await initPeerConnection();
  sendOffer({
    peerConnection,
    sendToServer: (offer) => messagingClient.emit("offer", offer),
  });
});

messagingClient.on("answer", (answer: RTCSessionDescription) => {
  handleReceiveAnswer({ peerConnection, answer });
});

messagingClient.on("iceCandidate", async (iceCandidate: RTCIceCandidate) => {
  await handleReceiveRemoteCandidate({ peerConnection, iceCandidate });
});

messagingClient.on("close", () => {
  if (!peerConnection) return;

  peerConnection.close();
  peerConnection = null;

  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
  stream = null;

  console.log("Peer connection closed");
});

async function initPeerConnection() {
  if (peerConnection) return;

  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  peerConnection.onicecandidate = (event) => {
    if (!event.candidate) return;
    sendIceCandidate({
      iceCandidate: event.candidate,
      sendToServer: (iceCandidate) =>
        messagingClient.emit("iceCandidate", iceCandidate),
    });
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: true,
    });
    stream.getTracks().forEach((track) => {
      if (!stream) return;
      peerConnection?.addTrack(track, stream);
    });
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
}
