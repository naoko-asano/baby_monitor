import { Connection, SignalingServer } from "./types.js";

export async function isBroadcasterPresent(params: {
  signalingServer: SignalingServer;
}) {
  const { signalingServer } = params;
  return (
    (await signalingServer.in("broadcaster").fetchConnections()).length > 0
  );
}

export async function disconnectIfNoBroadcaster(params: {
  signalingServer: SignalingServer;
  connection: Connection;
}) {
  const { signalingServer, connection } = params;
  if (await isBroadcasterPresent({ signalingServer })) return false;

  connection.emit("abort", "No broadcaster found. Please try again later.");
  connection.disconnect();
  return true;
}
