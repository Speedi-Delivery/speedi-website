const APP_URL = "https://apps.apple.com/us/app/speedi-delivery/id6468661813";

/* ---------- Scroll reveal ---------- */
const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
        if (e.target.closest(".hero-stat")) startStatCounter();
      }
    }
  },
  { threshold: 0.18 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* ---------- Mobile nav ---------- */
const burger = document.querySelector(".nav-burger");
const links = document.querySelector(".nav-links");
if (burger) burger.addEventListener("click", () => links.classList.toggle("open"));

/* ---------- QR code (desktop only) ---------- */
const qrCard = document.getElementById("qrCard");
if (qrCard) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    qrCard.remove();
  } else {
    document.getElementById("qrImg").src =
      "https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=0d0d0d&bgcolor=ffffff&data=" +
      encodeURIComponent(APP_URL);
  }
}

/* ---------- Animated 8:47 counter + ring ---------- */
let statStarted = false;
function startStatCounter() {
  if (statStarted) return;
  statStarted = true;
  const ring = document.querySelector(".stat-ring");
  const minEl = document.getElementById("statMin");
  const secEl = document.getElementById("statSec");
  if (!minEl) return;
  ring.classList.add("go");
  const target = 8 * 60 + 47; // 527 seconds
  const dur = 2200;
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const s = Math.round(target * eased);
    minEl.textContent = Math.floor(s / 60);
    secEl.textContent = String(s % 60).padStart(2, "0");
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- Count-up price totals ---------- */
const priceObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      priceObserver.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || "$";
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / 1500, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(2);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count]").forEach((el) => priceObserver.observe(el));

/* ---------- Interactive order timeline ---------- */
const slider = document.getElementById("tlSlider");
if (slider) {
  const progress = document.getElementById("tlProgress");
  const rider = document.getElementById("tlRider");
  const status = document.getElementById("tlStatus");
  const playBtn = document.getElementById("tlPlay");
  const stops = [...document.querySelectorAll(".tl-stop")];
  const stages = [
    { at: 0, label: "Order placed ✅" },
    { at: 20, label: "Packed and ready 📦" },
    { at: 45, label: "On its way 🛵" },
    { at: 100, label: "Delivered! Enjoy 🎉" },
  ];
  let playing = null;

  function setProgress(v) {
    slider.value = v;
    progress.style.width = v + "%";
    rider.style.left = v + "%";
    let current = stages[0];
    stops.forEach((stop, i) => {
      const hit = v >= stages[i].at - 0.5;
      stop.classList.toggle("hit", hit);
      if (hit) current = stages[i];
    });
    status.textContent = current.label;
  }

  slider.addEventListener("input", () => {
    stopPlay();
    setProgress(+slider.value);
  });

  function stopPlay() {
    if (playing) {
      cancelAnimationFrame(playing);
      playing = null;
      playBtn.textContent = "▶ Play order";
    }
  }

  playBtn.addEventListener("click", () => {
    if (playing) return stopPlay();
    playBtn.textContent = "⏸ Pause";
    const t0 = performance.now();
    const from = +slider.value >= 100 ? 0 : +slider.value;
    const dur = 6000 * (1 - from / 100);
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      setProgress(from + (100 - from) * p);
      if (p < 1) playing = requestAnimationFrame(tick);
      else stopPlay();
    })(t0);
  });

  setProgress(0);

  // Nudge the timeline forward as it scrolls into view the first time
  const tlSection = document.querySelector(".timeline");
  const tlObs = new IntersectionObserver(
    (es) => {
      if (es[0].isIntersecting) {
        tlObs.disconnect();
        setTimeout(() => playBtn.click(), 600);
      }
    },
    { threshold: 0.5 }
  );
  tlObs.observe(tlSection);
}

/* ---------- Click-spawn biker ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest("a, button, input, textarea, select, label, form")) return;
  const biker = document.createElement("div");
  biker.className = "click-biker";
  biker.textContent = "🚴";
  biker.style.top = e.clientY - 24 + "px";
  biker.style.left = e.clientX - 24 + "px";
  document.body.appendChild(biker);
  const dist = window.innerWidth - e.clientX + 120;
  const anim = biker.animate(
    [
      { transform: "scaleX(-1) translateX(0)" },
      { transform: `scaleX(-1) translateX(${-dist}px)` },
    ],
    { duration: Math.max(600, dist * 1.6), easing: "ease-in" }
  );
  anim.onfinish = () => biker.remove();
});

/* ---------- Forms (email via FormSubmit) ---------- */
document.querySelectorAll("form.form").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = form.querySelector("button[type=submit]");
    const note = form.querySelector(".form-note");
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const data = new FormData(form);
      data.append("_subject", form.id === "applyForm" ? "New Speedi job application" : "New Speedi contact message");
      const res = await fetch("https://formsubmit.co/ajax/contact@speedi.delivery", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!res.ok) throw new Error();
      note.hidden = false;
      form.querySelectorAll("input, textarea, select").forEach((f) => (f.disabled = true));
      btn.textContent = "Sent ⚡";
    } catch {
      // Fallback: open the user's mail client pre-filled
      const body = [...new FormData(form).entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
      location.href = "mailto:contact@speedi.delivery?subject=" +
        encodeURIComponent(form.id === "applyForm" ? "Speedi job application" : "Speedi contact") +
        "&body=" + encodeURIComponent(body);
      btn.disabled = false;
      btn.textContent = "Send message";
    }
  });
});
