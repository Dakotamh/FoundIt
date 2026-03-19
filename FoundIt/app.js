// Found IT - front-end prototype (no database yet)
const state = {
  user: null, // {name, email, role: "user"|"admin"}
  route: "home",
  selectedItemId: null,
  afterLoginRoute: null,
  reportLostStep: "main", // "main" or "form"
  reportFoundStep: "main", // "main" or "form"

  filters: { q: "", type: "All", category: "All" },
  dashboardBuildingFilter: "All",

  claims: [],

  reports: [
    {
      id: "r1",
      type: "Found",
      item: "Black Wallet",
      category: "Wallet/ID",
      location: "Mary J. Livermore Library",
      date: "2026-02-10",
      desc: "Black leather wallet with a small scratch on the front.",
      status: "Open",
      ownerEmail: "staff@school.edu"
    },
    {
      id: "r2",
      type: "Lost",
      item: "AirPods Case",
      category: "Electronics",
      location: "Student Center",
      date: "2026-02-12",
      desc: "White AirPods case. Might have a small crack on the lid.",
      status: "Matching",
      ownerEmail: "julian@school.edu"
    },
    {
      id: "r3",
      type: "Lost",
      item: "Blue Hoodie",
      category: "Clothing",
      location: "Campus Rec",
      date: "2026-02-14",
      desc: "Blue hoodie, size L, UNCP logo on the chest.",
      status: "Open",
      ownerEmail: "someone@school.edu"
    }
  ],
};

const BUILDINGS = [
  "Mary J. Livermore Library",
  "Student Center",
  "Student Center(Hawks Nest)",
  "Campus Recreation Center",
  "Oxendine Science Building",
  "Oxendine Administrative Building",
  "Center for Student Success",
  "Dormitory(Pine/Oak Hall)",
  "Dormitory(North/Belk Hall)",
  "Dormitory(Courtyard/Cypress)",
  "Campus Police Department",
];

const view = document.getElementById("view");
const sidebar = document.getElementById("sidebar");
const topActions = document.getElementById("topActions");

document.getElementById("year").textContent = new Date().getFullYear();

function uid(prefix="id"){
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function go(route, opts = {}){
  state.route = route;
  if (opts.itemId) state.selectedItemId = opts.itemId;
  render();
}

function setActiveSidebar(route){
  document.querySelectorAll(".nav-item[data-route]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.route === route);
  });
}

function button(text, className, onClick){
  const b = document.createElement("button");
  b.className = className;
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}



function card(title, bodyHtml){
  return `
    <div class="card">
      <h3 class="card-title">${title}</h3>
      ${bodyHtml}
    </div>
  `;
}

function statusBadgeClass(status){
  if(status === "Matching") return "warn";
  if(status === "Claim Pending") return "warn";
  if(status === "Returned") return "good";
  if(status === "Rejected") return "bad";
  return "";
}

function getKpis(){
  const lost = state.reports.filter(r=>r.type==="Lost").length;
  const found = state.reports.filter(r=>r.type==="Found").length;
  const matching = state.reports.filter(r=>r.status==="Matching").length;
  const open = state.reports.filter(r=>r.status==="Open").length;
  return {lost, found, matching, open};
}

function renderTopActions(){
  topActions.innerHTML = "";

  topActions.append(
    button("Browse", "btn ghost", ()=>go("browse"))
  );

  if(!state.user){
    topActions.append(
      button("Login", "btn ghost", ()=>go("login")),
      button("Register", "btn primary", ()=>go("register"))
    );
  } else {
    const hello = document.createElement("span");
    hello.style.color = "var(--muted)";
    hello.style.fontWeight = "600";
    hello.textContent = `Hi, ${state.user.name}${state.user.role==="admin" ? " (Admin)" : ""}`;
    topActions.append(
      hello,
      button("Dashboard", "btn primary", ()=>go("dashboard"))
    );
  }
}

function goLoginThen(afterRoute){
  state.afterLoginRoute = afterRoute;
  go("login");
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function isValidUNCPEEmail(email){
  return /^[^\s@]+@uncp\.edu$/i.test(String(email).trim());
}

function renderHome(){
  const recent = state.reports.slice(0,3).map(r=>`
    <div class="list-item">
      <div>
        <div style="font-weight:800">${r.item}</div>
        <div style="color:var(--muted); font-size:13px">${r.type} • ${r.category} • ${r.location} • ${r.date}</div>
      </div>
      <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
    </div>
  `).join("");

  view.innerHTML = `
    <h1 class="h1">Lost something? Found something?</h1>
    <p class="p">Found IT is a simple campus lost & found prototype. Start by reporting a lost or found item, or browse listings.</p>

    <div class="grid2">
      ${card("Report a Lost Item", `
        <p class="p">Tell us what you lost, when, and where. Adding a photo helps matching.</p>
        <button class="btn primary" id="homeLostBtn">Report Lost</button>
      `)}
      ${card("Report a Found Item", `
        <p class="p">Found something on campus? Submit it here so the owner can claim it.</p>
        <button class="btn primary" id="homeFoundBtn">Report Found</button>
      `)}
    </div>

    <div style="height:14px"></div>

    ${card("Recent Activity", `
      <div class="list">${recent || `<div class="p">No reports yet.</div>`}</div>
      <div style="height:10px"></div>
      <button class="btn" id="homeBrowseBtn">Browse all listings</button>
    `)}
  `;

  document.getElementById("homeLostBtn").onclick = () => {
    if(!state.user) return goLoginThen("report-lost");
    go("report-lost");
  };
  document.getElementById("homeFoundBtn").onclick = () => {
    if(!state.user) return goLoginThen("report-found");
    go("report-found");
  };
  document.getElementById("homeBrowseBtn").onclick = () => go("browse");
}

function renderLogin(){
  view.innerHTML = `
    <h1 class="h1">Login</h1>
    <p class="p">Prototype login — enter a name + email to continue.</p>

    <div class="card">
      <div class="form">
        <div class="field">
          <label>Name</label>
          <input id="loginName" placeholder="Julian" />
        </div>
        <div class="field">
          <label>Email</label>
          <input id="loginEmail" type="email" placeholder="julian@uncp.edu" />
        </div>

        <div class="field">
          <label style="display:flex; gap:10px; align-items:center; cursor:pointer;">
            <input type="checkbox" id="loginAdmin" />
            Log in as admin (prototype)
          </label>
        </div>

        <button class="btn primary" id="loginBtn">Login</button>
        <button class="btn" id="toRegisterBtn">Need an account? Register</button>
      </div>
    </div>
  `;

  document.getElementById("loginBtn").onclick = () => {
    const name = document.getElementById("loginName").value.trim() || "Student";
    const email = document.getElementById("loginEmail").value.trim();
    const isAdmin = document.getElementById("loginAdmin").checked;

    if(!isValidUNCPEEmail(email)){
      alert("Please use a valid @uncp.edu email address.");
      return;
    }

    state.user = {name, email, role: isAdmin ? "admin" : "user"};

    if(state.afterLoginRoute){
      const next = state.afterLoginRoute;
      state.afterLoginRoute = null;
      go(next === "item" ? "browse" : next); // safety fallback
    } else {
      go("dashboard");
    }
  };

  document.getElementById("toRegisterBtn").onclick = () => go("register");
}

function renderRegister(){
  view.innerHTML = `
    <h1 class="h1">Register</h1>
    <p class="p">Prototype register — creates a mock user session.</p>

    <div class="card">
      <div class="form">
        <div class="row">
          <div class="field">
            <label>Name</label>
            <input id="regName" placeholder="Julian" />
          </div>
          <div class="field">
            <label>Email</label>
            <input id="regEmail" type="email" placeholder="julian@uncp.edu" />
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label>Password</label>
            <input id="regPass" type="password" placeholder="••••••••" />
          </div>
          <div class="field">
            <label>Confirm Password</label>
            <input id="regPass2" type="password" placeholder="••••••••" />
          </div>
        </div>

        <button class="btn primary" id="regBtn">Create Account</button>
        <button class="btn" id="toLoginBtn">Already have an account? Login</button>
      </div>
    </div>
  `;

  document.getElementById("regBtn").onclick = () => {
    const name = document.getElementById("regName").value.trim() || "Student";
    const email = document.getElementById("regEmail").value.trim();

    if(!isValidUNCPEEmail(email)){
      alert("Please use a valid @uncp.edu email address.");
      return;
    }

    state.user = {name, email, role: "user"};

    if(state.afterLoginRoute){
      const next = state.afterLoginRoute;
      state.afterLoginRoute = null;
      go(next === "item" ? "browse" : next);
    } else {
      go("dashboard");
    }
  };

  document.getElementById("toLoginBtn").onclick = () => go("login");
}

function renderDashboard(){
  const {lost, found, matching, open} = getKpis();
  const buildingFilter = state.dashboardBuildingFilter;

  const filteredReports = buildingFilter === "All"
    ? state.reports
    : state.reports.filter(r => r.location === buildingFilter);

  const list = filteredReports.slice(0,6).map(r=>`
    <div class="list-item">
      <div>
        <div style="font-weight:900">${r.item}</div>
        <div style="color:var(--muted); font-size:13px">${r.type} • ${r.category} • ${r.location} • ${r.date}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
        <button class="btn" data-open="${r.id}">Details</button>
      </div>
    </div>
  `).join("");

  const maxBuildingCount = Math.max(
    ...BUILDINGS.map(b => state.reports.filter(r => r.location === b).length),
    1
  );

  const buildingRows = BUILDINGS.map(b => {
    const lostCount  = state.reports.filter(r => r.location === b && r.type === "Lost").length;
    const foundCount = state.reports.filter(r => r.location === b && r.type === "Found").length;
    const total   = lostCount + foundCount;
    const barPct  = Math.round((total / maxBuildingCount) * 100);
    const lostPct = total ? Math.round((lostCount / total) * 100) : 0;
    const foundPct = total ? 100 - lostPct : 0;
    const isSelected = buildingFilter === b;
    return `
      <div class="building-row${isSelected ? " selected" : ""}" data-building="${escapeHtml(b)}">
        <div class="building-name" title="${escapeHtml(b)}">${escapeHtml(b)}</div>
        <div class="building-bar-wrap">
          <div class="building-bar" style="width:${Math.max(barPct,total?2:0)}%">
            <div class="building-bar-lost"  style="width:${lostPct}%"></div>
            <div class="building-bar-found" style="width:${foundPct}%"></div>
          </div>
        </div>
        <div class="building-counts">
          <span class="bc-lost">${lostCount}L</span>
          <span class="bc-found">${foundCount}F</span>
        </div>
      </div>
    `;
  }).join("");

  const buildingOptions = ["All", ...BUILDINGS].map(b =>
    `<option value="${escapeHtml(b)}" ${b === buildingFilter ? "selected" : ""}>${escapeHtml(b)}</option>`
  ).join("");

  view.innerHTML = `
    <h1 class="h1">Dashboard</h1>
    <p class="p">Quick overview of activity and your most recent reports.</p>

    <div class="kpis">
      <div class="kpi"><div class="num">${lost}</div><div class="label">Lost Reports</div></div>
      <div class="kpi"><div class="num">${found}</div><div class="label">Found Reports</div></div>
      <div class="kpi"><div class="num">${matching}</div><div class="label">Potential Matches</div></div>
      <div class="kpi"><div class="num">${open}</div><div class="label">Open Cases</div></div>
    </div>

    <div style="height:14px"></div>

    ${card("Activity by Building", `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="display:flex; gap:14px; align-items:center; font-size:12px; color:var(--muted);">
          <span style="display:flex;gap:6px;align-items:center;"><span class="legend-dot lost"></span>Lost</span>
          <span style="display:flex;gap:6px;align-items:center;"><span class="legend-dot found"></span>Found</span>
          ${buildingFilter !== "All" ? `<button class="btn" id="clearBuildingFilter" style="font-size:12px;padding:4px 10px;">Clear filter</button>` : ""}
        </div>
        <div class="field" style="margin:0; min-width:220px;">
          <select id="buildingDropdown">${buildingOptions}</select>
        </div>
      </div>
      <div class="building-chart">${buildingRows}</div>
      <div style="font-size:12px; color:var(--muted); margin-top:10px;">Click a row or use the dropdown to filter recent reports below.</div>
    `)}

    <div style="height:14px"></div>

    ${card((buildingFilter !== "All" ? `Recent Reports — ${buildingFilter}` : "Recent Reports"), `
      <div class="list">${list || `<div class="p">No reports for this location.</div>`}</div>
    `)}
  `;

  document.getElementById("buildingDropdown").onchange = (e) => {
    state.dashboardBuildingFilter = e.target.value;
    render();
  };

  const clearBtn = document.getElementById("clearBuildingFilter");
  if(clearBtn) clearBtn.onclick = () => { state.dashboardBuildingFilter = "All"; render(); };

  document.querySelectorAll(".building-row").forEach(row => {
    row.onclick = () => {
      const b = row.dataset.building;
      state.dashboardBuildingFilter = (state.dashboardBuildingFilter === b) ? "All" : b;
      render();
    };
  });

  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick = (e) => { e.stopPropagation(); go("item", { itemId: btn.dataset.open }); };
  });
}

function getAllCategories(){
  const cats = [...new Set(state.reports.map(r=>r.category).filter(Boolean))].sort();
  return ["All", ...cats];
}

function applyFilters(reports){
  const q = state.filters.q.trim().toLowerCase();
  const type = state.filters.type;
  const category = state.filters.category;

  return reports.filter(r=>{
    const qMatch =
      !q ||
      r.item.toLowerCase().includes(q) ||
      (r.desc || "").toLowerCase().includes(q) ||
      (r.location || "").toLowerCase().includes(q);

    const typeMatch = (type === "All") || (r.type === type);
    const catMatch = (category === "All") || (r.category === category);

    return qMatch && typeMatch && catMatch;
  });
}

function renderBrowse(){
  const categories = getAllCategories();
  const filtered = applyFilters(state.reports);

  const rows = filtered.map(r=>`
    <div class="list-item">
      <div>
        <div style="font-weight:900">${r.item}</div>
        <div style="color:var(--muted); font-size:13px">${r.type} • ${r.category} • ${r.location} • ${r.date}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
        <button class="btn" data-open="${r.id}">View</button>
      </div>
    </div>
  `).join("");

  view.innerHTML = `
    <h1 class="h1">Browse Listings</h1>
    <p class="p">Search and filter through reported items.</p>

    <div class="filters">
      <div class="field">
        <label>Search</label>
        <input id="fQ" placeholder="Search by item, location, description..." value="${escapeHtml(state.filters.q)}" />
      </div>

      <div class="field">
        <label>Type</label>
        <select id="fType">
          ${["All","Lost","Found"].map(t=>`<option ${t===state.filters.type?"selected":""}>${t}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Category</label>
        <select id="fCat">
          ${categories.map(c=>`<option ${c===state.filters.category?"selected":""}>${c}</option>`).join("")}
        </select>
      </div>
    </div>

    ${card("Results", `<div class="list">${rows || `<div class="p">No results found.</div>`}</div>`)}
  `;

  document.getElementById("fQ").oninput = (e)=>{ state.filters.q = e.target.value; render(); };
  document.getElementById("fType").onchange = (e)=>{ state.filters.type = e.target.value; render(); };
  document.getElementById("fCat").onchange = (e)=>{ state.filters.category = e.target.value; render(); };

  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick = () => go("item", { itemId: btn.dataset.open });
  });
}

function findItemById(id){
  return state.reports.find(r=>r.id === id) || null;
}

function renderItemDetails(){
  const item = findItemById(state.selectedItemId);
  if(!item){
    view.innerHTML = `
      <h1 class="h1">Item not found</h1>
      <p class="p">This listing may have been removed.</p>
      <button class="btn" id="backToBrowse">Back to Browse</button>
    `;
    document.getElementById("backToBrowse").onclick = ()=>go("browse");
    return;
  }

  const canClaim = item.type === "Found" && item.status !== "Returned";

  view.innerHTML = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:space-between; align-items:center">
      <div>
        <h1 class="h1" style="margin-bottom:6px">${escapeHtml(item.item)}</h1>
        <div style="color:var(--muted)"> ${escapeHtml(item.type)} • ${escapeHtml(item.category)} • ${escapeHtml(item.location)} • ${escapeHtml(item.date)}</div>
      </div>
      <span class="badge ${statusBadgeClass(item.status)}" style="font-size:13px">${escapeHtml(item.status)}</span>
    </div>

    <div style="height:12px"></div>

    ${card("Details", `
      <div class="p"><b>Description:</b><br/>${escapeHtml(item.desc || "No description provided.")}</div>
      ${item.submittedBy ? `
      <div style="height:8px"></div>
      <div class="audit-tag">
        <span class="audit-icon">&#128274;</span>
        <span><b>Logged by:</b> ${escapeHtml(item.submittedBy)}</span>
        ${item.submittedBuilding ? `<span style="color:var(--muted); font-size:12px">— ${escapeHtml(item.submittedBuilding)}</span>` : ""}
        ${item.submittedAt ? `<span style="color:var(--muted); font-size:12px">at ${escapeHtml(item.submittedAt)}</span>` : ""}
      </div>` : ""}
      <div style="height:10px"></div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" id="backBtn">Back</button>
        ${canClaim ? `<button class="btn primary" id="claimBtn">Claim this item</button>` : ""}
      </div>
    `)}
  `;

  document.getElementById("backBtn").onclick = () => go("browse");
  if(canClaim){
    document.getElementById("claimBtn").onclick = () => {
      if(!state.user) return goLoginThen("browse");
      go("claim", { itemId: item.id });
    };
  }
}

function renderClaimForm(){
  const item = findItemById(state.selectedItemId);
  if(!item) return go("browse");
  if(!state.user) return goLoginThen("browse");

  view.innerHTML = `
    <h1 class="h1">Claim Item</h1>
    <p class="p">Provide proof so an admin can verify your claim.</p>

    ${card("Item", `
      <div style="font-weight:900">${escapeHtml(item.item)}</div>
      <div style="color:var(--muted); font-size:13px">${escapeHtml(item.location)} • ${escapeHtml(item.date)}</div>
    `)}

    <div style="height:12px"></div>

    <div class="card">
      <form class="form" id="claimForm">
        <div class="row">
          <div class="field">
            <label>Your name</label>
            <input name="name" value="${escapeHtml(state.user.name)}" required />
          </div>
          <div class="field">
            <label>Your email</label>
            <input name="email" value="${escapeHtml(state.user.email)}" required />
          </div>
        </div>

        <div class="field">
          <label>Proof / Details</label>
          <textarea name="proof" required></textarea>
        </div>

        <div class="field">
          <label>Preferred contact</label>
          <select name="contact" required>
            <option>Email</option>
            <option>Phone</option>
            <option>Message in app</option>
          </select>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" type="button" id="cancelClaim">Cancel</button>
          <button class="btn primary" type="submit">Submit Claim</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("cancelClaim").onclick = () => go("item", { itemId: item.id });

  document.getElementById("claimForm").onsubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    state.claims.unshift({
      id: uid("claim"),
      itemId: item.id,
      claimantName: String(form.get("name")),
      claimantEmail: String(form.get("email")),
      proof: String(form.get("proof")),
      contact: String(form.get("contact")),
      status: "Pending",
      createdAt: new Date().toLocaleString(),
    });

    item.status = "Claim Pending";
    go("item", { itemId: item.id });
  };
}

function renderSettings(){
  view.innerHTML = `
    <h1 class="h1">Settings</h1>
    <p class="p">Prototype settings page.</p>

    ${card("Profile", `
      <div class="p"><b>Name:</b> ${escapeHtml(state.user?.name || "—")}</div>
      <div class="p"><b>Email:</b> ${escapeHtml(state.user?.email || "—")}</div>
      <div class="p"><b>Role:</b> ${escapeHtml(state.user?.role || "—")}</div>
    `)}
  `;
}

function renderReportLost(){
  if(state.reportLostStep === "form"){
    renderReportLostForm();
    return;
  }

  const recent = state.reports.slice(0,3).map(r=>`
    <div class="list-item">
      <div>
        <div style="font-weight:800">${r.item}</div>
        <div style="color:var(--muted); font-size:13px">${r.type} • ${r.category} • ${r.location} • ${r.date}</div>
      </div>
      <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
    </div>
  `).join("");

  view.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:18px; height:100%">
      <div style="flex:1; display:flex; align-items:center; justify-content:center">
        ${card("Report a Lost Item", `
          <p class="p">Tell us what you lost, when, and where. Adding a photo helps matching.</p>
          <button class="btn primary" id="reportLostStartBtn">Start Report</button>
        `)}
      </div>

      <div>
        ${card("Recent Activity", `
          <div class="list">${recent || `<div class="p">No reports yet.</div>`}</div>
        `)}
      </div>
    </div>
  `;

  document.getElementById("reportLostStartBtn").onclick = () => {
    state.reportLostStep = "form";
    render();
  };
}

function renderReportLostForm(){
  view.innerHTML = `
    <h1 class="h1">Report Lost Item</h1>
    <p class="p">Please provide details about your lost item.</p>

    <div class="card">
      <form class="form" id="reportLostForm">
        <div class="field">
          <label>Item Name *</label>
          <input id="itemName" placeholder="e.g., Black Wallet, AirPods" required />
        </div>

        <div class="field">
          <label>When did you lose it? *</label>
          <input id="itemDate" type="date" required />
        </div>

        <div class="field">
          <label>Where was the last place you had it? *</label>
          <select id="itemLocation" required>
            <option value="">— Select a building —</option>
            ${BUILDINGS.map(b=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label>Additional Details</label>
          <textarea id="itemDesc" placeholder="Describe the item (color, brand, distinguishing marks, etc.)"></textarea>
        </div>

        <div class="field">
          <label>Upload Photo/File (Optional)</label>
          <input id="itemFile" type="file" accept="image/*,.pdf,.doc,.docx" />
          <div style="font-size:12px; color:var(--muted); margin-top:6px">Supported: Images, PDF, DOC, DOCX</div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" type="button" id="cancelReportLost">Cancel</button>
          <button class="btn primary" type="submit">Submit Report</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("cancelReportLost").onclick = () => {
    state.reportLostStep = "main";
    render();
  };

  document.getElementById("reportLostForm").onsubmit = (e) => {
    e.preventDefault();
    const itemName = document.getElementById("itemName").value.trim();
    const itemDate = document.getElementById("itemDate").value;
    const itemLocation = document.getElementById("itemLocation").value.trim();
    const itemDesc = document.getElementById("itemDesc").value.trim();
    const itemFile = document.getElementById("itemFile").files[0];

    if(!itemName || !itemDate || !itemLocation){
      alert("Please fill in all required fields");
      return;
    }

    state.reports.unshift({
      id: uid("r"),
      type: "Lost",
      item: itemName,
      category: "Other",
      location: itemLocation,
      date: itemDate,
      desc: itemDesc,
      status: "Open",
      ownerEmail: state.user.email,
      fileName: itemFile?.name || null
    });

    state.reportLostStep = "main";
    render();
  };
}

function renderReportFound(){
  if(state.reportFoundStep === "form"){
    renderReportFoundForm();
    return;
  }

  const recent = state.reports.slice(0,3).map(r=>`
    <div class="list-item">
      <div>
        <div style="font-weight:800">${r.item}</div>
        <div style="color:var(--muted); font-size:13px">${r.type} • ${r.category} • ${r.location} • ${r.date}</div>
      </div>
      <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
    </div>
  `).join("");

  view.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:18px; height:100%">
      <div style="flex:1; display:flex; align-items:center; justify-content:center">
        ${card("Report a Found Item", `
          <p class="p">Found something on campus? Submit it here so the owner can claim it.</p>
          <button class="btn primary" id="reportFoundStartBtn">Start Report</button>
        `)}
      </div>

      <div>
        ${card("Recent Activity", `
          <div class="list">${recent || `<div class="p">No reports yet.</div>`}</div>
        `)}
      </div>
    </div>
  `;

  document.getElementById("reportFoundStartBtn").onclick = () => {
    state.reportFoundStep = "form";
    render();
  };
}

function renderReportFoundForm(){
  const isAdmin = state.user && state.user.role === "admin";

  view.innerHTML = `
    <h1 class="h1">Report Found Item</h1>
    <p class="p">Please provide details about the item you found.</p>
    ${isAdmin ? `<div class="audit-notice">You are logged in as an admin account. Your name is required for auditing purposes.</div>` : ""}

    <div class="card">
      <form class="form" id="reportFoundForm">
        ${isAdmin ? `
        <div class="row">
          <div class="field">
            <label>Staff Name (Your Full Name) *</label>
            <input id="foundStaffName" placeholder="e.g., Jane Smith" required />
            <div style="font-size:12px; color:var(--muted); margin-top:6px">Recorded for auditing — identifies which staff member filed this report.</div>
          </div>
          <div class="field">
            <label>Your Building / Department *</label>
            <select id="foundAdminBuilding" required>
              <option value="">— Select your building —</option>
              ${BUILDINGS.map(b=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("")}
            </select>
            <div style="font-size:12px; color:var(--muted); margin-top:6px">The building where you work / found the item.</div>
          </div>
        </div>` : ""}
        <div class="field">
          <label>Item Name *</label>
          <input id="foundItemName" placeholder="e.g., Black Wallet, AirPods" required />
        </div>

        <div class="field">
          <label>When did you find it? *</label>
          <input id="foundItemDate" type="date" required />
        </div>

        <div class="field">
          <label>Where did you find it? *</label>
          <select id="foundItemLocation" required>
            <option value="">— Select a building —</option>
            ${BUILDINGS.map(b=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label>Additional Details</label>
          <textarea id="foundItemDesc" placeholder="Describe the item (color, brand, distinguishing marks, condition, etc.)"></textarea>
        </div>

        <div class="field">
          <label>Upload Photo/File (Optional)</label>
          <input id="foundItemFile" type="file" accept="image/*,.pdf,.doc,.docx" />
          <div style="font-size:12px; color:var(--muted); margin-top:6px">Supported: Images, PDF, DOC, DOCX</div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" type="button" id="cancelReportFound">Cancel</button>
          <button class="btn primary" type="submit">Submit Report</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("cancelReportFound").onclick = () => {
    state.reportFoundStep = "main";
    render();
  };

  document.getElementById("reportFoundForm").onsubmit = (e) => {
    e.preventDefault();
    const isAdmin = state.user && state.user.role === "admin";
    const staffNameEl = document.getElementById("foundStaffName");
    const staffName = staffNameEl ? staffNameEl.value.trim() : "";
    const adminBuildingEl = document.getElementById("foundAdminBuilding");
    const adminBuilding = adminBuildingEl ? adminBuildingEl.value.trim() : "";
    const itemName = document.getElementById("foundItemName").value.trim();
    const itemDate = document.getElementById("foundItemDate").value;
    const itemLocation = document.getElementById("foundItemLocation").value.trim();
    const itemDesc = document.getElementById("foundItemDesc").value.trim();
    const itemFile = document.getElementById("foundItemFile").files[0];

    if(!itemName || !itemDate || !itemLocation){
      alert("Please fill in all required fields");
      return;
    }
    if(isAdmin && !staffName){
      alert("Please enter your staff name for auditing purposes.");
      return;
    }
    if(isAdmin && !adminBuilding){
      alert("Please select your building.");
      return;
    }

    state.reports.unshift({
      id: uid("r"),
      type: "Found",
      item: itemName,
      category: "Other",
      location: itemLocation,
      date: itemDate,
      desc: itemDesc,
      status: "Open",
      ownerEmail: state.user.email,
      fileName: itemFile?.name || null,
      submittedBy: isAdmin ? staffName : null,
      submittedBuilding: isAdmin ? adminBuilding : null,
      submittedAt: new Date().toLocaleString(),
    });

    state.reportFoundStep = "main";
    render();
  };
}

function renderMyReports(){
  const myReports = state.reports.filter(r => r.ownerEmail === state.user.email);

  const list = myReports.map(r=>`
    <div class="list-item">
      <div>
        <div style="font-weight:900">${r.item}</div>
        <div style="color:var(--muted); font-size:13px">${r.type} • ${r.category} • ${r.location} • ${r.date}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
        <button class="btn" data-open="${r.id}">Details</button>
      </div>
    </div>
  `).join("");

  view.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; min-height: calc(100vh - 140px)">
      ${card("My Reports", `<div class="list">${list || `<div class="p">You haven't submitted any reports yet.</div>`}</div>`)}
    </div>
  `;

  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick = () => go("item", { itemId: btn.dataset.open });
  });
}

/* ✅ SAFETY FIX: guard missing adminNavSlot so it never crashes */
function renderAdminNav(){
  const adminNavSlot = document.getElementById("adminNavSlot");
  if(!adminNavSlot) return;

  adminNavSlot.innerHTML = "";
  if(state.user && state.user.role === "admin"){
    const b = document.createElement("button");
    b.className = "nav-item";
    b.dataset.route = "admin";
    b.textContent = "Admin Panel";
    adminNavSlot.appendChild(b);
  }
}

/* Minimal admin page (still works) */
function renderAdmin(){
  const foundReports = state.reports.filter(r => r.type === "Found");
  const adminReports = foundReports.filter(r => r.submittedBy);
  const totalFound = foundReports.length;
  const totalAudit = adminReports.length;
  const staffSet = [...new Set(adminReports.map(r => r.submittedBy))];

  const auditRows = foundReports.map(r => `
    <div class="list-item" style="flex-wrap:wrap; gap:8px;">
      <div style="flex:1; min-width:180px;">
        <div style="font-weight:900">${escapeHtml(r.item)}</div>
        <div style="color:var(--muted); font-size:12px">${escapeHtml(r.location)} • ${escapeHtml(r.date)}</div>
      </div>
      <div style="flex:1; min-width:140px; font-size:13px;">
        ${r.submittedBy
          ? `<span class="audit-tag inline"><span class="audit-icon">&#128274;</span>${escapeHtml(r.submittedBy)}</span>
             ${r.submittedBuilding ? `<div style="color:var(--muted); font-size:11px; margin-top:3px">&#127970; ${escapeHtml(r.submittedBuilding)}</div>` : ""}
             <div style="color:var(--muted); font-size:11px; margin-top:2px">${escapeHtml(r.submittedAt || "")}</div>`
          : `<span style="color:var(--muted); font-size:12px">User self-report</span>`
        }
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
        <button class="btn" data-open="${r.id}">Details</button>
      </div>
    </div>
  `).join("");

  const staffSummaryRows = staffSet.map(name => {
    const staffReps = adminReports.filter(r => r.submittedBy === name);
    const count = staffReps.length;
    const building = staffReps[0]?.submittedBuilding || "";
    return `<div class="list-item" style="padding:10px 14px;">
      <div>
        <div style="font-weight:700">${escapeHtml(name)}</div>
        ${building ? `<div style="color:var(--muted); font-size:12px">&#127970; ${escapeHtml(building)}</div>` : ""}
      </div>
      <span class="badge">${count} report${count !== 1 ? "s" : ""}</span>
    </div>`;
  }).join("");

  view.innerHTML = `
    <h1 class="h1">Admin Panel</h1>
    <p class="p">Audit log of all Found reports. Staff-submitted entries show who logged each item.</p>

    <div class="kpis" style="grid-template-columns: repeat(3,1fr);">
      <div class="kpi"><div class="num">${totalFound}</div><div class="label">Found Reports Total</div></div>
      <div class="kpi"><div class="num">${totalAudit}</div><div class="label">Staff-Submitted</div></div>
      <div class="kpi"><div class="num">${staffSet.length}</div><div class="label">Staff Members Active</div></div>
    </div>

    <div style="height:14px"></div>

    ${staffSet.length ? card("Staff Activity Summary", `
      <div class="list">${staffSummaryRows}</div>
    `) : ""}

    <div style="height:14px"></div>

    ${card("Found Report Audit Log", `
      <div style="font-size:12px; color:var(--muted); margin-bottom:10px;">
        All Found reports in the system. Rows without a staff name were submitted by regular users.
      </div>
      <div class="list">${auditRows || `<div class="p">No found reports yet.</div>`}</div>
    `)}
  `;

  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.onclick = () => go("item", { itemId: btn.dataset.open });
  });
}

// ---------- Main render ----------
function render(){
  renderTopActions();

  const shell = document.querySelector(".shell");
  const centerRoutes = ["home","login","register"];
  const noSidebarRoutes = ["browse","item"];

  if(state.user){
    sidebar.classList.remove("hidden");
    shell.classList.add("with-sidebar");
    shell.classList.remove("centered");
    shell.classList.remove("no-sidebar");
  } else {
    sidebar.classList.add("hidden");
    shell.classList.remove("with-sidebar");

    if(centerRoutes.includes(state.route)){
      shell.classList.add("centered");
      shell.classList.remove("no-sidebar");
    } else if(noSidebarRoutes.includes(state.route)){
      shell.classList.add("no-sidebar");
      shell.classList.remove("centered");
    } else {
      shell.classList.add("centered");
      shell.classList.remove("no-sidebar");
    }
  }

  renderAdminNav();

  // sidebar routes
  document.querySelectorAll(".nav-item[data-route]").forEach(btn=>{
    btn.onclick = () => go(btn.dataset.route);
  });

  // logout
  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn){
    logoutBtn.onclick = () => {
      state.user = null;
      state.route = "home";
      state.selectedItemId = null;
      state.reportLostStep = "main";
      state.reportFoundStep = "main";
      render();
    };
  }

  // login protection (keep browse public)
  const needsLogin = ["dashboard","report-lost","report-found","my-reports","settings","admin","claim"];
  if(!state.user && needsLogin.includes(state.route)){
    state.route = "login";
  }

  switch(state.route){
    case "home": renderHome(); break;
    case "login": renderLogin(); break;
    case "register": renderRegister(); break;
    case "dashboard": renderDashboard(); break;
    case "browse": renderBrowse(); break;
    case "item": renderItemDetails(); break;
    case "claim": renderClaimForm(); break;
    case "admin": renderAdmin(); break;
    case "settings": renderSettings(); break;
    case "report-lost": renderReportLost(); break;
    case "report-found": renderReportFound(); break;
    case "my-reports": renderMyReports(); break;
    default: renderHome();
  }

  setActiveSidebar(state.route);
}

render();
