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

    socket.on("registerAsBroadcaster", async () => {
      if (await isBroadcasterPresent({ socketServer })) return;
      socket.join("broadcaster");
    });

    socket.on("requestToStartSignaling", async () => {
      if (await disconnectIfNoBroadcaster({ socketServer, socket })) return;
      socket.join("viewer");
      socket.to("broadcaster").emit("requestToStartSignaling");
    });

    socket.on("offer", async (offer) => {
      socket.to("viewer").emit("offer", offer);
    });

    socket.on("answer", async (answer) => {
      if (await disconnectIfNoBroadcaster({ socketServer, socket })) return;
      socket.to("broadcaster").emit("answer", answer);
    });

    socket.on("iceCandidate", async (iceCandidate) => {
      if (await disconnectIfNoBroadcaster({ socketServer, socket })) return;

      if (socket.rooms.has("viewer")) {
        socket.to("broadcaster").emit("iceCandidate", iceCandidate);
      } else if (socket.rooms.has("broadcaster")) {
        socket.to("viewer").emit("iceCandidate", iceCandidate);
      }
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

async function isBroadcasterPresent({
  socketServer,
}: {
  socketServer: Server;
}) {
  return (await socketServer.in("broadcaster").fetchSockets()).length > 0;
}

async function disconnectIfNoBroadcaster({
  socketServer,
  socket,
}: {
  socketServer: Server;
  socket: Socket;
}) {
  if (await isBroadcasterPresent({ socketServer })) return false;

  socket.emit("abort", "No broadcaster found. Please try again later.");
  socket.disconnect();
  return true;
}
