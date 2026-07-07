import express from 'express';
import { deleteDownload, downloadVideo, getUserDownloads, getVideosByChannel, getallvideo, uploadVideo } from '../controllers/video.js';
import upload from '../filehelper/filehelper.js';

const routes = express.Router();

routes.post('/upload',upload.single("file"), uploadVideo);
routes.get("/channel/:channelId", getVideosByChannel);
routes.get("/getall",getallvideo)
routes.get('/downloads/:userId', getUserDownloads);
routes.delete('/downloads/:downloadId', deleteDownload);
routes.post('/:videoId/download', downloadVideo);

export default routes;