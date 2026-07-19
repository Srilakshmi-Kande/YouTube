import express from 'express';
import {
  deletecomment,
  editcomment,
  getallcomment,
  postcomment,
  reactToComment,
  translateComment,
} from '../controllers/comment.js';

const routes = express.Router();
routes.post('/translate', translateComment);
routes.post('/postcomment', postcomment);
routes.post('/react/:id', reactToComment);
routes.delete('/deletecomment/:id', deletecomment);
routes.post('/editcomment/:id', editcomment);
routes.get("/:videoid", getallcomment);

export default routes;