const ADMIN_PASSWORD = "1234";
let isAdmin = localStorage.getItem("jpte_admin") === "true";
let currentPage = "ALL";
let records = JSON.parse(localStorage.getItem("jpte_admin_records")) || [];

document.getElementById("date").valueAsDate = new Date();

function money(n){ return "RM" + Number(n || 0).toFixed(2); }

function getTeamByClass(cls){
  if(cls === "6UTM") return "Heng Team";
  if(cls === "Guru" || cls === "6UPSI" || cls === "6UIA") return "Alen Team";
  if(cls === "6UMS") return "Pow Team";
  return "";
}

function autoTeam(){
  document.getElementById("team").value = getTeamByClass(document.getElementById("className").value);
}

function adminLogin(){
  const pass = prompt("Masukkan password admin:");
  if(pass === ADMIN_PASSWORD){
    isAdmin = true;
    localStorage.setItem("jpte_admin","true");
    updateMode();
  }else{
    alert("Password salah.");
  }
}

function adminLogout(){
  isAdmin = false;
  localStorage.removeItem("jpte_admin");
  updateMode();
}

function updateMode(){
  document.getElementById("formPanel").classList.toggle("hidden", !isAdmin);
  document.getElementById("loginBtn").classList.toggle("hidden", isAdmin);
  document.getElementById("logoutBtn").classList.toggle("hidden", !isAdmin);
  document.getElementById("modeText").innerHTML = isAdmin ? "ADMIN MODE<br><span>Boleh edit rekod</span>" : "VIEW MODE<br><span>Hanya boleh melihat</span>";
  document.getElementById("modeCard").innerText = isAdmin ? "ADMIN MODE" : "VIEW MODE";
  document.getElementById("notice").innerText = isAdmin ? "Anda sedang dalam mod admin. Anda boleh menambah, mengubah atau memadam rekod." : "Anda sedang dalam mod lihat sahaja. Hanya admin boleh menambah, mengubah atau memadam rekod.";
  render();
}

document.getElementById("paymentForm").addEventListener("submit", function(e){
  e.preventDefault();
  if(!isAdmin) return alert("Hanya admin boleh simpan rekod.");

  const editId = document.getElementById("editId").value;
  const data = {
    id: editId ? Number(editId) : Date.now(),
    className: document.getElementById("className").value,
    team: document.getElementById("team").value,
    amount: Number(document.getElementById("amount").value || 0),
    date: document.getElementById("date").value,
    method: "Cash"
  };

  if(editId){
    records = records.map(r => r.id === Number(editId) ? data : r);
  }else{
    records.push(data);
  }

  save();
  cancelEdit();
  render();
});

function save(){
  localStorage.setItem("jpte_admin_records", JSON.stringify(records));
}

function editRecord(id){
  if(!isAdmin) return;
  const r = records.find(x => x.id === id);
  if(!r) return;

  document.getElementById("editId").value = r.id;
  document.getElementById("className").value = r.className;
  document.getElementById("team").value = r.team;
  document.getElementById("amount").value = r.amount;
  document.getElementById("date").value = r.date;
  document.getElementById("saveBtn").innerText = "Update Rekod";
  document.getElementById("cancelBtn").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

function cancelEdit(){
  document.getElementById("paymentForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("saveBtn").innerText = "Simpan Rekod";
  document.getElementById("cancelBtn").classList.add("hidden");
}

function deleteRecord(id){
  if(!isAdmin) return alert("Hanya admin boleh padam rekod.");
  if(confirm("Padam rekod ini?")){
    records = records.filter(r => r.id !== id);
    save();
    render();
  }
}

function setPage(page, btn){
  currentPage = page;
  document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
  if(btn) btn.classList.add("active");
  document.getElementById("pageTitle").innerText =
    page === "ALL" ? "Rekod Harian" :
    page === "DAILY" ? "Laporan Harian" :
    page + " - Rekod Kutipan";
  render();
}

function quickPage(page){
  currentPage = page;
  document.getElementById("pageTitle").innerText = page + " - Rekod Kutipan";
  render();
}

function filtered(){
  const q = document.getElementById("search").value.toLowerCase();
  return records.filter(r => {
    const text = `${r.date} ${r.className} ${r.team}`.toLowerCase();
    return text.includes(q) && (currentPage === "ALL" || currentPage === "DAILY" || r.team === currentPage);
  });
}

function renderDaily(list){
  const grouped = {};
  list.forEach(r=>{
    if(!grouped[r.date]) grouped[r.date] = {"Heng Team":0,"Alen Team":0,"Pow Team":0,total:0};
    grouped[r.date][r.team] += r.amount;
    grouped[r.date].total += r.amount;
  });

  document.getElementById("dailyList").innerHTML = Object.keys(grouped).sort().reverse().map(date=>`
    <tr>
      <td><b>${date}</b></td>
      <td>${money(grouped[date]["Heng Team"])}</td>
      <td>${money(grouped[date]["Alen Team"])}</td>
      <td>${money(grouped[date]["Pow Team"])}</td>
      <td><b>${money(grouped[date].total)}</b></td>
    </tr>
  `).join("") || `<tr><td colspan="5">Tiada rekod</td></tr>`;
}

function render(){
  const list = filtered();

  document.getElementById("recordList").innerHTML = list.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${r.className}</td>
      <td>${r.team}</td>
      <td><b>${money(r.amount)}</b></td>
      <td class="admin-column">
        ${isAdmin ? `<button class="action-btn edit" onclick="editRecord(${r.id})">Edit</button><button class="action-btn delete" onclick="deleteRecord(${r.id})">Delete</button>` : "-"}
      </td>
    </tr>
  `).join("") || `<tr><td colspan="5">Tiada rekod</td></tr>`;

  renderDaily(list);

  document.getElementById("totalRecords").innerText = records.length;
  document.getElementById("totalAmount").innerText = money(records.reduce((s,r)=>s+r.amount,0));
  document.getElementById("hengTotal").innerText = money(records.filter(r=>r.team==="Heng Team").reduce((s,r)=>s+r.amount,0));
  document.getElementById("alenTotal").innerText = money(records.filter(r=>r.team==="Alen Team").reduce((s,r)=>s+r.amount,0));
  document.getElementById("powTotal").innerText = money(records.filter(r=>r.team==="Pow Team").reduce((s,r)=>s+r.amount,0));
}

function exportCSV(){
  const header = ["Tarikh","Kelas/Guru","Team","Total Harga","Method"];
  const rows = records.map(r => [r.date, r.className, r.team, r.amount, r.method]);
  const csv = [header,...rows].map(row=>row.map(x=>`"${String(x ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "KUTIPAN_JPTE_ADMIN.csv";
  a.click();
}

updateMode();
