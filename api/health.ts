export default function handler(req: any, res: any) {
  const raw = process.env.JN_New_API ?? process.env.JOBNIMBUS_API_KEY ?? "";
  res.status(200).json({
    status: "ok",
    service: "jobnimbus-mcp",
    timestamp: new Date().toISOString(),
    // Key diagnostics (never the value itself)
    keySource: process.env.JN_New_API ? "JN_New_API" : process.env.JOBNIMBUS_API_KEY ? "JOBNIMBUS_API_KEY" : "none",
    keyLength: raw.length,
    keyHasWhitespace: raw !== raw.trim()
  });
}
