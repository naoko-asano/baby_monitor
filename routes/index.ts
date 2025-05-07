import express from "express";
import basicAuth from "express-basic-auth";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

/* GET home page. */
router.get(
  "/",
  basicAuth({
    users: { [process.env.BASIC_AUTH_USER!]: process.env.BASIC_AUTH_PASSWORD! },
    challenge: true,
  }),
  function (_req, res, _next) {
    res.render("index", { title: "Baby Monitor", page: "viewer" });
  },
);

router.get("/broadcaster", function (_req, res, _next) {
  res.render("broadcaster", {
    title: "Baby Monitor(配信用)",
    page: "broadcaster",
  });
});

export default router;
