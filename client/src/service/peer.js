class PeerService {
  constructor() {
    this.peers = {}; // store peer per socketId

    this.iceConfig = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    };
  }

  createPeer(id) {
    if (!this.peers[id]) {
      this.peers[id] = new RTCPeerConnection(this.iceConfig);
    }

    return this.peers[id];
  }

  getPeer(id) {
    return this.peers[id];
  }

  async getOffer(id) {
    const peer = this.createPeer(id);

    const offer = await peer.createOffer();

    await peer.setLocalDescription(
      new RTCSessionDescription(offer)
    );

    return offer;
  }

  async getAnswer(id, offer) {
    const peer = this.createPeer(id);

    await peer.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const ans = await peer.createAnswer();

    await peer.setLocalDescription(
      new RTCSessionDescription(ans)
    );

    return ans;
  }

  async setLocalDescription(id, ans) {
    const peer = this.getPeer(id);

    if (!peer) return;

    await peer.setRemoteDescription(
      new RTCSessionDescription(ans)
    );
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