async function sendOffer(params: {
  peerConnection: RTCPeerConnection | null;
  sendToServer: (offer: RTCSessionDescriptionInit) => void;
}) {
  const { peerConnection, sendToServer } = params;
  assertPeerConnection(peerConnection);

  peerConnection.addTransceiver("video", { direction: "recvonly" });
  peerConnection.addTransceiver("audio", { direction: "recvonly" });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  sendToServer(offer);
  console.log("Sent offer: ", offer);
}

async function handleReceiveOffer(params: {
  peerConnection: RTCPeerConnection | null;
  offer: RTCSessionDescriptionInit;
  sendToServer: (offer: RTCSessionDescriptionInit) => void;
}) {
  const { peerConnection, offer, sendToServer } = params;
  assertPeerConnection(peerConnection);

  console.log("Received offer: ", offer);
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  sendToServer(answer);
  console.log("Sent answer: ", answer);
}

async function handleReceiveAnswer(params: {
  peerConnection: RTCPeerConnection | null;
  answer: RTCSessionDescriptionInit;
}) {
  const { peerConnection, answer } = params;
  assertPeerConnection(peerConnection);
  console.log("Received answer: ", answer);
  await peerConnection.setRemoteDescription(answer);
}

function sendIceCandidate(params: {
  iceCandidate: RTCIceCandidate;
  sendToServer: (iceCandidate: RTCIceCandidate) => void;
}) {
  const { iceCandidate, sendToServer } = params;
  sendToServer(iceCandidate);
  console.log("Sent ICE candidate: ", iceCandidate);
}

async function handleReceiveRemoteCandidate(params: {
  peerConnection: RTCPeerConnection | null;
  iceCandidate: RTCIceCandidate;
}) {
  const { peerConnection, iceCandidate } = params;
  assertPeerConnection(peerConnection);

  console.log("Received ICE candidate: ", iceCandidate);
  await peerConnection.addIceCandidate(iceCandidate);
}

function assertPeerConnection(
  peerConnection?: RTCPeerConnection | null,
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
