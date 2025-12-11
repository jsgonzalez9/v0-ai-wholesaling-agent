const { WebSocketServer } = require("ws")
const WebSocket = require("ws")
const url = require("url")

const PORT = process.env.MEDIA_WS_PORT ? Number(process.env.MEDIA_WS_PORT) : 4000
const PATH = "/media"
const OPENAI_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime"

const wss = new WebSocketServer({ port: PORT, path: PATH })

wss.on("connection", (ws, req) => {
  const q = url.parse(req.url, true).query
  let streamSid = null
  const vadEnabled = String(process.env.VOICE_VAD_ENABLED || "false").toLowerCase() === "true"
  const vadThreshold = Number(process.env.VAD_THRESHOLD || 8)
  const oa = new WebSocket(OPENAI_URL, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}` },
  })

  oa.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.type === "output_audio.delta" && streamSid) {
        ws.send(
          JSON.stringify({ event: "media", streamSid, media: { payload: msg.audio } }),
        )
      }
    } catch {}
  })

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.event === "start") {
        streamSid = msg.start.streamSid
      } else if (msg.event === "media") {
        const payload = msg.media.payload
        if (oa.readyState === WebSocket.OPEN) {
          if (!vadEnabled) {
            oa.send(JSON.stringify({ type: "input_audio_buffer.append", audio: payload }))
          } else {
            try {
              const buf = Buffer.from(payload, "base64")
              let sum = 0
              for (let i = 0; i < buf.length; i++) sum += Math.abs(buf[i] - 128)
              const avg = sum / buf.length
              if (avg >= vadThreshold) {
                oa.send(JSON.stringify({ type: "input_audio_buffer.append", audio: payload }))
              }
            } catch {}
          }
        }
      } else if (msg.event === "stop") {
        if (oa.readyState === WebSocket.OPEN) {
          oa.send(JSON.stringify({ type: "input_audio_buffer.commit" }))
          oa.send(JSON.stringify({ type: "response.create" }))
        }
      }
    } catch {}
  })

  ws.on("close", () => {
    try {
      oa.close()
    } catch {}
  })
})

process.stdout.write(`Media WS listening on ${PORT}${PATH}\n`)
