import { handleWinRequest } from "./winner-logic";
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "https://final-9bet-rkt2.vercel.app/"); // Use your actual domain in production
    console.log(url);
    const period = url.searchParams.get("period");

    console.log(period, "period");

    if (!period) {
      return res.status(400).json({ error: "Period parameter is required" });
    }

    const result = await handleWinRequest(period);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in winner API:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
