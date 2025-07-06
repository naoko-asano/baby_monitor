import {
  Connection,
  SignalingServer,
  TransportServer,
  TransportConnection,
} from "./types.js";

export function convertToSignalingServer(
  transportServer: TransportServer,
): SignalingServer {
  return {
    on: (
      event: string,
      handler: (...args: any[]) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
    ) => transportServer.on(event, handler),
    in: (room: string) => ({
      fetchConnections: () => transportServer.in(room).fetchSockets(),
    }),
  };
}

export function convertToConnection(socket: TransportConnection): Connection {
  return {
    id: socket.id,
    rooms: socket.rooms,
    join: (room: string) => socket.join(room),
    /* eslint-disable @typescript-eslint/no-explicit-any */
    emit: (event: string, ...args: any[]) => socket.emit(event, ...args),
    on: (event: string, handler: (...args: any[]) => void) =>
      socket.on(event, handler),
    to: (room: string) => {
      return {
        emit: (event: string, ...args: any[]) =>
          socket.to(room).emit(event, ...args),
        to: (room1: string) => socket.to(room).to(room1),
      };
    },
    /* eslint-enable @typescript-eslint/no-explicit-any */
    disconnect: () => socket.disconnect(),
  };
}
