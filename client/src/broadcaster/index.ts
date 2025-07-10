import { createMessagingClient } from "@/shared/messagingClient";
import {
  sendOffer,
  handleReceiveAnswer,
  sendIceCandidate,
  handleReceiveRemoteCandidate,
  assertPeerConnection,
} from "@/shared/signaling";

const peerConnections = new Map<string, RTCPeerConnection | null>();
let stream: MediaStream | null = null;

const messagingClient = createMessagingClient();

messagingClient.emit("registerAsBroadcaster");

messagingClient.on("connect", () => {
  console.log(
    "Connected to WebSocket server. messagingClient.id:",
    messagingClient.id,
  );
});

messagingClient.on(
  "requestToStartSignaling",
  async (params: { viewerId: string }) => {
    const { viewerId } = params;
    console.log(`Viewer ${viewerId} wants to start signaling`);
    const peerConnection = await initPeerConnection(viewerId);

    sendOffer({
      peerConnection,
      sendToServer: (offer) =>
        messagingClient.emit("offer", { viewerId, offer }),
    });
  },
);

messagingClient.on(
  "answer",
  (params: { viewerId: string; answer: RTCSessionDescriptionInit }) => {
    const { viewerId, answer } = params;
    const peerConnection = findPeerConnection(viewerId);
    handleReceiveAnswer({ peerConnection, answer });
  },
);

messagingClient.on(
  "iceCandidate",
  async (params: { viewerId: string; iceCandidate: RTCIceCandidate }) => {
    const { viewerId, iceCandidate } = params;
    const peerConnection = findPeerConnection(viewerId);
    await handleReceiveRemoteCandidate({ peerConnection, iceCandidate });
  },
);

messagingClient.on("close", (params: { viewerId: string }) => {
  const { viewerId } = params;
  const peerConnection = findPeerConnection(viewerId);

  peerConnection.close();
  peerConnections.delete(viewerId);

  if (!stream || peerConnections.size > 0) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
  stream = null;

  console.log("Stop broadcasting");
});

async function initPeerConnection(viewerId: string) {
  const peerConnection = new RTCPeerConnection({
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
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
    }
    stream.getTracks().forEach((track) => {
      if (!stream) return;
      peerConnection.addTrack(track.clone(), stream);
    });
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }

  peerConnections.set(viewerId, peerConnection);
  return peerConnection;
}

export function findPeerConnection(viewerId: string): RTCPeerConnection {
  const peerConnection = peerConnections.get(viewerId);
  assertPeerConnection(peerConnection);
  return peerConnection;
}
