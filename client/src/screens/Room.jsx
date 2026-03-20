import React, { useEffect, useState, useCallback } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();

  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteIds, setRemoteIds] = useState([]);

  // user joined (DO NOT AUTO CALL)
  const handleUserJoined = useCallback(({ id }) => {
    setRemoteIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  // CLICK CALL BUTTON
  const handleCallUser = useCallback(async () => {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

    setMyStream(stream);

    remoteIds.forEach(async (id) => {
      const offer = await peer.getOffer(id, socket);

      socket.emit("user:call", {
        to: id,
        offer,
      });
    });
  }, [remoteIds, socket]);

  // incoming call
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteIds((prev) => {
        if (prev.includes(from)) return prev;
        return [...prev, from];
      });

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
      await peer.setRemoteDescription(from, ans);

      if (myStream) {
        peer.addTrack(from, myStream);
      } else {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        setMyStream(stream);

        peer.addTrack(from, stream);
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

  // track event
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
            {remoteIds.length} connected
          </div>
        </div>

        <div className="room-actions">

          <button
            className="button secondary"
            onClick={handleCallUser}
            disabled={!remoteIds.length}
          >
            Call
          </button>

        </div>

        <div className="stream-grid">

          {/* MY STREAM */}

          <div className="stream-card">
            <div className="video-label">
              My Stream
            </div>

            <div className="video-frame">

              {myStream ? (
                <ReactPlayer
                  playing
                  muted
                  width="100%"
                  height="100%"
                  url={myStream}
                />
              ) : (
                <div className="video-placeholder">
                  Click Call to start camera
                </div>
              )}

            </div>
          </div>

          {/* REMOTE STREAMS */}

          {Object.keys(remoteStreams).map(
            (id, i) => (
              <div
                className="stream-card"
                key={id}
              >
                <div className="video-label">
                  Remote #{i + 1}
                </div>

                <div className="video-frame">
                  <ReactPlayer
                    playing
                    width="100%"
                    height="100%"
                    url={remoteStreams[id]}
                  />
                </div>
              </div>
            )
          )}

          {!Object.keys(remoteStreams).length && (
            <div className="stream-card muted">
              <div className="video-label">
                Remote streams
              </div>

              <div className="video-frame">
                <div className="video-placeholder tall">
                  Waiting for participants to call
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