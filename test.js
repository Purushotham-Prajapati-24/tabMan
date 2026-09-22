import { triageTicket, decidePriority } from "./triage.js";

const samples = [
  "I've been charged twice for my subscription this month and support hasn't replied in three days. This is ridiculous, I want a refund now.",
  "Hi, quick question — how do I export my data to CSV? No rush, just curious.",
  "Our production dashboard has been down for 20 minutes and we're losing sales. Please help immediately!",
];

for (const message of samples) {
  const result = await triageTicket(message);
  console.log("---");
  console.log(message);
  console.log(result);
  console.log("priority:", decidePriority(result));
}
