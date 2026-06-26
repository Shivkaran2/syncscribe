import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiActionSchema } from "@/lib/validators";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const AI_PROMPTS: Record<string, string> = {
  improve:
    "Improve the following text to make it clearer, more engaging, and better written. Keep the same meaning and tone. Return only the improved text, nothing else.",
  summarize:
    "Summarize the following text concisely while capturing all key points. Return only the summary, nothing else.",
  expand:
    "Expand and elaborate on the following text, adding more detail and depth. Maintain the original tone. Return only the expanded text, nothing else.",
  fix_grammar:
    "Fix all grammar, spelling, and punctuation errors in the following text. Keep the same meaning. Return only the corrected text, nothing else.",
  simplify:
    "Simplify the following text to make it easier to understand. Use shorter sentences and simpler words. Return only the simplified text, nothing else.",
  translate:
    "Translate the following text to the requested language. Return only the translation, nothing else.",
  explain:
    "Explain the following text in simple terms, as if explaining to someone unfamiliar with the topic. Return only the explanation, nothing else.",
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = aiActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, text, language } = parsed.data;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured. Please add a Gemini API key." },
        { status: 503 }
      );
    }

    let systemPrompt = AI_PROMPTS[action];

    if (action === "translate" && language) {
      systemPrompt = `Translate the following text to ${language}. Return only the translation, nothing else.`;
    }

    const { text: result } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: text,
    });

    return NextResponse.json({
      result,
      action,
      originalLength: text.length,
      resultLength: result.length,
    });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json(
      { error: "AI service error. Please try again." },
      { status: 500 }
    );
  }
}
