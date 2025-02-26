// server.js (Node.js WebSocket Signaling Server with Frontend)
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const meetings = {}; // In-memory storage for meetings

app.get("/", (req, res) => {
  res.render("index");
});

// app.get("/meeting/:id", (req, res) => {
//   res.render("meeting", { meetingId: req.params.id });
// });

// app.get("/meeting/:meetingId", (req, res) => {
//   res.render("meeting", { meetingId: req.params.meetingId });
// });

app.get("/create-meeting", (req, res) => {
  const meetingId = Date.now().toString();
  meetings[meetingId] = { participants: [] };
  res.json({ meetingId });
});

function forwardSignal(data) {
  // console.log('forwardSignal - ', data.type, data.targetPeerId)
  const meeting = meetings[data.meetingId];
  // console.log('meeting - ', meeting)
  if (meeting) {
    meeting.participants.forEach((peer) => {
      if (peer.peerId === data.targetPeerId) {
        // console.log({
        //   type: data.type,
        //   peerId: peer.peerId
        // })
        peer.send(
          JSON.stringify({
            type: data.type,
            payload: data.payload, // Send the whole payload
            peerId: data.peerId,
          })
        );
      }
    });
  }
}

function leaveMeeting(socket, meetingId) {
  const meeting = meetings[meetingId];
  if (meeting) {
    meeting.participants = meeting.participants.filter((p) => p !== socket);

    // Notify other participants about the leaving peer
    meeting.participants.forEach((peer) => {
      peer.send(
        JSON.stringify({ type: "participant-left", peerId: socket.peerId })
      );
    });

    if (meeting.participants.length === 0) {
      delete meetings[meetingId]; // Clean up empty meetings
    }
  }
  socket.close();
}

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received backend:", data);

    switch (data.type) {
      case "join-meeting":
        const meetingId = data.meetingId;
        const peerId = Math.random().toString(36).substr(2, 9);
        socket.peerId = peerId;

        if (!meetings[meetingId]) {
          meetings[meetingId] = { participants: [] };
        }

        meetings[meetingId].participants.push(socket);

        // Notify existing participants
        meetings[meetingId].participants.forEach((peer) => {
          if (peer !== socket) {
            peer.send(JSON.stringify({ type: "new-participant", peerId }));
          }
        });

        // Notify the new participant about existing ones
        const existingPeers = meetings[meetingId].participants
          .filter((p) => p !== socket)
          .map((p) => p.peerId);
        socket.send(
          JSON.stringify({
            type: "existing-participants",
            peers: existingPeers,
            currentPeerId: peerId,
          })
        );
        break;

      case "offer":
      case "answer":
        forwardSignal(data);
        break;

      case "candidate":
        forwardSignal({
          ...data,
          payload: {
            // Recreate the candidate object with all required properties
            candidate: data.payload.candidate,
            sdpMid: data.payload.sdpMid,
            sdpMLineIndex: data.payload.sdpMLineIndex,
          },
        });
        break;

      // case 'leave-meeting':
      case "participant-left":
        leaveMeeting(socket, data.meetingId);
        break;
    }
  });

  socket.on("close", () => {
    Object.keys(meetings).forEach((meetingId) => {
      leaveMeeting(socket, meetingId);
    });
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
    Object.keys(meetings).forEach((meetingId) => {
      leaveMeeting(socket, meetingId);
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
