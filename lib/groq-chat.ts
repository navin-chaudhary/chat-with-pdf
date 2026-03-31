import Groq from "groq-sdk";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function answerWithContext(
  question: string,
  contextChunks: string[],
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const groq = new Groq({ apiKey: key });
  const context = contextChunks.join("\n\n---\n\n");

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You answer questions about the user's document (e.g. resume, report, contract). Use only the provided excerpts. " +
          "If excerpts contain partial information, give the best faithful answer from what is present and quote short phrases when helpful. " +
          "Only say the information is not in the document if the excerpts truly do not support any useful answer. " +
          "Be concise and accurate. " +
          "Format every reply in Markdown: use ## for section titles when helpful, **bold** for key terms, bullet or numbered lists for multiple points, and short `inline code` only for exact labels from the document.",
      },
      {
        role: "user",
        content: `Document excerpts:\n${context}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Groq");
  return text;
}
