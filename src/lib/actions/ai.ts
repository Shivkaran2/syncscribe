"use server";

import { auth } from "@/lib/auth";
import { aiActionSchema } from "@/lib/validators";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { ActionResult } from "@/lib/actions/types";
import type { AIActionInput } from "@/lib/validators";

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

export interface AIResult {
  result: string;
  action: string;
  originalLength: number;
  resultLength: number;
}

// Run an AI writing action on a selection of text.
export async function runAiAction(
  input: AIActionInput
): Promise<ActionResult<AIResult>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = aiActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { action, text, language } = parsed.data;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      ok: false,
      error: "AI service is not configured. Please add a Gemini API key.",
    };
  }

  let systemPrompt = AI_PROMPTS[action];
  if (action === "translate" && language) {
    systemPrompt = `Translate the following text to ${language}. Return only the translation, nothing else.`;
  }

  try {
    const { text: result } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: text,
    });

    return {
      ok: true,
      data: {
        result,
        action,
        originalLength: text.length,
        resultLength: result.length,
      },
    };
  } catch (error) {
    console.error("AI error:", error);
    return { ok: false, error: "AI service error. Please try again." };
  }
}
