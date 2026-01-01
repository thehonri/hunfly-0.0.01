import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { WhatsAppManager } from "./server/whatsapp.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// Initialize WhatsApp Manager
const whatsappManager = new WhatsAppManager();

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  // Send initial QR code if available
  const qrData = whatsappManager.getQRCode();
  if (qrData.qr) {
    ws.send(
      JSON.stringify({
        type: "qr",
        qr: qrData.qr,
        isConnected: qrData.isConnected,
        isReady: qrData.isReady,
      })
    );
  }

  // Listen for QR code updates
  const qrListener = (qr: string) => {
    ws.send(
      JSON.stringify({
        type: "qr",
        qr: qr,
        isConnected: whatsappManager.isConnected(),
        isReady: whatsappManager.isReady(),
      })
    );
  };

  // Listen for authentication
  const authListener = () => {
    ws.send(
      JSON.stringify({
        type: "authenticated",
        message: "WhatsApp connected successfully",
      })
    );
  };

  // Listen for disconnection
  const disconnectListener = () => {
    ws.send(
      JSON.stringify({
        type: "disconnected",
        message: "WhatsApp disconnected",
      })
    );
  };

  // Listen for errors
  const errorListener = (error: Error) => {
    ws.send(
      JSON.stringify({
        type: "error",
        message: error.message,
      })
    );
  };

  whatsappManager.on("qr", qrListener);
  whatsappManager.on("authenticated", authListener);
  whatsappManager.on("disconnected", disconnectListener);
  whatsappManager.on("error", errorListener);

  // Handle incoming messages
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "initialize") {
        await whatsappManager.initialize();
      } else if (message.type === "disconnect") {
        await whatsappManager.disconnect();
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
    whatsappManager.off("qr", qrListener);
    whatsappManager.off("authenticated", authListener);
    whatsappManager.off("disconnected", disconnectListener);
    whatsappManager.off("error", errorListener);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    whatsapp: {
      isConnected: whatsappManager.isConnected(),
      isReady: whatsappManager.isReady(),
    },
  });
});

app.get("/api/whatsapp/status", (req, res) => {
  res.json({
    isConnected: whatsappManager.isConnected(),
    isReady: whatsappManager.isReady(),
    qr: whatsappManager.getQRCode().qr || null,
  });
});

app.get("/api/whatsapp/chats", async (req, res) => {
  try {
    if (!whatsappManager.isReady()) {
      return res.status(400).json({ error: "WhatsApp not connected" });
    }

    const chats = await whatsappManager.getChats();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/whatsapp/messages/:chatId", async (req, res) => {
  try {
    if (!whatsappManager.isReady()) {
      return res.status(400).json({ error: "WhatsApp not connected" });
    }

    const { chatId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const messages = await whatsappManager.getMessages(chatId, limit);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/whatsapp/send-message", async (req, res) => {
  try {
    if (!whatsappManager.isReady()) {
      return res.status(400).json({ error: "WhatsApp not connected" });
    }

    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: "Missing chatId or message" });
    }

    const success = await whatsappManager.sendMessage(chatId, message);
    res.json({ success, message: "Message sent" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/whatsapp/disconnect", async (req, res) => {
  try {
    await whatsappManager.disconnect();
    res.json({ success: true, message: "WhatsApp disconnected" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await whatsappManager.disconnect();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
