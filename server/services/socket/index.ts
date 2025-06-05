import { Server, Socket } from "socket.io";

export function setupSocketServer(
  server: ReturnType<typeof import("http").createServer>,
) {
  const socketServer = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
    },
  });

  socketServer.on("connection", (socket: Socket) => {
    console.log("Websocket connected. socket id:", socket.id);

    socket.on("registerAsBroadcaster", () => {
      socket.join("broadcaster");
    });

    socket.on("requestToStartSignaling", async () => {
      if (await disconnectIfNoBroadcaster({ socketServer, socket })) return;
      socket.join("viewer");
      socket.to("broadcaster").emit("requestToStartSignaling");
    });

    socket.on("signalingReady", async () => {
      socket.to("viewer").emit("signalingReady");
    });

    socket.on("offer", async (offer) => {
      if (await disconnectIfNoBroadcaster({ socketServer, socket })) return;
      socket.to("broadcaster").emit("offer", offer);
    });

    socket.on("answer", async (answer) => {
      socket.to("viewer").emit("answer", answer);
    });

    socket.on("iceCandidate", async (iceCandidate) => {
      if (await disconnectIfNoBroadcaster({ socketServer, socket })) return;
      socket.broadcast.emit("iceCandidate", iceCandidate);
    });

    socket.on("close", () => {
      socket.to("broadcaster").emit("close");
      socket.disconnect();
    });

    socket.on("disconnect", () => {
      console.log("Websocket disconnected. socket.id:", socket.id);
    });
  });
}

async function disconnectIfNoBroadcaster({
  socketServer,
  socket,
}: {
  socketServer: Server;
  socket: Socket;
}) {
  const isBroadcasterPresent =
    (await socketServer.in("broadcaster").fetchSockets()).length > 0;

  if (isBroadcasterPresent) return false;

  socket.emit("abort", "No broadcaster found. Please try again later.");
  socket.disconnect();
  return true;
}
