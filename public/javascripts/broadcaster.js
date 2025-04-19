import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();

socket.on("offer", (offer) => {
  handleReceiveOffer(offer);
});

socket.on("iceCandidate", (iceCandidate) => {
  handleReceiveRemoteCandidate(iceCandidate);
});

let peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
});

try {
  const stream = await navigator.mediaDevices.getUserMedia({
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
