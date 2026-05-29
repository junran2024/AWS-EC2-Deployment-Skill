import fs from 'fs';

async function analyzeLogs() {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    console.error("Error: MIMO_API_KEY environment variable is not set.");
    process.exit(1);
  }

  // Read logs from stdin or a file
  const logs = fs.readFileSync(0, 'utf-8'); 

  if (!logs.trim()) {
    console.error("No logs provided for analysis.");
    process.exit(1);
  }

  console.log("Analyzing logs with MiMo LLM...\n");

  try {
    const response = await fetch("https://token-plan-sgp.xiaomimimo.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mimo-v2.5-pro",
        messages: [
          {
            role: "system",
            content: "You are MiMo, an AI assistant developed by Xiaomi. Your task is to analyze the following server logs. Please identify and summarize any errors, warnings, abnormal behaviors, or performance issues. Keep your analysis concise and helpful."
          },
          {
            role: "user",
            content: `Please analyze these logs:\n\n${logs}`
          }
        ],
        max_completion_tokens: 1024,
        temperature: 1.0,
        top_p: 0.95,
        stream: false,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error.message);
    } else {
      console.log(data.choices[0].message.content);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

analyzeLogs();
