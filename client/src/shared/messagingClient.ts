import { io } from "socket.io-client";

export interface MessagingClient {
  id?: string;
  connected: boolean;
  connect(): void;
  disconnect(): void;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  on(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, payload?: any): void;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export function createMessagingClient(options?: {
  autoConnect?: boolean;
}): MessagingClient {
  const defaultOptions = {
    autoConnect: true,
  };
  const client = io(import.meta.env.VITE_SERVER_URL, {
    autoConnect: options?.autoConnect ?? defaultOptions.autoConnect,
  });
  return {
    id: client.id,
    connected: client.connected,
    connect: client.connect.bind(client),
    disconnect: client.disconnect.bind(client),
    on: client.on.bind(client),
    emit: client.emit.bind(client),
  };
}
