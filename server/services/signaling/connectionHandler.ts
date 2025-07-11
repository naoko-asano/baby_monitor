import { Connection, SignalingServer } from "./types.js";
import {
  isBroadcasterPresent,
  disconnectIfNoBroadcaster,
  isFromBroadcaster,
} from "./utils.js";

import {
  incrementViewers,
  decrementViewers,
} from "@/services/viewerCounter/index.js";

export function handleConnection(
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
    incrementViewers();
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
    decrementViewers();
    connection.disconnect();
  });

  connection.on("disconnect", () => {
    console.log("Websocket disconnected. connection.id:", connection.id);
  });
}
