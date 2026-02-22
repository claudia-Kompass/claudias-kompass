export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: "Sag nur: Test erfolgreich."
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      debug: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
