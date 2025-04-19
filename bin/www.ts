#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "../app";
import debug from "debug";
import http from "http";
import { Server } from "socket.io";
/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: { syscall: string; code: string }) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  if (addr === null) {
    throw new Error("Address is null");
  }
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

/**
 * Socket.IO setup
 */
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("connected");

  socket.on("offer", (offer) => {
    console.log("Offer received: ", offer);
    socket.broadcast.emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    console.log("Answer received: ", answer);
    socket.broadcast.emit("answer", answer);
  });

  socket.on("iceCandidate", (iceCandidate) => {
    console.log("IceCandidate received: ", iceCandidate);
    socket.broadcast.emit("iceCandidate", iceCandidate);
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});
