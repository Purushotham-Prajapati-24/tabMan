import { scoreTabRelevance } from "./tab-relevance.js";

const task = "Debugging checkout payment bug";
const tabs = [
  { id: 1, title: "Stripe Documentation - Webhook signatures", url: "https://stripe.com/docs/webhooks" },
  { id: 2, title: "YouTube - Funny Cat Videos", url: "https://youtube.com/watch?v=123" },
  { id: 3, title: "GitHub - Checkout service PR #42", url: "https://github.com/myorg/checkout/pull/42" },
];

console.log("Testing tab relevance scoring for task:", task);
try {
  const result = await scoreTabRelevance(task, tabs);
  console.log("Results:");
  result.results.forEach((t) => {
    console.log(`- [${t.keep ? "KEEP" : "CLOSE"}] ${t.title} (${Math.round(t.relevant * 100)}%)`);
  });
} catch (err) {
  console.error("Test error:", err.message);
}
