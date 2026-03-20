class PeerService {
  constructor() {
    this.peers = {};

    this.iceConfig = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
  }

  createPeer(id, socket) {
    if (!this.peers[id]) {
      const peer = new RTCPeerConnection(this.iceConfig);

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice:candidate", {
            to: id,
            candidate: event.candidate,
          });
        }
      };

      this.peers[id] = peer;
    }

    return this.peers[id];
  }

  getPeer(id) {
    return this.peers[id];
  }

  async getOffer(id, socket) {
    const peer = this.createPeer(id, socket);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    return offer;
  }

  async getAnswer(id, offer, socket) {
    const peer = this.createPeer(id, socket);

    await peer.setRemoteDescription(offer);

    const ans = await peer.createAnswer();
    await peer.setLocalDescription(ans);

    return ans;
  }

  async setRemoteDescription(id, ans) {
    const peer = this.getPeer(id);
    if (!peer) return;

    await peer.setRemoteDescription(ans);
  }

  async addIceCandidate(id, candidate) {
    const peer = this.getPeer(id);
    if (!peer) return;

    await peer.addIceCandidate(candidate);
  }

  addTrack(id, stream) {
    const peer = this.getPeer(id);
    if (!peer) return;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
  }
}

export default new PeerService();