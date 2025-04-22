import express from "express";

const router = express.Router();

/* GET home page. */
router.get("/", function (_req, res, _next) {
  res.render("index", { title: "Baby Monitor", page: "viewer" });
});

router.get("/broadcaster", function (_req, res, _next) {
  res.render("broadcaster", {
    title: "Baby Monitor(配信用)",
    page: "broadcaster",
  });
});

export default router;
