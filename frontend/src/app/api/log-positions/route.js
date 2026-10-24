import { NextResponse } from "next/server";

let lastLogTime = 0;

function stripEmojis(str) {
  return String(str || "")
    .replace(/[\u{1F300}-\u{1FAD6}\u{2000}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pad(str, len, align = "left") {
  str = String(str || "");
  if (str.length >= len) return str.slice(0, len);
  if (align === "center") {
    const leftPad = Math.floor((len - str.length) / 2);
    return " ".repeat(leftPad) + str + " ".repeat(len - str.length - leftPad);
  }
  return align === "right" ? str.padStart(len) : str.padEnd(len);
}

function formatCoord(val) {
  if (typeof val !== "number" || !Number.isFinite(val)) return " 0.000";
  return (val >= 0 ? " " : "") + val.toFixed(3);
}

function formatCoords(pt) {
  if (!pt || typeof pt.x !== "number") return "      -- Not Detected --     ";
  return `X=${formatCoord(pt.x)}  Y=${formatCoord(pt.y)}  Z=${formatCoord(pt.z)}`;
}

function resolveHands(rawHands) {
  if (!Array.isArray(rawHands) || rawHands.length === 0) {
    return { leftHand: null, rightHand: null };
  }

  // Filter out any invalid/null hand entries
  const hands = rawHands.filter((h) => h && typeof h === "object" && h.wrist);
  if (hands.length === 0) {
    return { leftHand: null, rightHand: null };
  }

  if (hands.length === 1) {
    const h = hands[0];
    const isLeft = String(h.handedness || "").toLowerCase().includes("left");
    const isRight = String(h.handedness || "").toLowerCase().includes("right");
    if (isLeft) return { leftHand: h, rightHand: null };
    if (isRight) return { leftHand: null, rightHand: h };
    return (h.wrist?.x ?? 0.5) < 0.5
      ? { leftHand: h, rightHand: null }
      : { leftHand: null, rightHand: h };
  }

  const h1 = hands[0];
  const h2 = hands[1];

  const h1IsLeft = String(h1.handedness || "").toLowerCase().includes("left");
  const h2IsLeft = String(h2.handedness || "").toLowerCase().includes("left");
  const h1IsRight = String(h1.handedness || "").toLowerCase().includes("right");
  const h2IsRight = String(h2.handedness || "").toLowerCase().includes("right");

  if (h1IsLeft && h2IsRight) return { leftHand: h1, rightHand: h2 };
  if (h1IsRight && h2IsLeft) return { leftHand: h2, rightHand: h1 };

  return (h1.wrist?.x ?? 0.5) <= (h2.wrist?.x ?? 0.5)
    ? { leftHand: h1, rightHand: h2 }
    : { leftHand: h2, rightHand: h1 };
}

function buildTable(leftHand, rightHand, globalGesture) {
  const colW = [16, 30, 7, 30, 7];
  const sep = "+" + colW.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const row = (c1, c2, c3, c4, c5) =>
    `| ${pad(c1, colW[0])} | ${pad(c2, colW[1])} | ${pad(c3, colW[2], "center")} | ${pad(c4, colW[3])} | ${pad(c5, colW[4], "center")} |`;

  const leftTitle = leftHand ? "LEFT HAND (X, Y, Z)" : "LEFT HAND (Inactive)";
  const rightTitle = rightHand ? "RIGHT HAND (X, Y, Z)" : "RIGHT HAND (Inactive)";

  const lines = [
    sep,
    row("JOINT / METRIC", leftTitle, "STATE", rightTitle, "STATE"),
    sep,
    row(
      "Wrist (Root)",
      formatCoords(leftHand?.wrist),
      leftHand ? "--" : "--",
      formatCoords(rightHand?.wrist),
      rightHand ? "--" : "--"
    ),
  ];

  const fingerNames = ["thumb", "index", "middle", "ring", "pinky"];
  for (const fingerName of fingerNames) {
    const lf = leftHand?.fingers?.[fingerName];
    const rf = rightHand?.fingers?.[fingerName];
    const label = `${fingerName.charAt(0).toUpperCase()}${fingerName.slice(1)} Tip`;

    const lCoords = formatCoords(lf?.tip);
    const lState = lf ? (lf.extended ? "EXT" : "FOLD") : "--";

    const rCoords = formatCoords(rf?.tip);
    const rState = rf ? (rf.extended ? "EXT" : "FOLD") : "--";

    lines.push(row(label, lCoords, lState, rCoords, rState));
  }

  lines.push(sep);

  const lGestureObj = leftHand?.gesture || (leftHand && !rightHand ? globalGesture : null);
  const rGestureObj = rightHand?.gesture || (!leftHand && rightHand ? globalGesture : null);

  const lSign = lGestureObj ? stripEmojis(lGestureObj.label || lGestureObj.gesture || "Tracking") : "--";
  const lConf = lGestureObj?.confidence ? `[${lGestureObj.confidence}%]` : "--";

  const rSign = rGestureObj ? stripEmojis(rGestureObj.label || rGestureObj.gesture || "Tracking") : "--";
  const rConf = rGestureObj?.confidence ? `[${rGestureObj.confidence}%]` : "--";

  lines.push(row("Detected Sign", lSign, lConf, rSign, rConf));

  const lPinch = leftHand?.metrics ? `Pinch: ${leftHand.metrics.pinchThumbIndex || 0}%  Span: ${leftHand.metrics.palmSpan || 0}%` : "--";
  const lPinchState = leftHand?.metrics ? (leftHand.metrics.isPinching ? "PINCH" : "OPEN") : "--";

  const rPinch = rightHand?.metrics ? `Pinch: ${rightHand.metrics.pinchThumbIndex || 0}%  Span: ${rightHand.metrics.palmSpan || 0}%` : "--";
  const rPinchState = rightHand?.metrics ? (rightHand.metrics.isPinching ? "PINCH" : "OPEN") : "--";

  lines.push(row("Pinch & Span", lPinch, lPinchState, rPinch, rPinchState));

  const lExt = leftHand?.metrics ? `${leftHand.metrics.extendedCount || 0} / 5 Extended` : "--";
  const rExt = rightHand?.metrics ? `${rightHand.metrics.extendedCount || 0} / 5 Extended` : "--";

  lines.push(row("Extended Count", lExt, "", rExt, ""));
  lines.push(sep);

  return lines.join("\n");
}

export async function POST(request) {
  try {
    const data = await request.json().catch(() => null);
    if (!data) {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const now = Date.now();

    // Throttle terminal output to ~2.5 times per second so it doesn't flood the terminal
    if (now - lastLogTime < 350) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    lastLogTime = now;

    const hands = Array.isArray(data.hands) ? data.hands : [data];
    const globalGesture = data.gesture || {};
    const { leftHand, rightHand } = resolveHands(hands);

    // Only output if at least one hand is detected
    if (leftHand || rightHand) {
      console.log("\n" + buildTable(leftHand, rightHand, globalGesture));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("Terminal log handled error:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}
