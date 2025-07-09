import {
  Connection,
  SignalingServer,
  TransportServer,
  TransportConnection,
} from "./types.js";
import {
  isBroadcasterPresent,
  disconnectIfNoBroadcaster,
  isFromBroadcaster,
} from "./utils.js";

export function setupSignalingServer(params: {
  transportServer: TransportServer;
  convertToSignalingServer: (socketServer: TransportServer) => SignalingServer;
  convertToConnection: (socket: TransportConnection) => Connection;
}) {
  const { transportServer, convertToSignalingServer, convertToConnection } =
    params;

  const signalingServer = convertToSignalingServer(transportServer);
  signalingServer.on("connection", (socket: TransportConnection) => {
    console.log("Websocket connected. socket id:", socket.id);

    const connection = convertToConnection(socket);
    handleConnection(connection, signalingServer);
  });

  return signalingServer;
}

function handleConnection(
  connection: Connection,
  signalingServer: SignalingServer,
) {
  connection.on("registerAsBroadcaster", async () => {
    if (await isBroadcasterPresent({ signalingServer })) return;
    connection.join("broadcaster");
  });

  connection.on("requestToStartSignaling", async ({ viewerId }) => {
    if (await disconnectIfNoBroadcaster({ signalingServer, connection }))
      return;
    connection.to("broadcaster").emit("requestToStartSignaling", { viewerId });
  });

  connection.on("offer", async ({ viewerId, offer }) => {
    connection.to(viewerId).emit("offer", { offer });
  });

  connection.on("answer", async ({ viewerId, answer }) => {
    if (await disconnectIfNoBroadcaster({ signalingServer, connection }))
      return;
    connection.to("broadcaster").emit("answer", { viewerId, answer });
  });

  connection.on("iceCandidate", async ({ viewerId, iceCandidate }) => {
    if (await disconnectIfNoBroadcaster({ signalingServer, connection }))
      return;

    if (isFromBroadcaster({ connection })) {
      connection.to(viewerId).emit("iceCandidate", { iceCandidate });
    } else {
      connection
        .to("broadcaster")
        .emit("iceCandidate", { viewerId, iceCandidate });
    }
  });

  connection.on("close", ({ viewerId }) => {
    connection.to("broadcaster").emit("close", { viewerId });
    connection.disconnect();
  });

  connection.on("disconnect", () => {
    console.log("Websocket disconnected. connection.id:", connection.id);
  });
}
