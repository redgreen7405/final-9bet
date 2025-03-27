import { setupLocalScheduler } from "../../../src/lib/localSchduler.js";

export default function handler(req, res) {
  setupLocalScheduler();
  res.status(200).json({ message: "Scheduler started" });
}
