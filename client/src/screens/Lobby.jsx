import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="lobby-page">
      <div className="lobby-shell">
        <div className="lobby-header">
          <div>
            <p className="eyebrow">Start a call</p>
            <h1>Join a room</h1>
            <p className="subtext">
              Enter your email and the room code to jump into a live session.
            </p>
          </div>
          <div className="hint-chip">Share the same room code with your partner.</div>
        </div>

        <div className="lobby-content">
          <form className="lobby-form" onSubmit={handleSubmitForm}>
            <div className="pill-row">
              <span className="pill">P2P WebRTC</span>
              <span className="pill">Browser-based</span>
              <span className="pill">No installs</span>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">
                Email
              </label>
              <input
                className="input-control"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <p className="input-hint">Used for presence and notifications.</p>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="room">
                Room code
              </label>
              <input
                className="input-control"
                type="text"
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. team-sync"
                required
              />
              <p className="input-hint">Create one and share it, or rejoin an existing room.</p>
            </div>

            <button className="button primary" type="submit">
              Join room
            </button>
            <p className="form-footnote">Tip: keep this tab open once connected.</p>
          </form>

          <div className="lobby-aside">
            <div className="info-card">
              <div className="info-title">How it works</div>
              <ol className="info-steps">
                <li>Enter the same room code as your partner.</li>
                <li>Grant camera & mic access when prompted.</li>
                <li>Hit "Join room" to start negotiating the call.</li>
              </ol>
            </div>

            <div className="info-card muted">
              <div className="info-title">Good to know</div>
              <ul className="info-list">
                <li>Optimized for small group sessions.</li>
                <li>Streams stay peer-to-peer; server relays signaling only.</li>
                <li>You can reuse room codes anytime.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
