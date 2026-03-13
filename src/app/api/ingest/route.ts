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
  let classification: {
    project: string;
    todos: string[];
    decisions: string[];
    notes: string[];
  };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are Scott's personal project tracker assistant. You process emails Scott forwards to you and add items to his dashboard.

Scott often forwards emails to you with his own instructions at the top, like:
- "Put this under Campgrounds"
- "Add a todo to follow up with this person"
- "Note this for CMO / Storage Syndicator"

CRITICAL RULES:
1. If Scott writes instructions in the email (before a forwarded message), FOLLOW THEM. If he says which project, use that project. If he says to create a todo, CREATE a todo.
2. Read the FULL email content (including any forwarded message) to understand what the todo/note should actually say.
3. Todos should be specific, actionable tasks — not just "follow up" but "Follow up with [person] about [topic]".
4. Notes should be ONE brief sentence summarizing the key info. Do NOT copy raw email text.
5. If Scott says "add a todo" but doesn't specify what, derive the action from the email content.

Projects: ${projectNames.join(", ")}

Email from: ${fromName} <${from}>
Subject: ${subject}
Body:
${textBody.slice(0, 3000)}

Respond with ONLY valid JSON, no other text:
{
  "project": "exact project name from the list above",
  "todos": ["specific actionable tasks"],
  "decisions": ["decisions mentioned, if any"],
  "notes": ["one brief summary sentence per key point — NOT raw email text"]
}

More rules:
- If Scott tells you which project, use EXACTLY that project name from the list
- Pick the BEST matching project otherwise. If nothing fits, use "Personal / Networking"
- Keep notes SHORT — one sentence each, in your own words, not copied from the email
- If the email is just FYI with no actions, todos can be empty but add a brief note
- Never include email headers, addresses, or forwarding boilerplate in notes`,
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
      "CMO / Storage Syndicator": ["storage", "syndicator", "cmo", "self-storage", "investor"],
      Instructure: ["instructure", "canvas", "lms", "learning", "edtech"],
    };

    for (const [project, words] of Object.entries(keywords)) {
      if (words.some((w) => combined.includes(w))) {
        matchedProject = project;
        break;
      }
    }

    classification = {
      project: matchedProject,
      todos: [],
      decisions: [],
      notes: [`[Email from ${fromName || from}] ${subject}: ${textBody.slice(0, 200)}`],
    };
  }

  // Find the project ID
  const matched = projects.find(
    (p) => p.name.toLowerCase() === classification.project.toLowerCase()
  );
  const projectId = matched?.id || projects[projects.length - 1].id; // fallback to last (Personal)

  const supabase = getSupabase();
  const results: { todos: number; decisions: number; notes: number } = {
    todos: 0,
    decisions: 0,
    notes: 0,
  };

  // Insert todos
  for (const text of classification.todos) {
    const { error } = await supabase
      .from("todos")
      .insert({ project_id: projectId, text });
    if (!error) results.todos++;
  }

  // Insert decisions
  for (const text of classification.decisions) {
    const { error } = await supabase
      .from("decisions")
      .insert({ project_id: projectId, text });
    if (!error) results.decisions++;
  }

  // Insert notes
  for (const text of classification.notes) {
    const { error } = await supabase
      .from("notes")
      .insert({ project_id: projectId, text });
    if (!error) results.notes++;
  }

  return NextResponse.json({
    ok: true,
    project: classification.project,
    created: results,
  });
}
