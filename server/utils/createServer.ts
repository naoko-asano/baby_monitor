import fs from "fs";
import http from "http";
import https from "https";
import path from "path";

import type { Express } from "express";

const keyPath = path.resolve("server.key");
const certPath = path.resolve("server.crt");

export function createServer(app: Express): http.Server | https.Server {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.crt"),
    };
    return https.createServer(options, app);
  } else {
    return http.createServer(app);
  }
}
