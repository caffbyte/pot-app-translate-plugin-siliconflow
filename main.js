async function translate(text, from, to, options) {
  const { config, setResult, utils } = options;
  const { tauriFetch: fetch } = utils;
  const { apiKey, model } = config;

  const apiUrl = "https://api.siliconflow.cn/v1/chat/completions";

  const body = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.",
      },
      {
        role: "user",
        content: `Translate from ${from} to ${to}: ${text}`,
      },
    ],
    stream: true,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: {
        type: "Json",
        payload: body,
      },
      responseType: ResponseType.Text,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let result = "";
    const lines = response.data.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data:")) continue;

      const jsonStr = line.slice(5).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const data = JSON.parse(jsonStr);
        const contentChunk = data?.choices?.[0]?.delta?.content;
        if (contentChunk) {
          result += contentChunk;

          if (setResult) {
            setResult(result);
            await new Promise((res) => setTimeout(res, 30));
          }
        }
      } catch {
        continue;
      }
    }

    if (!result) {
      throw new Error("No result generated from streaming response.");
    }

    if (setResult) {
      setResult(result);
    }

    return result;
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}
