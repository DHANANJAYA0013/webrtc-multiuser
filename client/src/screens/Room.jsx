import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();

  const [remoteSocketIds, setRemoteSocketIds] = useState([]);
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);

  // user joined
  const handleUserJoined = useCallback(({ id }) => {
    console.log("User joined:", id);

    setRemoteSocketIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  // call users
  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setMyStream(stream);

    remoteSocketIds.forEach(async (id) => {
      const offer = await peer.getOffer(id, socket);

      socket.emit("user:call", {
        to: id,
        offer,
      });
    });
  }, [remoteSocketIds, socket]);

  // incoming call
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log("Incoming call from", from);

      setRemoteSocketIds((prev) => {
        if (prev.includes(from)) return prev;
        return [...prev, from];
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setMyStream(stream);

      const ans = await peer.getAnswer(from, offer, socket);

      socket.emit("call:accepted", {
        to: from,
        ans,
      });
    },
    [socket]
  );

  // call accepted
  const handleCallAccepted = useCallback(
    async ({ from, ans }) => {
      await peer.setLocalDescription(from, ans);

      if (myStream) {
        peer.addTrack(from, myStream);
      }
    },
    [myStream]
  );

  // send stream
  const sendStreams = useCallback(() => {
    if (!myStream) return;

    remoteSocketIds.forEach((id) => {
      peer.addTrack(id, myStream);
    });
  }, [myStream, remoteSocketIds]);

  // ICE candidate receive
  const handleIceCandidate = useCallback(
    async ({ from, candidate }) => {
      await peer.addIceCandidate(from, candidate);
    },
    []
  );

  // negotiation
  const handleNegoNeeded = useCallback(
    async (id) => {
      const offer = await peer.getOffer(id, socket);

      socket.emit("peer:nego:needed", {
        to: id,
        offer,
      });
    },
    [socket]
  );

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(from, offer, socket);

      socket.emit("peer:nego:done", {
        to: from,
        ans,
      });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(
    async ({ from, ans }) => {
      await peer.setLocalDescription(from, ans);
    },
    []
  );

  // track events
  useEffect(() => {
    remoteSocketIds.forEach((id) => {
      const p = peer.getPeer(id);

      if (!p) return;

      p.ontrack = (ev) => {
        const stream = ev.streams[0];

        setRemoteStreams((prev) => {
          if (prev.includes(stream)) return prev;
          return [...prev, stream];
        });
      };

      p.onnegotiationneeded = () => handleNegoNeeded(id);
    });
  }, [remoteSocketIds, handleNegoNeeded]);

  // socket listeners
  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("ice:candidate", handleIceCandidate);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("ice:candidate", handleIceCandidate);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
    handleIceCandidate,
  ]);

  return (
    <div className="room-page">
      <div className="room-shell">
        <div className="room-header">
          <div>
            <p className="eyebrow">Live room</p>
            <h1>Group call</h1>
            <p className="subtext">
              Call every participant, share your stream, and see all remotes.
            </p>
          </div>
          <div className="status-chip status-live">
            {remoteSocketIds.length} connected
          </div>
        </div>

        <div className="room-actions">
          <button className="button secondary" onClick={handleCallUser} disabled={!remoteSocketIds.length}>
            Call all
          </button>
          <button className="button primary" onClick={sendStreams} disabled={!myStream}>
            Send my stream
          </button>
        </div>

        <div className="stream-grid">
          <div className="stream-card">
            <div className="video-label">My Stream</div>
            <div className="video-frame">
              {myStream ? (
                <ReactPlayer playing muted width="100%" height="100%" url={myStream} />
              ) : (
                <div className="video-placeholder">Click "Call all" to start and share your camera.</div>
              )}
            </div>
          </div>

          {remoteStreams.map((stream, i) => (
            <div className="stream-card" key={i}>
              <div className="video-label">Remote #{i + 1}</div>
              <div className="video-frame">
                <ReactPlayer playing muted width="100%" height="100%" url={stream} />
              </div>
              <div className="stream-meta">Streaming via P2P</div>
            </div>
          ))}

          {!remoteStreams.length && (
            <div className="stream-card muted">
              <div className="video-label">Remote streams</div>
              <div className="video-frame">
                <div className="video-placeholder tall">
                  Waiting for participants to share video.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;