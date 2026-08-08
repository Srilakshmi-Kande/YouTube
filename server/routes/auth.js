import express from 'express';
import { getuser, login, updateprofile } from '../controllers/auth.js';
import { sendOtp, verifyOtp } from '../controllers/otp.js';

const routes = express.Router();

routes.post('/login', login);
routes.post('/otp/send', sendOtp);
routes.post('/otp/verify', verifyOtp);
routes.get('/:id', getuser);
routes.patch('/update/:id',updateprofile)
export default routes;