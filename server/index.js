import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import userroutes from './routes/auth.js';
import videoroutes from './routes/video.js';
import likeroutes from './routes/like.js';
import watchlaterroutes from './routes/watchlater.js';
import historyroutes from './routes/history.js';
import commentroutes from './routes/comment.js';
import paymentroutes from './routes/payment.js';
import watchtimeroutes from './routes/watchTime.js';

dotenv.config()
const app = express();

import path from 'path';

app.use(cors());
app.use(express.json({limit:"30mb",extended:true}));
app.use(express.urlencoded({limit:"30mb",extended:true}));
app.use("/uploads",express.static(path.join("uploads")))

app.get('/',(req,res)=>{
    res.send("yourtube backend working");
})
 
app.use(bodyParser.json());
app.use('/user', userroutes);
app.use('/video', videoroutes);
app.use('/like', likeroutes);
app.use('/watch',watchlaterroutes);
app.use('/history',historyroutes);
app.use('/comment',commentroutes);
app.use('/payment', paymentroutes);
app.use('/watchtime', watchtimeroutes);

const PORT = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_URL || true;

// Create HTTP server and attach Socket.IO for WebRTC signaling
const httpServer = createServer(app);
const io = new IOServer(httpServer, {
    cors: { origin: frontendOrigin },
});

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('join-room', (room) => {
        socket.join(room);
        socket.to(room).emit('user-joined', { id: socket.id });
    });

    socket.on('offer', ({ room, sdp }) => {
        socket.to(room).emit('offer', { sdp, from: socket.id });
    });

    socket.on('answer', ({ room, sdp }) => {
        socket.to(room).emit('answer', { sdp, from: socket.id });
    });

    socket.on('ice-candidate', ({ room, candidate }) => {
        socket.to(room).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('leave-room', (room) => {
        socket.leave(room);
        socket.to(room).emit('user-left', { id: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('socket disconnected', socket.id);
    });
});

httpServer.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose.connect(DBURL).then(()=>{
    console.log("Mongodb connected");
}).catch((error)=>{
    console.log(error);
})