import express from "express";

const router = express.Router();

/* GET home page. */
router.get("/", function (_req, res, _next) {
  res.render("index");
});

router.get("/broadcaster", function (_req, res, _next) {
  res.render("broadcaster");
});

export default router;
