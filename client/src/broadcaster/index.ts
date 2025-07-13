import { createMessagingClient } from "@/shared/messagingClient";
import {
  sendOffer,
  handleReceiveAnswer,
  sendIceCandidate,
  handleReceiveRemoteCandidate,
} from "@/shared/signaling";

interface Viewers {
  peerConnection: RTCPeerConnection;
  tracks: MediaStreamTrack[];
}

const viewers = new Map<string, Viewers>();
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
  const viewer = viewers.get(viewerId);
  const peerConnection = findPeerConnection(viewerId);
  peerConnection.close();

  viewer?.tracks.forEach((track) => {
    track.stop();
  });
  viewers.delete(viewerId);

  if (!stream || viewers.size > 0) return;
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
    const tracks = stream.getTracks().map((originalTrack) => {
      const track = originalTrack.clone();
      assertStream(stream);
      peerConnection.addTrack(track, stream);
      return track;
    });

    viewers.set(viewerId, {
      peerConnection,
      tracks,
    });
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
  return peerConnection;
}

export function findPeerConnection(viewerId: string): RTCPeerConnection {
  const viewer = viewers.get(viewerId);
  if (!viewer) {
    throw new Error(`No peer connection found for viewer ID: ${viewerId}`);
  }
  return viewer.peerConnection;
}

function assertStream(
  stream: MediaStream | null,
): asserts stream is MediaStream {
  if (stream) return;
  throw new Error("Stream is not initialized");
}
