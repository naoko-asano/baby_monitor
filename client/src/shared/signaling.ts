import { Socket } from "socket.io-client";

async function sendOffer({
  peerConnection,
  socket,
}: {
  peerConnection: RTCPeerConnection | null;
  socket: Socket;
}) {
  assertPeerConnection(peerConnection);

  peerConnection.addTransceiver("video", { direction: "recvonly" });
  peerConnection.addTransceiver("audio", { direction: "recvonly" });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
  console.log("Sent offer: ", offer);
}

async function handleReceiveOffer({
  peerConnection,
  offer,
  socket,
}: {
  peerConnection: RTCPeerConnection | null;
  offer: RTCSessionDescriptionInit;
  socket: Socket;
}) {
  assertPeerConnection(peerConnection);

  console.log("Received offer: ", offer);
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection?.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
  console.log("Sent answer: ", answer);
}

async function handleReceiveAnswer({
  peerConnection,
  answer,
}: {
  peerConnection: RTCPeerConnection | null;
  answer: RTCSessionDescription;
}) {
  assertPeerConnection(peerConnection);

  console.log("Received answer: ", answer);
  await peerConnection.setRemoteDescription(answer);
}

function sendIceCandidate({
  iceCandidate,
  socket,
}: {
  iceCandidate: RTCIceCandidate;
  socket: Socket;
}) {
  socket.emit("iceCandidate", iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}

async function handleReceiveRemoteCandidate({
  peerConnection,
  iceCandidate,
}: {
  peerConnection: RTCPeerConnection | null;
  iceCandidate: RTCIceCandidate;
}) {
  assertPeerConnection(peerConnection);

  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}

function assertPeerConnection(
  peerConnection: RTCPeerConnection | null,
): asserts peerConnection is RTCPeerConnection {
  if (peerConnection) return;
  throw new Error("Peer connection is not initialized");
}

export {
  sendOffer,
  handleReceiveOffer,
  handleReceiveAnswer,
  sendIceCandidate,
  handleReceiveRemoteCandidate,
  assertPeerConnection,
};
