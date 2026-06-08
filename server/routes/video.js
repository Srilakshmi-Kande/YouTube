import express from 'express';
import { getVideosByChannel, getallvideo, uploadVideo } from '../controllers/video.js';
import upload from '../filehelper/filehelper.js';

const routes = express.Router();

routes.post('/upload',upload.single("file"), uploadVideo);
routes.get("/channel/:channelId", getVideosByChannel);
routes.get("/getall",getallvideo)

export default routes;