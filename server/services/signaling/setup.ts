import { handleConnection } from "./connectionHandler.js";
import {
  Connection,
  SignalingServer,
  TransportServer,
  TransportConnection,
} from "./types.js";

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
