import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

let peerConnection;
let stream;

const socket = io();

socket.on("requestToStartSignaling", async () => {
  console.log("Viewer wants to start signaling");
  await initPeerConnection();
  notifySignalingReady();
});

socket.on("offer", async (offer) => {
  await handleReceiveOffer(offer);
});

socket.on("iceCandidate", async (iceCandidate) => {
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
      peerConnection.addTrack(track, stream);
    });
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
}

function notifySignalingReady() {
  socket.emit("signalingReady");
  console.log("Notified signaling ready");
}

async function handleReceiveOffer(offer) {
  if (!peerConnection) {
    throw new Error("Peer connection not initialized");
  }

  console.log("Received offer: ", offer);
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
  console.log("Sent answer: ", answer);
}

async function handleReceiveRemoteCandidate(iceCandidate) {
  if (!peerConnection) {
    throw new Error("Peer connection not initialized");
  }

  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}

function sendIceCandidate(iceCandidate) {
  socket.emit("iceCandidate", iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}
