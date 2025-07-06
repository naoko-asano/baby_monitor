import {
  Connection,
  SignalingServer,
  TransportServer,
  TransportConnection,
} from "./types.js";
import { isBroadcasterPresent, disconnectIfNoBroadcaster } from "./utils.js";

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

  connection.on("requestToStartSignaling", async () => {
    if (await disconnectIfNoBroadcaster({ signalingServer, connection }))
      return;
    connection.join("viewer");
    connection.to("broadcaster").emit("requestToStartSignaling");
  });

  connection.on("offer", async (offer) => {
    connection.to("viewer").emit("offer", offer);
  });

  connection.on("answer", async (answer) => {
    if (await disconnectIfNoBroadcaster({ signalingServer, connection }))
      return;
    connection.to("broadcaster").emit("answer", answer);
  });

  connection.on("iceCandidate", async (iceCandidate) => {
    if (await disconnectIfNoBroadcaster({ signalingServer, connection }))
      return;

    if (connection.rooms.has("viewer")) {
      connection.to("broadcaster").emit("iceCandidate", iceCandidate);
    } else if (connection.rooms.has("broadcaster")) {
      connection.to("viewer").emit("iceCandidate", iceCandidate);
    }
  });

  connection.on("close", () => {
    connection.to("broadcaster").emit("close");
    connection.disconnect();
  });

  connection.on("disconnect", () => {
    console.log("Websocket disconnected. connection.id:", connection.id);
  });
}
