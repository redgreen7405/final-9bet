// /src/pages/api/winner.js
import { handleWinRequest } from "./winner-logic";
export const runtime = "edge";
export default async function handler(req, res) {
  try {
    const { period } = req.query;

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
