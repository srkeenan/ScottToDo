import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

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

// Postmark inbound webhook — no dashboard auth, uses INGEST_TOKEN instead
export async function POST(request: NextRequest) {
  // Verify ingest token (passed as query param or header)
  const token = process.env.INGEST_TOKEN?.trim();
  if (token) {
    const url = request.nextUrl || new URL(request.url);
    const paramToken = url.searchParams.get("token")?.trim();
    const headerToken = request.headers.get("x-ingest-token")?.trim();
    if (paramToken !== token && headerToken !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json();

  // Postmark inbound fields
  const from = body.FromFull?.Email || body.From || "unknown";
  const fromName = body.FromFull?.Name || body.FromName || "";
  const subject = body.Subject || "(no subject)";
  let textBody = body.TextBody || body.HtmlBody || "";

  // Strip Gmail forwarding noise — extract just the user's message + forwarded content
  textBody = cleanForwardedEmail(textBody);

  // Detect explicit signals from Scott
  const subjectLower = subject.toLowerCase();
  const hasTodoSignal = /\btodo\b/i.test(subject);

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
          content: `You are Scott's personal project tracker assistant. You process emails Scott forwards to you and add items to his dashboard.

Scott often forwards emails with his own instructions at the top, like:
- "Put this under Campgrounds"
- "Add a todo to follow up with this person"
- "Todos to add: 1. ... 2. ..."

EXPLICIT SIGNALS FROM SCOTT:
${hasTodoSignal ? `- The subject contains "todo" — Scott DEFINITELY wants todos created from this email. Extract actionable tasks and create them as todos.` : "- No explicit todo signal in subject."}
${aiInstruction ? `- Scott included a direct AI instruction: "${aiInstruction}"\n  FOLLOW THIS INSTRUCTION EXACTLY. It takes highest priority over all other rules.` : "- No direct AI instruction found."}

CRITICAL RULES:
1. If Scott writes instructions in the email (before a forwarded message), FOLLOW THEM. His instructions override everything else.
2. If Scott starts an email with "AI - [instruction]", follow that instruction precisely. For example, "AI - extract key dates and create a note under Hearthfire" means do exactly that.
3. Read the FULL email content (including any forwarded message) to understand context.
4. Todos should be specific, actionable tasks — not just "follow up" but "Follow up with [person] about [topic]".
5. Notes should be ONE brief sentence summarizing key info, in your own words.
6. If Scott says "add a todo" but doesn't specify what, derive the action from the email content.
7. Items can span MULTIPLE projects. Each item gets its own project assignment.

SKIP RULES — return skip:true when:
- The email is automated/marketing (newsletters, promotional offers, system notifications)
- The email is a system alert (domain activation, account notifications, password resets, shipping confirmations with no action needed)
- Scott is just CC'd on a thread and the content has no action items or useful info for him
- The email content has no actionable items AND no information worth noting
- Gmail forwarding confirmation/verification messages

NOTE RULES — be selective:
- If Scott's email is clearly just instructions to create todos (e.g., "Todos to add: ..."), do NOT also create a companion note. The todos ARE the output.
- Only create notes when there is genuinely useful reference information BEYOND any action items.
- A note should capture info Scott would want to look up later, not just restate what a todo already says.
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
    { "project": "project name from list", "type": "todo", "text": "specific actionable task" },
    { "project": "project name from list", "type": "note", "text": "brief summary sentence" }
  ]
}

Rules for Format 2:
- "project" should match one of the project names above. Fuzzy matching is OK — use your best guess if Scott abbreviates or misspells (e.g. "hearthfire" matches "Hearthfire fCMO", "personal" matches "Personal / Networking").
- "type" must be "todo", "decision", or "note"
- Each item can have a DIFFERENT project — match each item to its best project
- If nothing fits, use "Personal / Networking"
- Keep note text SHORT — one sentence, your own words
- Never include email headers, addresses, or forwarding boilerplate in text`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    classification = JSON.parse(text);
  } catch (err) {
    // Fallback: keyword matching if Claude API fails
    const combined = `${subject} ${textBody}`.toLowerCase();
    let matchedProject = "Personal / Networking";

    const keywords: Record<string, string[]> = {
      Campgrounds: ["campground", "campsite", "rv", "hookup", "glamping", "michigan camp"],
      "Hearthfire fCMO": ["hearthfire", "fcmo", "fractional cmo"],
      Instructure: ["instructure", "canvas", "lms", "learning", "edtech"],
    };

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
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: classification.reason,
      created: { todos: 0, decisions: 0, notes: 0 },
    });
  }

  // Resolve project IDs per item
  const classificationItems = (classification as { items: Array<{ project: string; type: "todo" | "decision" | "note"; text: string }> }).items;
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
    };
  });

  // Insert items
  const supabase = getSupabase();
  const results = { todos: 0, decisions: 0, notes: 0 };
  const projectsUsed = new Set<string>();

  for (const item of resolvedItems) {
    const table = item.type === "todo" ? "todos" : item.type === "decision" ? "decisions" : "notes";
    const { error } = await supabase
      .from(table)
      .insert({ project_id: item.project_id, text: item.text });
    if (!error) {
      results[`${item.type}s` as keyof typeof results]++;
      projectsUsed.add(item.project_name);
    }
  }

  return NextResponse.json({
    ok: true,
    skipped: false,
    projects: Array.from(projectsUsed),
    created: results,
  });
}
