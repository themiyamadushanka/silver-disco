import { NextResponse } from "next/server";
import { classifyLandmarks } from "@/lib/csvSignClassifier";

let serverCapturedList = [];
let lastLogTime = 0;

// -----------------------------------------------------------------------
// Helper: Convert finger data into human-readable text for the AI
// This dramatically improves AI accuracy vs sending raw coordinates
// -----------------------------------------------------------------------
function describeFingerState(item) {
  const fingers = item.fingers || {};
  const metrics = item.metrics || {};
  const names = ["thumb", "index", "middle", "ring", "pinky"];
  const states = names.map((n) => `${n}=${fingers[n]?.extended ? "EXTENDED" : "CURLED"}`);
  const pinch = metrics.pinchThumbIndex ?? "?";
  const open = metrics.extendedCount ?? "?";
  const pinchNote = pinch < 7 ? `pinch=${pinch}%(TIGHT)` : `pinch=${pinch}%`;
  return `[${states.join(", ")}, ${pinchNote}, open=${open}/5]`;
}

function describeGesture(item) {
  // CSV dataset labels are the only values allowed into the AI prompt.
  const csvMatch = classifyLandmarks(item.raw_landmarks, item.left_landmarks, item.right_landmarks);
  if (csvMatch && csvMatch.label) {
    return csvMatch.label;
  }
  return null;
}

function buildReadableTrajectory(list) {
  // Sample up to 12 key frames
  let sampled = list;
  if (list.length > 12) {
    const step = Math.floor(list.length / 12);
    sampled = list.filter((_, i) => i % step === 0).slice(0, 12);
  }

  let prevGesture = null;
  return sampled
    .map((item, idx) => {
      const time = item.time_ms ?? idx * 75;
      const gesture = describeGesture(item);
      const fingers = describeFingerState(item);
      const csvMatch = classifyLandmarks(item.raw_landmarks, item.left_landmarks, item.right_landmarks);
      const csvNote = csvMatch && csvMatch.label
        ? ` [CSV_MATCH='${csvMatch.label}' ${csvMatch.confidence}%: ${csvMatch.description || ''}]`
        : "";
      const newSignMarker = gesture && gesture !== prevGesture ? "  [NEW SIGN]" : "";
      prevGesture = gesture;
      const gestureText = gesture ? `Sign='${gesture}'` : "Sign=transitioning";
      return `  Frame ${idx + 1} (~${time}ms): ${gestureText}  Fingers=${fingers}${csvNote}${newSignMarker}`;
    })
    .join("\n");
}

// -----------------------------------------------------------------------
// Azure AI Foundry call — sends only CSV sign keywords
// -----------------------------------------------------------------------
async function callAzureAI(fingerPositionsList) {
  const endpoint =
    process.env.AZURE_OPENAI_ENDPOINT ||
    "https://themiyamadushanka370-1394-resour.openai.azure.com/openai/v1";
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AZURE_OPENAI_API_KEY is not configured");
  }
  const deployment = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5-mini";

  const url = endpoint.endsWith("/chat/completions")
    ? endpoint
    : `${endpoint.replace(/\/+$/, "")}/chat/completions`;

  // Collect only CSV dataset keywords. Raw landmarks and finger states must
  // never be included in the model request.
  const signsRaw = fingerPositionsList
    .map((f) => describeGesture(f))
    .filter(Boolean);

  // Deduplicate consecutive same signs
  const signs = [];
  let prev = null;
  for (const s of signsRaw) {
    if (s !== prev) { signs.push(s); prev = s; }
  }

  const systemPrompt =
    "You are a professional ASL (American Sign Language) interpreter for a mute person. " +
    "You receive sign keywords classified against an ASL CSV dataset. " +
    "Your job is to speak the mute person's words directly in the first person as their voice. " +
    "\n\nKEY RULES:" +
    "\n- Speak AS the mute person in first person (e.g. 'Hello! How are you today?' or 'Yes, I agree with you.')" +
    "\n- NEVER describe physical actions: do NOT say 'The user is waving' or 'The hand shows'" +
    "\n- NEVER say 'The user is performing...' or 'This gesture indicates...'" +
    "\n- Produce ONE fluent English sentence (two max) that sounds natural when spoken aloud" +
    "\n- Use the sign names from the CSV dataset as primary contextual clues for meaning" +
    "\n- Output ONLY the spoken words — no labels, no quotes, no explanation";

  const userPrompt = signs.length > 0
    ? `CSV sign-language keywords detected in sequence: ${signs.map((s) => `'${s}'`).join(", ")}
Speak the mute person's message in first person. Output ONLY their spoken sentence.`
    : "No CSV sign-language keyword was detected. Reply with a brief request to repeat the sign. Output ONLY that sentence.";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Azure AI HTTP ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim()?.replace(/^\"+|\"+$/g, "");
}

// -----------------------------------------------------------------------
// POST Handler
// -----------------------------------------------------------------------
export async function POST(request) {
  try {
    const data = await request.json();
    const now = Date.now();

    // -------------------------------------------------------------
    // PAUSE CLICKED: ANALYZE ALL CAPTURED FINGER POSITIONS
    // -------------------------------------------------------------
    if (data.action === "PAUSE" || data.action === "END") {
      const capturedList = data.hand_positions_list || serverCapturedList;
      const totalCount = capturedList.length;

      console.log("\n" + "=".repeat(85));
      console.log("[PAUSE] CSV SIGN LANGUAGE DATASET ENGINE (sign_language_dual_hands_dataset.csv)");
      console.log("=".repeat(85));
      console.log(`  Total Captured Snapshots: ${totalCount} frames`);

      if (totalCount > 0) {
        // Print detected sign sequence
        const signs = [...new Set(capturedList.map((f) => describeGesture(f)).filter(Boolean))];
        if (signs.length > 0) {
          console.log(`  CSV Detected Signs: ${signs.join(" -> ")}`);
        }
      }

      console.log("-".repeat(85));
      console.log("[AI] Sending readable finger descriptions to Azure AI Foundry (gpt-5-mini)...");
      console.log("-".repeat(85));

      let fullGeneratedString = "";
      try {
        fullGeneratedString = await callAzureAI(capturedList);
      } catch (err) {
        fullGeneratedString = `Error contacting Azure AI: ${err.message}`;
      }

      // PRINT THE FULL SENTENCE PROMINENTLY
      console.log("=".repeat(85));
      console.log("[FINAL SENTENCE FROM AI (MUTE PERSON SPEAKING)]:");
      console.log(`\n   "${fullGeneratedString}"\n`);
      console.log("=".repeat(85) + "\n");

      serverCapturedList = [];

      return NextResponse.json({
        ok: true,
        action: "PAUSE_ANALYZED",
        full_string: fullGeneratedString,
        sentence: fullGeneratedString,
        total_frames: totalCount,
        detected_signs: [...new Set(capturedList.map((f) => describeGesture(f)).filter(Boolean))],
      });
    }

    // -------------------------------------------------------------
    // LIVE STREAMING WHILE PLAYING (throttled logging)
    // -------------------------------------------------------------
    serverCapturedList.push(data);

    if (now - lastLogTime < 350) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    lastLogTime = now;

    const { wrist = {}, fingers = {}, metrics = {}, gesture = {}, handedness = "Right" } = data;
    const csvMatch = classifyLandmarks(
      data.raw_landmarks,
      data.left_landmarks,
      data.right_landmarks
    );
    const keyword = csvMatch?.label || null;
    const gestureLabel = keyword || "No CSV keyword";
    const fingerDesc = describeFingerState({ fingers, metrics });

    const banner = [
      "\n" + "=".repeat(75),
      `[RECORDING] Frame #${serverCapturedList.length} | ${handedness} Hand | CSV keyword: ${gestureLabel}`,
      "-".repeat(75),
      `  ${fingerDesc}`,
      `  Wrist: X=${wrist.x?.toFixed(3) || "0.000"}  Y=${wrist.y?.toFixed(3) || "0.000"}  Z=${wrist.z?.toFixed(3) || "0.000"}`,
      "=".repeat(75),
    ].join("\n");

    console.log(banner);

    return NextResponse.json({
      ok: true,
      listLength: serverCapturedList.length,
      csv_keyword: keyword,
      confidence: csvMatch?.confidence || 0,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
