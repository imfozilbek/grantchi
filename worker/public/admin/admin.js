// Moderation page. Cloudflare Access protects /admin and /api/admin; the browser
// sends its Access cookie with every request, nothing else is needed here.

const TYPES = {
  scholarship: "Stipendiya", grant: "Grant", fellowship: "Fellowship", internship: "Amaliyot",
  exchange: "Almashinuv", competition: "Tanlov", hackathon: "Xakaton", olympiad: "Olimpiada",
  conference: "Konferensiya", summer_school: "Yozgi maktab", course: "Kurs",
  startup_program: "Startap dasturi", volunteering: "Volontyorlik", other: "Boshqa",
};
const FLAGS = {
  no_deadline: "Muddat yo'q", no_official_url: "Rasmiy havola yo'q",
  eligibility_unknown: "Kimlar uchunligi noma'lum", low_confidence: "Model ishonchi past",
};

const list = document.getElementById("list");
const more = document.getElementById("more");
const empty = document.getElementById("empty");
const msg = document.getElementById("msg");
const tpl = document.getElementById("item");
let status = "draft";
let cursor = null;

async function api(path, init) {
  const res = await fetch(path, { credentials: "same-origin", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const lines = (s) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function render(item) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  const c = item.card;
  const meta = node.querySelector(".meta");
  const src = document.createElement("a");
  src.href = item.sourceUrl;
  src.target = "_blank";
  src.rel = "noopener noreferrer";
  src.textContent = item.sourceId;
  meta.append(src, ` · ${item.collectedAt.slice(0, 10)} · ${item.provider}`);
  if (item.reviewedBy) meta.append(` · ${item.reviewedBy}`);

  const flags = node.querySelector(".flags");
  for (const f of item.needsCheck) {
    const s = document.createElement("span");
    s.className = "flag";
    s.textContent = FLAGS[f] ?? f;
    flags.append(s);
  }

  const form = node.querySelector("form");
  const typeSel = form.elements.type;
  for (const [v, label] of Object.entries(TYPES)) typeSel.append(new Option(label, v));
  form.elements.title_uz.value = c.title_uz ?? "";
  form.elements.summary_uz.value = c.summary_uz ?? "";
  typeSel.value = c.type ?? "other";
  form.elements.deadline.value = c.deadline ?? "";
  form.elements.eligibility.value = c.eligibility ?? "unknown";
  form.elements.funding.value = c.funding ?? "unknown";
  form.elements.requirements_uz.value = (c.requirements_uz ?? []).join("\n");
  form.elements.documents_uz.value = (c.documents_uz ?? []).join("\n");
  form.elements.official_url.value = c.official_url ?? "";
  if (item.status !== "draft") node.classList.add("readonly");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const action = e.submitter?.value;
    const f = form.elements;
    const card = {
      ...c,
      title_uz: f.title_uz.value.trim(),
      summary_uz: f.summary_uz.value.trim(),
      type: f.type.value,
      deadline: f.deadline.value || null,
      eligibility: f.eligibility.value,
      funding: f.funding.value,
      requirements_uz: lines(f.requirements_uz.value),
      documents_uz: lines(f.documents_uz.value),
      official_url: f.official_url.value.trim() || null,
    };
    for (const b of form.querySelectorAll("button")) b.disabled = true;
    try {
      await api(`/api/admin/opportunities/${item.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, card }),
      });
      node.remove();
      msg.textContent = action === "approve" ? "Tasdiqlandi." : "Rad etildi.";
      if (!list.children.length && !cursor) empty.hidden = false;
    } catch (err) {
      msg.textContent = `Xato: ${err.message}`;
      for (const b of form.querySelectorAll("button")) b.disabled = false;
    }
  });
  return node;
}

async function load(reset) {
  if (reset) {
    list.replaceChildren();
    cursor = null;
  }
  msg.textContent = "Yuklanmoqda…";
  try {
    const q = new URLSearchParams({ status, limit: "20" });
    if (cursor) q.set("cursor", cursor);
    const data = await api(`/api/admin/opportunities?${q}`);
    for (const item of data.items) list.append(render(item));
    cursor = data.nextCursor;
    more.hidden = !cursor;
    empty.hidden = list.children.length > 0;
    msg.textContent = "";
  } catch (err) {
    msg.textContent = `Xato: ${err.message}`;
  }
}

document.getElementById("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-status]");
  if (!b) return;
  for (const x of e.currentTarget.children) x.classList.toggle("active", x === b);
  status = b.dataset.status;
  load(true);
});
more.addEventListener("click", () => load(false));

api("/api/admin/me").then((d) => (document.getElementById("me").textContent = d.email)).catch(() => {});
load(true);
