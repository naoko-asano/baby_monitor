import { io } from "socket.io-client";

let peerConnection: RTCPeerConnection | null = null;
let stream: MediaStream | null = null;

const socket = io(import.meta.env.VITE_SERVER_URL);

socket.on("requestToStartSignaling", async () => {
  console.log("Viewer wants to start signaling");
  await initPeerConnection();
  notifySignalingReady();
});

socket.on("offer", async (offer: RTCSessionDescription) => {
  await handleReceiveOffer(offer);
});

socket.on("iceCandidate", async (iceCandidate: RTCIceCandidate) => {
  await handleReceiveRemoteCandidate(iceCandidate);
});

socket.on("close", () => {
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
    if (event.candidate) {
      sendIceCandidate(event.candidate);
    }
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
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

function notifySignalingReady() {
  socket.emit("signalingReady");
  console.log("Notified signaling ready");
}

async function handleReceiveOffer(offer: RTCSessionDescription) {
  ensurePeerConnectionInitialized();

  console.log("Received offer: ", offer);
  await peerConnection?.setRemoteDescription(offer);

  const answer = await peerConnection?.createAnswer();
  await peerConnection?.setLocalDescription(answer);
  socket.emit("answer", answer);
  console.log("Sent answer: ", answer);
}

async function handleReceiveRemoteCandidate(iceCandidate: RTCIceCandidate) {
  ensurePeerConnectionInitialized();

  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection?.addIceCandidate(iceCandidate);
}

function sendIceCandidate(iceCandidate: RTCIceCandidate) {
  socket.emit("iceCandidate", iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}

function ensurePeerConnectionInitialized() {
  if (peerConnection) return;
  throw new Error("Peer connection is not initialized");
}
