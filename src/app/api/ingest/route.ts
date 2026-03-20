import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

// Block ingestion in demo mode
const IS_DEMO = process.env.DEMO_MODE === "true";

// Strip Gmail forwarding junk: headers, repeated addresses, confirmation text, etc.
function cleanForwardedEmail(text: string): string {
  // Remove Gmail forwarding confirmation boilerplate
  text = text.replace(
    /.*has requested to automatically forward mail.*?click the link below[^]*?(?=\n\n|\n[A-Z])/gi,
    ""
  );

  // If there's a "---------- Forwarded message ----------" block, focus on content after it
  const fwdMatch = text.match(
    /-{5,}\s*Forwarded message\s*-{5,}([\s\S]*)/i
  );
  if (fwdMatch) {
    // Extract the forwarded content, skip the From/Date/Subject/To header block
    let forwarded = fwdMatch[1];
    forwarded = forwarded.replace(
      /^\s*(From|Date|Subject|To|Cc|Bcc):.*$/gim,
      ""
    );
    // Also grab anything the user wrote BEFORE the forwarded message (their instructions)
    const beforeFwd = text.slice(0, text.indexOf(fwdMatch[0])).trim();
    text = beforeFwd ? `${beforeFwd}\n\n${forwarded.trim()}` : forwarded.trim();
  }

  // Remove excessive blank lines
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

// Owner email addresses — only process emails from these senders
// (or emails where admin@ is in To and sender is one of these)
const OWNER_EMAILS = (process.env.OWNER_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@bermanroad.com").trim().toLowerCase();

// Postmark inbound webhook — no dashboard auth, uses INGEST_TOKEN instead
export async function POST(request: NextRequest) {
  if (IS_DEMO) {
    return NextResponse.json(
      { error: "Email ingestion is not available in demo mode" },
      { status: 403 }
    );
  }

  // Verify ingest token (passed as query param or header)
  const token = process.env.INGEST_TOKEN?.trim();
  if (token) {
    const url = request.nextUrl || new URL(request.url);
    const paramToken = url.searchParams.get("token")?.trim();
    const headerToken = request.headers.get("x-ingest-token")?.trim();
    if (paramToken !== token && headerToken !== token) {
      console.log("[ingest] ❌ Auth failed — token mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json();
  console.log(`[ingest] 📨 From: ${body.FromFull?.Email || body.From} | Subject: ${body.Subject}`);

  // Postmark inbound fields
  const from = body.FromFull?.Email || body.From || "unknown";
  const fromLower = from.toLowerCase();
  const fromName = body.FromFull?.Name || body.FromName || "";
  const subject = body.Subject || "(no subject)";
  let textBody = body.TextBody || body.HtmlBody || "";

  // --- SENDER FILTERING ---
  // Check if sender is the owner
  const isFromOwner = OWNER_EMAILS.length > 0 ? OWNER_EMAILS.includes(fromLower) : true;

  // Check if admin@ is in To vs Cc
  const toAddresses = (body.ToFull || []).map((t: { Email: string }) => t.Email.toLowerCase());
  const ccAddresses = (body.CcFull || []).map((c: { Email: string }) => c.Email.toLowerCase());
  const adminInTo = toAddresses.includes(ADMIN_EMAIL);
  const adminInCc = ccAddresses.includes(ADMIN_EMAIL);

  // Also check Delivered-To header (for forwarded emails)
  const deliveredTo = (body.Headers || []).find((h: { Name: string; Value: string }) => h.Name === "Delivered-To")?.Value?.toLowerCase() || "";
  const deliveredToAdmin = deliveredTo === ADMIN_EMAIL;

  // RULE: If sender is NOT the owner, skip entirely
  if (!isFromOwner) {
    console.log(`[ingest] ⏭️ Skipped: sender ${from} is not an owner email`);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `Sender ${from} is not a recognized owner email`,
      created: { todos: 0, decisions: 0, notes: 0 },
    });
  }

  // RULE: If admin@ is only in CC (not To), require an AI instruction
  // This means the owner CC'd admin@ on a thread — only process if they included "AI - ..." somewhere
  const aiInstructionCheckBody = textBody.match(/\bAI\s*[-–—:]\s*.+/i);
  if (!adminInTo && !deliveredToAdmin && adminInCc && !aiInstructionCheckBody) {
    console.log(`[ingest] ⏭️ Skipped: admin@ is CC'd but no AI instruction found`);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "admin@ is CC'd without AI instruction — skipping",
      created: { todos: 0, decisions: 0, notes: 0 },
    });
  }

  // Strip Gmail forwarding noise — extract just the user's message + forwarded content
  textBody = cleanForwardedEmail(textBody);

  // Detect explicit signals from Scott
  const subjectLower = subject.toLowerCase();
  const hasTodoSignal = /\btodo\b/i.test(subject) || /\btodo\b/i.test(textBody);

  // Check for "AI - " instructions at the start of the email body (before forwarded content)
  const aiInstructionMatch = textBody.match(/^\s*AI\s*[-–—:]\s*(.+?)(?:\n\n|\n-{3,}|\n_{3,}|$)/i);
  const aiInstruction = aiInstructionMatch ? aiInstructionMatch[1].trim() : null;

  // Get project list from DB
  const { data: projects } = await getSupabase()
    .from("projects")
    .select("id, name")
    .order("sort_order");

  if (!projects || projects.length === 0) {
    return NextResponse.json({ error: "No projects found" }, { status: 500 });
  }

  const projectNames = projects.map((p) => p.name);

  // Use Claude to classify and extract action items
  type ClassificationResult =
    | { skip: true; reason: string }
    | {
        items: Array<{
          project: string;
          type: "todo" | "decision" | "note";
          text: string;
          due_date?: string | null;
          priority?: boolean;
        }>;
      };

  let classification: ClassificationResult;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a personal project tracker assistant. You process emails the user forwards to you and add items to their dashboard.

The user often forwards emails with instructions at the top, like:
- "Put this under [project]"
- "Add a todo to follow up with this person"
- "Todos to add: 1. ... 2. ..."

EXPLICIT SIGNALS:
${hasTodoSignal ? `- The word "todo" appears in the subject or body — the user DEFINITELY wants todos created from this email. Use BOTH the subject line and the body to understand what the todo should be. The subject often contains the task description while the body may indicate the project, or vice versa. NEVER skip an email that contains the word "todo".` : "- No explicit todo signal in subject or body."}
${aiInstruction ? `- The user included a direct AI instruction: "${aiInstruction}"\n  FOLLOW THIS INSTRUCTION EXACTLY. It takes highest priority over all other rules. If the instruction mentions a due date (e.g., "set due date 4/15" or "due by March 20"), include a "due_date" field in YYYY-MM-DD format. If it says "high priority" or "important", set "priority": true.` : "- No direct AI instruction found."}

CRITICAL RULES:
1. If the user writes instructions in the email (before a forwarded message), FOLLOW THEM.
2. If the email starts with "AI - [instruction]", follow that instruction precisely.
3. Read the FULL email content (including any forwarded message) to understand context.
4. Todos should be specific, actionable tasks — not just "follow up" but "Follow up with [person] about [topic]".
5. Notes should be ONE brief sentence summarizing key info, in your own words.
6. If the user says "add a todo" but doesn't specify what, derive the action from the email content.
7. Items can span MULTIPLE projects. Each item gets its own project assignment.
8. If a date is mentioned in the instructions (e.g., "due 4/15", "by March 20", "deadline next Friday"), include "due_date" in YYYY-MM-DD format. Current year is ${new Date().getFullYear()}.
9. If "priority", "urgent", "important", or "!" is mentioned, set "priority": true.

SKIP RULES — return skip:true when:
- The email is automated/marketing (newsletters, promotional offers, system notifications)
- The email is a system alert (domain activation, account notifications, password resets, shipping confirmations with no action needed)
- The user is just CC'd on a thread and the content has no action items or useful info
- The email content has no actionable items AND no information worth noting
- Gmail forwarding confirmation/verification messages

NOTE RULES — be selective:
- If the email is clearly just instructions to create todos (e.g., "Todos to add: ..."), do NOT also create a companion note. The todos ARE the output.
- Only create notes when there is genuinely useful reference information BEYOND any action items.
- A note should capture info the user would want to look up later, not just restate what a todo already says.
- If there is nothing worth noting or acting on, use skip instead of creating a low-value note.

Projects: ${projectNames.join(", ")}

Email from: ${fromName} <${from}>
Subject: ${subject}
Body:
${textBody.slice(0, 3000)}

Respond with ONLY valid JSON (no markdown, no backticks), in one of two formats:

Format 1 — Skip this email:
{ "skip": true, "reason": "brief explanation" }

Format 2 — Create items:
{
  "items": [
    { "project": "project name from list", "type": "todo", "text": "specific actionable task", "due_date": "YYYY-MM-DD or null", "priority": false }
  ]
}

Rules for Format 2:
- "project" should match one of the project names above. Fuzzy matching is OK — use your best guess if the user abbreviates or misspells.
- "type" must be "todo", "decision", or "note"
- "due_date" is optional, only include if a date is explicitly mentioned. Use YYYY-MM-DD format.
- "priority" is optional, defaults to false. Set true only if urgency is indicated.
- Each item can have a DIFFERENT project — match each item to its best project
- If nothing fits, use the last project in the list as a catch-all
- Keep note text SHORT — one sentence, your own words
- Never include email headers, addresses, or forwarding boilerplate in text`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    classification = JSON.parse(text);
    console.log(`[ingest] 🤖 Classification:`, JSON.stringify(classification));
  } catch (err) {
    console.error(`[ingest] ⚠️ Claude API failed, using fallback:`, err);
    // Fallback: keyword matching if Claude API fails
    const combined = `${subject} ${textBody}`.toLowerCase();
    let matchedProject = "Personal / Networking";

    // Fallback uses project names from DB for keyword matching
    const keywords: Record<string, string[]> = {};
    for (const p of projects) {
      keywords[p.name] = p.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    }

    for (const [project, words] of Object.entries(keywords)) {
      if (words.some((w) => combined.includes(w))) {
        matchedProject = project;
        break;
      }
    }

    classification = {
      items: [{
        project: matchedProject,
        type: "note" as const,
        text: `[Email from ${fromName || from}] ${subject}: ${textBody.slice(0, 200)}`,
      }],
    };
  }

  // Handle skip
  if ("skip" in classification && classification.skip) {
    console.log(`[ingest] ⏭️ Skipped: ${classification.reason}`);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: classification.reason,
      created: { todos: 0, decisions: 0, notes: 0 },
    });
  }

  // Resolve project IDs per item
  const classificationItems = (classification as { items: Array<{ project: string; type: "todo" | "decision" | "note"; text: string; due_date?: string | null; priority?: boolean }> }).items;
  const fallbackProjectId = projects[projects.length - 1].id;

  const resolvedItems = (classificationItems || []).map((item) => {
    // Try exact match first, then fuzzy (partial) match
    const exact = projects.find(
      (p) => p.name.toLowerCase() === item.project.toLowerCase()
    );
    const fuzzy = !exact
      ? projects.find((p) =>
          p.name.toLowerCase().includes(item.project.toLowerCase()) ||
          item.project.toLowerCase().includes(p.name.toLowerCase().split(/\s+/)[0])
        )
      : null;
    const matched = exact || fuzzy;
    return {
      project_id: matched?.id || fallbackProjectId,
      project_name: matched?.name || item.project,
      type: item.type,
      text: item.text,
      due_date: item.due_date || null,
      priority: item.priority || false,
    };
  });

  // Insert items
  const supabase = getSupabase();
  const results = { todos: 0, decisions: 0, notes: 0 };
  const projectsUsed = new Set<string>();

  for (const item of resolvedItems) {
    const table = item.type === "todo" ? "todos" : item.type === "decision" ? "decisions" : "notes";
    const insertData: Record<string, unknown> = { project_id: item.project_id, text: item.text };
    if (item.type === "todo") {
      if (item.due_date) insertData.due_date = item.due_date;
      if (item.priority) insertData.priority = item.priority;
    }
    const { error } = await supabase
      .from(table)
      .insert(insertData);
    if (!error) {
      results[`${item.type}s` as keyof typeof results]++;
      projectsUsed.add(item.project_name);
    } else {
      console.error(`[ingest] ❌ DB insert failed for ${item.type} in ${table}:`, error.message);
    }
  }

  console.log(`[ingest] ✅ Created: ${results.todos} todos, ${results.decisions} decisions, ${results.notes} notes | Projects: ${Array.from(projectsUsed).join(", ")}`);
  return NextResponse.json({
    ok: true,
    skipped: false,
    projects: Array.from(projectsUsed),
    created: results,
  });
}
