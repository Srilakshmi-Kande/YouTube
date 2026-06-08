import express from "express";
import { getWatchTime, updateWatchTime } from "../controllers/watchTime.js";

const routes = express.Router();

routes.get("/:userId/:videoId", getWatchTime);
routes.post("/update", updateWatchTime);

export default routes;
