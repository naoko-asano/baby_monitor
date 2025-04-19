import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();

socket.on("offer", (offer) => {
  handleReceiveOffer(offer);
});

socket.on("iceCandidate", (iceCandidate) => {
  handleReceiveRemoteCandidate(iceCandidate);
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

let peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
});
let stream;

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

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    sendIceCandidate(event.candidate);
  }
};

async function handleReceiveOffer(offer) {
  console.log("Received offer: ", offer);
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
  console.log("Sent answer: ", answer);
}

async function handleReceiveRemoteCandidate(iceCandidate) {
  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}

function sendIceCandidate(iceCandidate) {
  socket.emit("iceCandidate", iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}
