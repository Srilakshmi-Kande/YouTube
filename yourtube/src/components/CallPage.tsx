import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CircleStop, Copy, MonitorUp, Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRouter } from 'next/router';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export default function CallPage() {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('test-room');
  const [recording, setRecording] = useState<boolean>(false);
  const [inCall, setInCall] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>('Ready to join');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    const room = router.query.room;
    if (typeof room === 'string' && room.trim()) setRoomId(room);
  }, [router.query.room]);

  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  async function startLocalStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
  }

  async function createPeerConnection(socket: Socket) {
    const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    if (turnUrl) {
      iceServers.push({
        urls: turnUrl,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      });
    }

    const pc = new RTCPeerConnection({
      iceServers,
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { room: roomId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        void remoteVideoRef.current.play().catch(() => undefined);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallStatus('Connected');
      if (pc.connectionState === 'connecting') setCallStatus('Connecting media...');
      if (pc.connectionState === 'failed') setCallStatus('Media connection failed. A TURN server may be required.');
    };

    // add local tracks
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
    }

    pcRef.current = pc;
    return pc;
  }

  async function joinRoom() {
    try {
      setCallStatus('Requesting camera and microphone...');
      await startLocalStream();
    } catch {
      setCallStatus('Camera and microphone permission is required.');
      return;
    }
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    const pc = await createPeerConnection(socket);
    setInCall(true);

    socket.emit('join-room', roomId);
    setCallStatus('Waiting for your friend...');

    socket.on('user-joined', async ({ id }) => {
      // create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { room: roomId, sdp: offer });
    });

    socket.on('offer', async ({ sdp, from }) => {
      await pc.setRemoteDescription(sdp);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { room: roomId, sdp: answer });
    });

    socket.on('answer', async ({ sdp, from }) => {
      await pc.setRemoteDescription(sdp);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.warn('Failed to add ICE candidate', err);
      }
    });

    socket.on('connect_error', () => setCallStatus('Could not connect to the call server.'));
  }

  async function startScreenShare() {
    // request display media
    // allow YouTube sharing when the user selects the browser tab/window with YouTube
    const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
    // replace video track in peer connection
    if (pcRef.current && screenStream.getVideoTracks().length > 0) {
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0]);
      // show local preview of screen
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

      // when screen sharing stops, restore camera
      const track = screenStream.getVideoTracks()[0];
      track.onended = async () => {
        if (localStreamRef.current && pcRef.current) {
          const camTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender && camTrack) sender.replaceTrack(camTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    }
  }

  function startRecording() {
    const remoteStream = remoteVideoRef.current?.srcObject as MediaStream | undefined;
    const localStream = localStreamRef.current;
    if (!remoteStream && !localStream) return;

    // mix streams: create new MediaStream with remote + local audio + remote video
    const mixed = new MediaStream();
    if (remoteStream) {
      remoteStream.getTracks().forEach(t => mixed.addTrack(t));
    }
    if (localStream) {
      // add only local audio to capture both
      localStream.getAudioTracks().forEach(t => mixed.addTrack(t));
    }

    const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9,opus' };
    const mr = new MediaRecorder(mixed, options);
    recordedChunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `call-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function leaveRoom() {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
      socketRef.current.disconnect();
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setInCall(false);
    setCallStatus('Ready to join');
    pendingCandidatesRef.current = [];
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/30 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
              <Video className="size-4" />
              Yourtube calls
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Video call</h1>
            <p className="mt-1 text-sm text-muted-foreground">Invite a friend to watch and talk together.</p>
          </div>
          {recording && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span className="size-2 animate-pulse rounded-full bg-red-600" />
              Recording in progress
            </div>
          )}
        </div>

        <section className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium">
              Room ID
              <Input
                className="mt-2 h-10"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="Enter a room name"
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={joinRoom} disabled={inCall} className="h-10 bg-red-600 hover:bg-red-700">
                <Phone className="size-4" />
                {inCall ? 'In call' : 'Join call'}
              </Button>
              <Button onClick={leaveRoom} variant="outline" disabled={!inCall} className="h-10">
                <PhoneOff className="size-4" />
                Leave
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black shadow-sm">
            <video ref={remoteVideoRef} autoPlay playsInline className="size-full object-contain" />
            <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              Friend's video
            </div>
            {!inCall && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                <div className="mb-3 rounded-full bg-white/10 p-4">
                  <Video className="size-7" />
                </div>
                <p className="font-medium">Your call will appear here</p>
                <p className="mt-1 text-sm text-white/60">Join a room to start connecting.</p>
              </div>
            )}
            <div className="absolute bottom-3 right-3 aspect-video w-28 overflow-hidden rounded-lg border border-white/30 bg-zinc-900 shadow-lg sm:w-40">
              <video ref={localVideoRef} autoPlay muted playsInline className="size-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">You</span>
            </div>
          </div>

          <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <MonitorUp className="size-5 text-red-600" />
              <h2 className="font-semibold">Call controls</h2>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">Share a browser tab or window to watch YouTube together.</p>
            <div className="mt-5 grid gap-2">
              <Button onClick={startScreenShare} variant="outline" className="h-10 justify-start">
                <MonitorUp className="size-4" />
                Share screen
              </Button>
              {!recording ? (
                <Button onClick={startRecording} variant="outline" className="h-10 justify-start" disabled={!inCall}>
                  <CircleStop className="size-4" />
                  Record call
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="h-10 justify-start">
                  <CircleStop className="size-4" />
                  Stop and download
                </Button>
              )}
              <Button
                onClick={() => {
                  const inviteLink = `${window.location.origin}/call?room=${encodeURIComponent(roomId)}`;
                  navigator.clipboard?.writeText(inviteLink);
                }}
                variant="ghost"
                className="h-10 justify-start text-muted-foreground"
              >
                <Copy className="size-4" />
                Copy invite link
              </Button>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              Recordings are saved to your device as a WebM file when you stop recording.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
