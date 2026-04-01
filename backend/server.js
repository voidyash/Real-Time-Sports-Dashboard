const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const path = require("path");

const { getSheetData } = require("./sheets");

const app = express();
app.use(cors());
app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// when client connects
io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    try {
        const data = await getSheetData();
        socket.emit("scoreUpdate", data);
    } catch (err) {
        console.error("Initial fetch error:", err);
    }

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// API route (for initial fetch)
app.get("/api", async (req, res) => {
    try {
        const data = await getSheetData();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// manual update trigger (from Apps Script)
app.post("/update", async (req, res) => {
    try {
        const data = await getSheetData();
        // console.log("UPDATED DATA:", data.map(t=>t.team));
        io.emit("scoreUpdate", data);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// START SERVER
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});