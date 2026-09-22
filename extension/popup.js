const taskEl = document.getElementById("task");
const scanBtn = document.getElementById("scan");
const closeBtn = document.getElementById("closeBtn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const serverUrlEl = document.getElementById("serverUrl");
const closeSection = document.getElementById("closeSection");
const keepSection = document.getElementById("keepSection");
const closeList = document.getElementById("closeList");
const keepList = document.getElementById("keepList");

let currentTabs = []; // [{id, title, url, favIconUrl, relevant, keep}]

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderRow(tab) {
  const li = document.createElement("li");
  const tagClass = tab.keep ? "keep" : "close";
  const tagText = tab.keep ? "keep" : "close";
  li.innerHTML =
    '<img class="fav" src="' + escapeHtml(tab.favIconUrl || "") + '" onerror="this.style.visibility=\'hidden\'" />' +
    '<div class="info">' +
      '<div class="title" title="' + escapeHtml(tab.title) + '">' + escapeHtml(tab.title) + "</div>" +
      '<div class="url">' + escapeHtml(tab.url) + "</div>" +
    "</div>" +
    '<span class="tag ' + tagClass + '">' + tagText + " " + Math.round(tab.relevant * 100) + "%</span>";
  return li;
}

function renderResults() {
  const toClose = currentTabs.filter((t) => !t.keep);
  const toKeep = currentTabs.filter((t) => t.keep);

  closeList.innerHTML = "";
  keepList.innerHTML = "";
  toClose.forEach((t) => closeList.appendChild(renderRow(t)));
  toKeep.forEach((t) => keepList.appendChild(renderRow(t)));

  closeSection.style.display = toClose.length ? "block" : "none";
  keepSection.style.display = toKeep.length ? "block" : "none";
  closeBtn.textContent = "Close " + toClose.length + " unrelated tab" + (toClose.length === 1 ? "" : "s");
  closeBtn.disabled = toClose.length === 0;

  summaryEl.textContent =
    toKeep.length + " related, " + toClose.length + " unrelated" +
    (currentTabs.length && currentTabs.some((t) => t.skipped) ? " (some tabs skipped)" : "");
}

scanBtn.addEventListener("click", async () => {
  const task = taskEl.value.trim();
  if (!task) {
    statusEl.textContent = "Describe what you're working on first.";
    return;
  }

  scanBtn.disabled = true;
  statusEl.textContent = "Reading open tabs...";
  summaryEl.textContent = "";
  closeSection.style.display = "none";
  keepSection.style.display = "none";

  try {
    const rawTabs = await chrome.tabs.query({ currentWindow: true });
    const eligible = rawTabs.filter(
      (t) => t.url && /^https?:\/\//.test(t.url)
    );

    if (eligible.length === 0) {
      statusEl.textContent = "No closable tabs found in this window.";
      scanBtn.disabled = false;
      return;
    }

    statusEl.textContent = "Asking Jev about " + eligible.length + " tab(s)...";

    const serverUrl = serverUrlEl.value.trim().replace(/\/$/, "");
    const res = await fetch(serverUrl + "/api/tabs-relevance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task,
        tabs: eligible.map((t) => ({ id: t.id, title: t.title, url: t.url })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || "request failed");

    const byId = new Map(data.results.map((r) => [r.id, r]));
    currentTabs = eligible.map((t) => {
      const r = byId.get(t.id);
      return {
        id: t.id,
        title: t.title,
        url: t.url,
        favIconUrl: t.favIconUrl,
        relevant: r ? r.relevant : 1,
        keep: r ? r.keep : true,
      };
    });

    statusEl.textContent = "Done.";
    renderResults();
  } catch (err) {
    statusEl.textContent = "Error: " + err.message + " (is the server running at " + serverUrlEl.value + "?)";
  } finally {
    scanBtn.disabled = false;
  }
});

closeBtn.addEventListener("click", async () => {
  const ids = currentTabs.filter((t) => !t.keep).map((t) => t.id);
  if (ids.length === 0) return;
  closeBtn.disabled = true;
  closeBtn.textContent = "Closing...";
  await chrome.tabs.remove(ids);
  currentTabs = currentTabs.filter((t) => t.keep);
  renderResults();
  statusEl.textContent = "Closed " + ids.length + " tab(s).";
});
