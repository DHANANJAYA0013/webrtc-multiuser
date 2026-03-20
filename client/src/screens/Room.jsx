import React, { useEffect, useState, useCallback } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();

  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteIds, setRemoteIds] = useState([]);

  // get camera automatically
  useEffect(() => {
    const start = async () => {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setMyStream(stream);
    };

    start();
  }, []);

  // user joined
  const handleUserJoined = useCallback(
    async ({ id }) => {
      setRemoteIds((prev) => [...prev, id]);

      const offer = await peer.getOffer(id, socket);

      socket.emit("user:call", {
        to: id,
        offer,
      });
    },
    [socket]
  );

  // incoming call
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteIds((prev) => [...prev, from]);

      const ans = await peer.getAnswer(
        from,
        offer,
        socket
      );

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
      await peer.setRemoteDescription(
        from,
        ans
      );

      if (myStream) {
        peer.addTrack(from, myStream);
      }
    },
    [myStream]
  );

  // ICE
  const handleIce = useCallback(
    async ({ from, candidate }) => {
      await peer.addIceCandidate(
        from,
        candidate
      );
    },
    []
  );

  // track
  useEffect(() => {
    remoteIds.forEach((id) => {
      const p = peer.getPeer(id);

      if (!p) return;

      p.ontrack = (e) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [id]: e.streams[0],
        }));
      };
    });
  }, [remoteIds]);

  // socket listeners
  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("ice:candidate", handleIce);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("ice:candidate", handleIce);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIce,
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