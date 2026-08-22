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

const httpServer = createServer(app);

const frontendOrigin = process.env.FRONTEND_URL;

const io = new IOServer(httpServer, {
    cors: {
        origin: frontendOrigin,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.on('connection', (socket) => {
    console.log('🟢 SOCKET CONNECTED:', socket.id);

    socket.on('join-room', (room) => {
        console.log("🔥 JOIN ROOM");
        console.log("Socket:", socket.id);
        console.log("Room:", room);

        const roomBefore = io.sockets.adapter.rooms.get(room);

        console.log(
            "Users already in room:",
            roomBefore ? roomBefore.size : 0
        );

        socket.join(room);

        const roomAfter = io.sockets.adapter.rooms.get(room);

        console.log(
            "Users after joining:",
            roomAfter ? roomAfter.size : 0
        );

        socket.to(room).emit('user-joined', {
            id: socket.id
        });
    });

    socket.on('offer', ({ room, sdp }) => {
        console.log("🔥 OFFER from:", socket.id);
        console.log("Room:", room);

        socket.to(room).emit('offer', {
            sdp,
            from: socket.id
        });
    });

    socket.on('answer', ({ room, sdp }) => {
        console.log("🔥 ANSWER from:", socket.id);
        console.log("Room:", room);

        socket.to(room).emit('answer', {
            sdp,
            from: socket.id
        });
    });

    socket.on('ice-candidate', ({ room, candidate }) => {
        console.log("🧊 ICE from:", socket.id);

        socket.to(room).emit('ice-candidate', {
            candidate,
            from: socket.id
        });
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