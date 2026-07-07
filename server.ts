/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Enable CORS for API requests so that the hosted frontend on fgtv.qzz.io can communicate with the backend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Ensure data directory exists for persistent playlists storage
const DATA_DIR = path.join(process.cwd(), "data");
const PLAYLISTS_FILE = path.join(DATA_DIR, "playlists.json");
const DEVICES_FILE = path.join(DATA_DIR, "devices.json");
const LICENSE_KEYS_FILE = path.join(DATA_DIR, "keys.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PLAYLISTS_FILE)) {
  fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify({}), "utf8");
}

if (!fs.existsSync(DEVICES_FILE)) {
  fs.writeFileSync(DEVICES_FILE, JSON.stringify({}), "utf8");
}

if (!fs.existsSync(LICENSE_KEYS_FILE)) {
  // Pre-seed some premium licensing activation keys for resellers/users to use instantly
  const initialKeys = [
    { key: "IBO-PRO-TRIAL-8899", type: "trial_extend", days: 7, used: false, usedBy: "" },
    { key: "IBO-PRO-1YEAR-7788", type: "1year", days: 365, used: false, usedBy: "" },
    { key: "IBO-PRO-LIFETIME-9900", type: "lifetime", days: 9999, used: false, usedBy: "" },
    { key: "IBO-PRO-GOLD-5544", type: "lifetime", days: 9999, used: false, usedBy: "" }
  ];
  fs.writeFileSync(LICENSE_KEYS_FILE, JSON.stringify(initialKeys, null, 2), "utf8");
}

// Helpers to read/write local playlists DB
function readDb(): Record<string, any[]> {
  try {
    const data = fs.readFileSync(PLAYLISTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read playlists file:", err);
    return {};
  }
}

function writeDb(data: Record<string, any[]>): boolean {
  try {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write playlists file:", err);
    return false;
  }
}

// Helpers to read/write Devices DB
function readDevicesDb(): Record<string, any> {
  try {
    const data = fs.readFileSync(DEVICES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read devices file:", err);
    return {};
  }
}

function writeDevicesDb(data: Record<string, any>): boolean {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write devices file:", err);
    return false;
  }
}

// Helpers to read/write License Keys DB
function readKeysDb(): any[] {
  try {
    const data = fs.readFileSync(LICENSE_KEYS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read keys file:", err);
    return [];
  }
}

function writeKeysDb(data: any[]): boolean {
  try {
    fs.writeFileSync(LICENSE_KEYS_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write keys file:", err);
    return false;
  }
}

// Automatically register device in DB if it doesn't exist yet, with a 30-day (1 month) free trial
function ensureDeviceRegistered(mac: string, key?: string): any {
  const cleanMac = mac.trim().toUpperCase();
  const devices = readDevicesDb();
  const now = new Date();

  if (!devices[cleanMac]) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); // 30-day (1 month) free trial period as requested!

    devices[cleanMac] = {
      mac: cleanMac,
      key: key || Math.floor(100000 + Math.random() * 900000).toString(),
      status: "trial",
      expiryDate: expiry.toISOString(),
      registeredAt: now.toISOString()
    };
    writeDevicesDb(devices);
    console.log(`[Database] Auto-registered device ${cleanMac} with 30 days free trial.`);
  }

  return devices[cleanMac];
}

// ============================================================================
// DEVICE ACTIVATION & SUBSCRIPTION STATUS APIS
// ============================================================================

// API: Get Device status (or register if new MAC)
app.get("/api/device/status", (req, res) => {
  const mac = req.query.mac as string;
  const key = req.query.key as string;

  if (!mac) {
    return res.status(400).json({ error: "MAC Address is required" });
  }

  const cleanMac = mac.trim().toUpperCase();
  // Ensure registered with 30-day free trial
  const dev = ensureDeviceRegistered(cleanMac, key);
  const devices = readDevicesDb();
  const now = new Date();

  // If the device key was not saved or needs synchronization
  if (key && dev.key !== key && !devices[cleanMac].keySyncDone) {
    devices[cleanMac].key = key;
    devices[cleanMac].keySyncDone = true;
    writeDevicesDb(devices);
  }

  const activeDev = devices[cleanMac] || dev;

  // Calculate remaining days
  const expiry = new Date(activeDev.expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let currentStatus = activeDev.status;
  if (diffDays <= 0) {
    currentStatus = "expired";
  }

  return res.json({
    mac: cleanMac,
    key: activeDev.key,
    status: currentStatus,
    expiryDate: activeDev.expiryDate,
    daysLeft: Math.max(0, diffDays),
    isExpired: diffDays <= 0
  });
});

// API: Activate Device using License/Activation Code or Online Renewal Simulator
app.post("/api/device/activate", (req, res) => {
  const { mac, key, code, action } = req.body;

  if (!mac) {
    return res.status(400).json({ error: "MAC Address is required" });
  }

  const cleanMac = mac.trim().toUpperCase();
  const devices = readDevicesDb();

  if (!devices[cleanMac]) {
    return res.status(404).json({ error: "Device not found. Please register device first by opening the app." });
  }

  const dev = devices[cleanMac];

  // Verify Device Key for secure activation
  if (key && dev.key !== key) {
    return res.status(403).json({ error: "Invalid Device Key" });
  }

  const now = new Date();

  // Mode 1: Simulator - One-Click Activation (great for quick testing and VPS production demo)
  if (action === "simulate_payment") {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 365); // Activate for 1 year

    dev.status = "active";
    dev.expiryDate = expiry.toISOString();
    dev.activatedAt = now.toISOString();
    dev.activationType = "online_renewal";

    devices[cleanMac] = dev;
    writeDevicesDb(devices);

    return res.json({
      success: true,
      message: "Device activated successfully via Online Renewal simulator (1 Year added)!",
      device: dev
    });
  }

  // Mode 2: Key Activation - Using generated Pin Codes
  if (!code) {
    return res.status(400).json({ error: "Activation code is required" });
  }

  const cleanCode = code.trim().toUpperCase();
  const keys = readKeysDb();
  const keyIdx = keys.findIndex(k => k.key === cleanCode && !k.used);

  if (keyIdx === -1) {
    return res.status(400).json({ error: "Invalid, expired, or already used activation code." });
  }

  const license = keys[keyIdx];
  let daysToAdd = license.days || 365;

  let currentExpiry = new Date(dev.expiryDate);
  // If already expired, start expiry from now. Otherwise, extend existing expiry.
  if (currentExpiry < now) {
    currentExpiry = new Date();
  }
  currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);

  dev.status = "active";
  dev.expiryDate = currentExpiry.toISOString();
  dev.activatedAt = now.toISOString();
  dev.activationCodeUsed = cleanCode;
  dev.activationType = license.type;

  // Mark license as used
  license.used = true;
  license.usedBy = cleanMac;
  license.usedAt = now.toISOString();

  devices[cleanMac] = dev;
  keys[keyIdx] = license;

  writeDevicesDb(devices);
  writeKeysDb(keys);

  return res.json({
    success: true,
    message: `License key applied! Device activated for another ${daysToAdd === 9999 ? 'Lifetime' : daysToAdd + ' Days'}.`,
    device: dev
  });
});

// API: Generate Activation Key (Reseller Panel API)
app.post("/api/admin/generate-key", (req, res) => {
  const { type } = req.body; // "trial_extend" (7 days) | "1year" (365 days) | "lifetime" (9999 days)
  
  const days = type === "trial_extend" ? 7 : type === "lifetime" ? 9999 : 365;
  const label = type === "trial_extend" ? "TRIAL" : type === "lifetime" ? "LIFETIME" : "1YEAR";
  
  // Generate random 4-digit number
  const rand = Math.floor(1000 + Math.random() * 9000);
  const newKey = `IBO-PRO-${label}-${rand}`;

  const keys = readKeysDb();
  keys.push({
    key: newKey,
    type: type || "1year",
    days,
    used: false,
    usedBy: "",
    createdAt: new Date().toISOString()
  });

  if (writeKeysDb(keys)) {
    return res.json({ success: true, key: newKey });
  } else {
    return res.status(500).json({ error: "Failed to save generated key" });
  }
});

// API: List Active Keys (for Reseller Panel display)
app.get("/api/admin/keys", (req, res) => {
  const keys = readKeysDb();
  return res.json({ keys });
});

// API: Save/Add playlist associated with MAC Address
app.post("/api/playlist/save", (req, res) => {
  const { mac, key, name, type, url, host, username, password } = req.body;

  if (!mac) {
    return res.status(400).json({ error: "MAC Address is required" });
  }

  const cleanMac = mac.trim().toUpperCase();
  
  // Create device/account in database if not already present
  ensureDeviceRegistered(cleanMac, key);

  const db = readDb();
  const playlists = db[cleanMac] || [];

  const newPlaylist = {
    id: `pl-${Math.random().toString(36).substring(2, 11)}`,
    name: name || "My Playlist",
    type: type || "m3u",
    url: url || "",
    host: host || "",
    username: username || "",
    password: password || "",
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  playlists.push(newPlaylist);
  db[cleanMac] = playlists;

  if (writeDb(db)) {
    return res.status(200).json({ success: true, playlist: newPlaylist });
  } else {
    return res.status(500).json({ error: "Failed to persist playlist" });
  }
});

// API: Fetch playlists associated with MAC Address
app.get("/api/playlist/get", (req, res) => {
  const mac = req.query.mac as string;
  const key = req.query.key as string;

  if (!mac) {
    return res.status(400).json({ error: "MAC Address is required" });
  }

  const cleanMac = mac.trim().toUpperCase();
  
  // Create device/account in database if not already present, utilizing the key if provided
  ensureDeviceRegistered(cleanMac, key);

  const devices = readDevicesDb();
  const dev = devices[cleanMac];

  // Verify key/PIN for portal connection security
  if (key && dev && dev.key && dev.key.trim() !== key.trim()) {
    return res.status(403).json({ 
      error: "رمز الجهاز (Key / PIN) غير صحيح! يرجى إدخال الرمز الظاهر على شاشة التلفزيون بدقة. / Incorrect Device Key! Please enter the exact PIN shown on your TV screen." 
    });
  }

  const db = readDb();
  const playlists = db[cleanMac] || [];

  // Obfuscate passwords before sending to client
  const safePlaylists = playlists.map(pl => ({
    ...pl,
    password: pl.password ? "••••••••" : undefined
  }));

  return res.status(200).json({ playlists: safePlaylists });
});

// API: Delete a playlist
app.post("/api/playlist/delete", (req, res) => {
  const { mac, playlistId } = req.body;

  if (!mac || !playlistId) {
    return res.status(400).json({ error: "MAC Address and playlist ID are required" });
  }

  const cleanMac = mac.trim().toUpperCase();
  const db = readDb();
  const playlists = db[cleanMac] || [];

  const updatedPlaylists = playlists.filter(pl => pl.id !== playlistId);
  db[cleanMac] = updatedPlaylists;

  if (writeDb(db)) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: "Failed to delete playlist" });
  }
});

// API: CORS Proxy for M3U File URL
app.get("/api/proxy/m3u", async (req, res) => {
  const m3uUrl = req.query.url as string;

  if (!m3uUrl) {
    return res.status(400).send("URL parameter is required");
  }

  try {
    console.log(`Proxying M3U from URL: ${m3uUrl}`);
    const response = await fetch(m3uUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch M3U: ${response.statusText}`);
    }

    const text = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(text);
  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).send(`Proxy internal error: ${err.message}`);
  }
});

// API: CORS Proxy for Xtream Codes API commands (e.g. /player_api.php)
app.get("/api/proxy/xtream", async (req, res) => {
  const host = req.query.host as string;
  const username = req.query.username as string;
  const password = req.query.password as string;
  const action = req.query.action as string;
  const categoryId = req.query.category_id as string;

  if (!host || !username) {
    return res.status(400).json({ error: "Host and username are required parameters" });
  }

  // Construct target URL
  let targetUrl = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  if (action) {
    targetUrl += `&action=${encodeURIComponent(action)}`;
  }
  if (categoryId) {
    targetUrl += `&category_id=${encodeURIComponent(categoryId)}`;
  }

  try {
    console.log(`Proxying Xtream query to URL: ${host}/player_api.php (Action: ${action || 'info'})`);
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (SmartTV; SAA; Tizen) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Xtream Server Error: ${response.statusText}` });
    }

    const data = await response.json();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json(data);
  } catch (err: any) {
    console.error("Xtream Proxy error:", err);
    return res.status(500).json({ error: `Proxy failure: ${err.message}` });
  }
});

// API: CORS and Mixed-Content Stream Proxy for IPTV video and HLS chunks
app.get("/api/proxy/stream", async (req, res) => {
  const streamUrl = req.query.url as string;
  console.log(`[Proxy] Requesting stream URL: ${streamUrl}`);
  if (!streamUrl) {
    return res.status(400).send("Stream URL parameter is required");
  }

  try {
    const originalUrl = new URL(streamUrl);
    
    const response = await fetch(streamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch stream: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Check if it's an HLS playlist
    const isHlsPlaylist = streamUrl.includes(".m3u8") || 
                         contentType.includes("mpegurl") || 
                         contentType.includes("mpegURL") ||
                         contentType.includes("application/x-mpegURL");

    if (isHlsPlaylist) {
      const text = await response.text();
      // Split by lines and rewrite any URL or relative path
      const lines = text.split("\n");
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return line;
        }
        
        // Resolve the URL relative to the original streamUrl
        try {
          const resolvedUrl = new URL(trimmed, originalUrl.href).href;
          // Return the proxied URL
          return `/api/proxy/stream?url=${encodeURIComponent(resolvedUrl)}`;
        } catch (e) {
          return line;
        }
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(rewrittenLines.join("\n"));
    } else {
      // It's a binary chunk (.ts or other media format), pipe the body
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");

      if (response.body) {
        const reader = (response.body as any).getReader();
        let clientClosed = false;
        
        req.on('close', () => {
          clientClosed = true;
          reader.cancel().catch(() => {});
        });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (clientClosed) break;
            res.write(value);
          }
          res.end();
        } catch (readErr: any) {
          // If the connection was closed by the client or connection aborted, this is expected.
          // We log a quiet message instead of triggering a system error.
          console.log(`[Proxy] Stream playback stopped: ${readErr.message || "Connection terminated by client"}`);
        } finally {
          try {
            reader.releaseLock();
          } catch (e) {}
        }
      } else {
        res.status(500).send("No stream body received");
      }
    }
  } catch (err: any) {
    console.error("Stream proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send(`Stream proxy error: ${err.message}`);
    }
  }
});

// Main Setup (Vite in Dev, Static Files in Prod)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FLIX GHOST IPTV Player Running on http://localhost:${PORT}`);
  });
}

startServer();
