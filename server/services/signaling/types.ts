import { Server as SocketIoServer, Socket } from "socket.io";

export type TransportServer = SocketIoServer;
export type TransportConnection = Socket;

export interface SignalingServer {
  on(event: string, handler: (...args: any[]) => void): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  in(room: string): {
    fetchConnections(): Promise<fetchedConnection[]>;
  };
}

type fetchedConnection = Pick<Connection, "id">;

export interface Connection {
  id: string;
  rooms: Set<string>;
  join(room: string): void;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  on(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  to(room: string): BroadcastOperator;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  disconnect(): void;
}

interface BroadcastOperator {
  emit(event: string, ...args: any[]): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  to(room: string): BroadcastOperator;
}
