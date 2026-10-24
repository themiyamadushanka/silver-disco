import { NextResponse } from "next/server";

let lastLogTime = 0;

export async function POST(request) {
  try {
    const data = await request.json();
    const now = Date.now();

    // Throttle terminal output to ~2.5 times per second so it doesn't flood the terminal
    if (now - lastLogTime < 350) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    lastLogTime = now;

    const { wrist = {}, fingers = {}, metrics = {}, gesture = {}, handedness = "Right" } = data;
    const thumb = fingers.thumb?.tip || {};
    const index = fingers.index?.tip || {};
    const middle = fingers.middle?.tip || {};
    const ring = fingers.ring?.tip || {};
    const pinky = fingers.pinky?.tip || {};

    const tExt = fingers.thumb?.extended ? "EXTENDED" : "FOLDED";
    const iExt = fingers.index?.extended ? "EXTENDED" : "FOLDED";
    const mExt = fingers.middle?.extended ? "EXTENDED" : "FOLDED";
    const rExt = fingers.ring?.extended ? "EXTENDED" : "FOLDED";
    const pExt = fingers.pinky?.extended ? "EXTENDED" : "FOLDED";

    const banner = [
      "\n" + "=".repeat(75),
      `🖐️ [LIVE HAND] ${handedness} Hand | Sign: ${gesture.label || "Tracking"} | Pinch: ${metrics.pinchThumbIndex || 0}%`,
      "-".repeat(75),
      `  • Wrist (Base): X=${wrist.x?.toFixed(3) || "0.000"}  Y=${wrist.y?.toFixed(3) || "0.000"}  Z=${wrist.z?.toFixed(3) || "0.000"}`,
      `  • Thumb Tip:    X=${thumb.x?.toFixed(3) || "0.000"}  Y=${thumb.y?.toFixed(3) || "0.000"}  Z=${thumb.z?.toFixed(3) || "0.000"}  [${tExt}]`,
      `  • Index Tip:    X=${index.x?.toFixed(3) || "0.000"}  Y=${index.y?.toFixed(3) || "0.000"}  Z=${index.z?.toFixed(3) || "0.000"}  [${iExt}]`,
      `  • Middle Tip:   X=${middle.x?.toFixed(3) || "0.000"}  Y=${middle.y?.toFixed(3) || "0.000"}  Z=${middle.z?.toFixed(3) || "0.000"}  [${mExt}]`,
      `  • Ring Tip:     X=${ring.x?.toFixed(3) || "0.000"}  Y=${ring.y?.toFixed(3) || "0.000"}  Z=${ring.z?.toFixed(3) || "0.000"}  [${rExt}]`,
      `  • Pinky Tip:    X=${pinky.x?.toFixed(3) || "0.000"}  Y=${pinky.y?.toFixed(3) || "0.000"}  Z=${pinky.z?.toFixed(3) || "0.000"}  [${pExt}]`,
      "=".repeat(75),
    ].join("\n");

    console.log(banner);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
