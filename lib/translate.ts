let translateInProgress = false;

export async function translateToFrench(
  nameEn: string,
  descriptionEn: string,
): Promise<{ nameFr: string; descriptionFr: string }> {
  if (translateInProgress) {
    console.warn("[translate] Duplicate request skipped");
    return { nameFr: "", descriptionFr: "" };
  }

  translateInProgress = true;

  try {
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("[translate] Gemini API key is not configured");
      return { nameFr: "", descriptionFr: "" };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate to French. Return ONLY this JSON, nothing else: {"nameFr":"[translated name]","descriptionFr":"[translated description]"}\n\nName: ${nameEn}\nDescription: ${descriptionEn || "none"}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 800,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[translate] API request failed with status ${response.status}`,
      );
      return { nameFr: "", descriptionFr: "" };
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return {
        nameFr: parsed.nameFr ?? "",
        descriptionFr: parsed.descriptionFr ?? "",
      };
    } catch {
      console.error("[translate] Failed to parse the API response");
      return { nameFr: "", descriptionFr: "" };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      console.warn("[translate] Translation request timed out");
    } else {
      console.error("[translate] Translation request failed", e);
    }
    return { nameFr: "", descriptionFr: "" };
  } finally {
    translateInProgress = false;
  }
}
