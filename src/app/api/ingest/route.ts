import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

// Postmark inbound webhook — no dashboard auth, uses INGEST_TOKEN instead
export async function POST(request: NextRequest) {
  // Verify ingest token (passed as query param or header)
  const token = process.env.INGEST_TOKEN;
  if (token) {
    const url = request.nextUrl || new URL(request.url);
    const paramToken = url.searchParams.get("token");
    const headerToken = request.headers.get("x-ingest-token");
    if (paramToken !== token && headerToken !== token) {
      return NextResponse.json(
        { error: "Unauthorized", debug: { hasToken: !!token, paramToken: paramToken?.slice(0, 5), headerToken: headerToken?.slice(0, 5) } },
        { status: 401 }
      );
    }
  }

  const body = await request.json();

  // Postmark inbound fields
  const from = body.FromFull?.Email || body.From || "unknown";
  const fromName = body.FromFull?.Name || body.FromName || "";
  const subject = body.Subject || "(no subject)";
  const textBody = body.TextBody || body.HtmlBody || "";

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
          content: `You are a project tracker assistant. Given an email, classify it into one of these projects and extract action items.

Projects: ${projectNames.join(", ")}

Email from: ${fromName} <${from}>
Subject: ${subject}
Body:
${textBody.slice(0, 3000)}

Respond with ONLY valid JSON, no other text:
{
  "project": "exact project name from the list above",
  "todos": ["action items to add as todos, if any"],
  "decisions": ["decisions mentioned, if any"],
  "notes": ["key information worth noting, if any — keep brief"]
}

Rules:
- Pick the BEST matching project. If nothing fits, use "Personal / Networking"
- Extract real action items, not fluff
- Keep each item to one clear sentence
- If the email is just FYI with no actions, todos can be empty but add a note summarizing it
- notes should capture the essential info so Scott doesn't have to re-read the email`,
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
