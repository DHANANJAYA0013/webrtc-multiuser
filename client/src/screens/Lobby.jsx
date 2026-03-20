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

        <form className="lobby-form" onSubmit={handleSubmitForm}>
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
          </div>

          <button className="button primary" type="submit">
            Join room
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
