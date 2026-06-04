import express from 'express';
import { getallvideo, uploadVideo } from '../controllers/video.js';
import upload from '../filehelper/filehelper.js';

const routes = express.Router();

routes.post('/upload',upload.single("file"), uploadVideo);
routes.get("/getall",getallvideo)

export default routes;