import express from 'express';
import { getallHistoryVideo, handlehistory, handleview } from '../controllers/history.js';

const routes = express.Router();
routes.get("/:userId",getallHistoryVideo);
routes.post("/views/:videoId",handleview);
routes.post('/:videoId',handlehistory);

export default routes;