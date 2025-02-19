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

app.get("/meeting/:id", (req, res) => {
  res.render("meeting", { meetingId: req.params.id });
});

app.get("/meeting/:meetingId", (req, res) => {
  res.render("meeting", { meetingId: req.params.meetingId });
});

app.get("/create-meeting", (req, res) => {
  const meetingId = Date.now().toString();
  meetings[meetingId] = { participants: [] };
  res.json({ meetingId });
});

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received message:", data);

    switch (data.type) {
      case "create-meeting":
        const meetingId = Date.now().toString();
        meetings[meetingId] = { participants: [] };
        socket.send(JSON.stringify({ type: "meeting-created", meetingId }));
        break;

      case "join-meeting":
        if (!meetings[data.meetingId]) {
          meetings[data.meetingId] = { participants: [] };
        }

        // Assign a unique ID to the participant
        const peerId = Math.random().toString(36).substr(2, 9);
        socket.peerId = peerId;
        meetings[data.meetingId].participants.push(socket);

        // Notify existing participants about the new participant
        meetings[data.meetingId].participants.forEach((peer) => {
          if (peer !== socket) {
            peer.send(
              JSON.stringify({ type: "new-participant", peerId: socket.peerId })
            );
          }
        });

        // Notify the joining participant about existing peers
        const existingPeers = meetings[data.meetingId].participants
          .filter((peer) => peer !== socket)
          .map((peer) => peer.peerId);

        socket.send(
          JSON.stringify({
            type: "existing-participants",
            peers: existingPeers,
          })
        );

        console.log("Updated meetings:", meetings);
        break;

      case "signal":
        if (meetings[data.meetingId]) {
          meetings[data.meetingId].participants.forEach((client) => {
            if (client !== socket) {
              client.send(JSON.stringify(data));
            }
          });
        }
        break;

      case "leave-meeting":
        if (meetings[data.meetingId]) {
          meetings[data.meetingId].participants = meetings[
            data.meetingId
          ].participants.filter((p) => p !== socket);
          socket.close();
        }
        break;
    }
  });
  // wss.on("connection", (socket) => {
  //   socket.on("message", (message) => {
  //     const data = JSON.parse(message);
  //     console.log("data - ", data);

  //     switch (data.type) {
  //       case "create-meeting":
  //         const meetingId = Date.now().toString();
  //         meetings[meetingId] = { participants: [] };
  //         socket.send(JSON.stringify({ type: "meeting-created", meetingId }));
  //         break;

  //       case "join-meeting":
  //         if (meetings[data.meetingId]) {
  //           meetings[data.meetingId].participants.push(socket);
  //           meetings[data.meetingId].participants.forEach((peer) => {
  //             if (peer !== socket) {
  //               peer.send(JSON.stringify({ type: "new-participant" }));
  //             }
  //           });
  //         } else {
  //           meetings[data.meetingId] = { participants: [socket] };
  //         }
  //         console.log("meetings = ", meetings);
  //         break;

  //       // case 'signal':
  //       //     meetings[data.meetingId]?.participants.forEach(peer => {
  //       //         if (peer !== socket) {
  //       //             peer.send(JSON.stringify(data));
  //       //         }
  //       //     });
  //       //     break;

  //       case "signal":
  //         if (meetings[data.meetingId]) {
  //           meetings[data.meetingId].participants.forEach((client) => {
  //             if (client !== socket) {
  //               client.send(JSON.stringify(data));
  //             }
  //           });
  //         }
  //         break;

  //       case "leave-meeting":
  //         if (meetings[data.meetingId]) {
  //           meetings[data.meetingId].participants = meetings[
  //             data.meetingId
  //           ].participants.filter((p) => p !== socket);
  //           socket.close();
  //         }
  //         break;
  //     }
  //   });

  //   socket.on("close", () => {
  //     Object.keys(meetings).forEach((meetingId) => {
  //       meetings[meetingId].participants = meetings[
  //         meetingId
  //       ].participants.filter((p) => p !== socket);
  //     });
  //   });

  socket.on("close", () => {
    Object.keys(meetings).forEach((meetingId) => {
      meetings[meetingId].participants = meetings[
        meetingId
      ].participants.filter((p) => p !== socket);
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

