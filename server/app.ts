import path from "path";

import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import basicAuth from "express-basic-auth";
import createError from "http-errors";
import logger from "morgan";

dotenv.config();

type Error = {
  status?: number;
  message: string;
  stack?: string;
};

const app = express();
const __dirname = path.resolve();

// view engine setup
app.set("views", path.join(__dirname, "server", "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  basicAuth({
    users: { [process.env.BASIC_AUTH_USER!]: process.env.BASIC_AUTH_PASSWORD! },
    challenge: true,
  }),
);
app.use(express.static(path.join(__dirname, "dist", "client")));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
