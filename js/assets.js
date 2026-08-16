const tableBody = document.getElementById("assetTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

document.getElementById("userName").textContent = user.name;

async function apiFetch(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }

  return response.json();
}

function kondisiLabel(kondisi) {
  const map = {
    baik: "Baik",
    rusak_ringan: "Rusak ringan",
    rusak_berat: "Rusak berat",
  };
  return map[kondisi] || kondisi;
}

function kondisiBadgeClass(kondisi) {
  const map = {
    baik: "badge-baik",
    rusak_ringan: "badge-warn",
    rusak_berat: "badge-bad",
  };
  return map[kondisi] || "";
}

async function loadAssets(page = 1) {
  const search = searchInput.value;
  const categoryId = categoryFilter.value;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (categoryId) params.append("category_id", categoryId);
  params.append("page", page);

  const result = await apiFetch(`/assets?${params.toString()}`);
  const assets = result.data;

  tableBody.innerHTML = "";
  emptyState.style.display = assets.length === 0 ? "block" : "none";

  assets.forEach((asset) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><span class="tag-code">${asset.kode_aset}</span></td>
            <td>${asset.nama_aset}</td>
            <td>${asset.category.nama_kategori}</td>
            <td>${asset.location.nama_ruangan}</td>
            <td><span class="badge ${kondisiBadgeClass(asset.kondisi)}">${kondisiLabel(asset.kondisi)}</span></td>
            <td>${asset.jumlah}</td>
            <td>
                ${
                  user.role === "admin"
                    ? `
                    <button class="btn-icon" onclick="editAsset(${asset.id})">Edit</button>
                    <button class="btn-icon danger" onclick="deleteAsset(${asset.id})">Hapus</button>
                `
                    : "-"
                }
            </td>
        `;
    tableBody.appendChild(row);
  });

  renderPagination(result.meta);
}

function renderPagination(meta) {
  const el = document.getElementById("pagination");
  if (!el) return;

  if (!meta || meta.last_page <= 1) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `
    <button ${meta.current_page === 1 ? "disabled" : ""} onclick="loadAssets(${meta.current_page - 1})">← Sebelumnya</button>
    <span class="page-info">Halaman ${meta.current_page} dari ${meta.last_page}</span>
    <button ${meta.current_page === meta.last_page ? "disabled" : ""} onclick="loadAssets(${meta.current_page + 1})">Selanjutnya →</button>
  `;
}

async function loadCategoriesForFilter() {
  const result = await apiFetch("/categories");
  result.data.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.nama_kategori;
    categoryFilter.appendChild(option);
  });
}

async function deleteAsset(id) {
  if (!(await showConfirm("Yakin hapus aset ini?"))) return;

  await fetch(`${API_BASE_URL}/assets/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  showToast("Aset berhasil dihapus.");
  loadAssets();
  loadStats();
  loadChart();
  loadRecentActivity();
}

searchInput.addEventListener("input", () => loadAssets());
categoryFilter.addEventListener("change", () => loadAssets());

const modal = document.getElementById("assetModal");
const modalTitle = document.getElementById("modalTitle");
const assetForm = document.getElementById("assetForm");
const formError = document.getElementById("formError");
let allCategories = [];
let allLocations = [];

async function loadFormDropdowns() {
  const catResult = await apiFetch("/categories");
  allCategories = catResult.data;
  document.getElementById("categoryId").innerHTML = allCategories
    .map((c) => `<option value="${c.id}">${c.nama_kategori}</option>`)
    .join("");

  const locResult = await apiFetch("/locations");
  allLocations = locResult.data;
  document.getElementById("locationId").innerHTML = allLocations
    .map((l) => `<option value="${l.id}">${l.nama_ruangan}</option>`)
    .join("");
}

function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  assetForm.reset();
  document.getElementById("assetId").value = "";
  document.getElementById("kodeAsetGroup").style.display = "none";
  formError.textContent = "";
}

document.getElementById("btnTambah").addEventListener("click", async () => {
  modalTitle.textContent = "Tambah Aset";
  document.getElementById("kodeAsetGroup").style.display = "none";
  await loadFormDropdowns();
  openModal();
});

async function editAsset(id) {
  modalTitle.textContent = "Edit Aset";
  await loadFormDropdowns();

  const result = await apiFetch(`/assets/${id}`);
  const asset = result.data;

  document.getElementById("kodeAsetGroup").style.display = "block";
  document.getElementById("assetId").value = asset.id;
  document.getElementById("kodeAset").value = asset.kode_aset;
  document.getElementById("namaAset").value = asset.nama_aset;
  document.getElementById("categoryId").value = asset.category.id;
  document.getElementById("locationId").value = asset.location.id;
  document.getElementById("kondisi").value = asset.kondisi;
  document.getElementById("jumlah").value = asset.jumlah;
  document.getElementById("tanggalPerolehan").value =
    asset.tanggal_perolehan || "";
  document.getElementById("keterangan").value = asset.keterangan || "";

  openModal();
}

assetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  const id = document.getElementById("assetId").value;
  const payload = {
    nama_aset: document.getElementById("namaAset").value,
    category_id: document.getElementById("categoryId").value,
    location_id: document.getElementById("locationId").value,
    kondisi: document.getElementById("kondisi").value,
    jumlah: document.getElementById("jumlah").value,
    tanggal_perolehan:
      document.getElementById("tanggalPerolehan").value || null,
    keterangan: document.getElementById("keterangan").value || null,
  };

  if (id) {
    payload.kode_aset = document.getElementById("kodeAset").value;
  }

  const url = id ? `${API_BASE_URL}/assets/${id}` : `${API_BASE_URL}/assets`;
  const method = id ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const firstError = data.errors
      ? Object.values(data.errors)[0][0]
      : data.message;
    formError.textContent = firstError || "Gagal menyimpan data.";
    return;
  }

  showToast(id ? "Aset berhasil diperbarui." : "Aset berhasil ditambahkan.");
  closeModal();
  loadStats();
  loadAssets();
  loadChart();
  loadRecentActivity();
});

async function loadStats() {
  const stats = await apiFetch("/dashboard/stats");

  document.getElementById("statTotalAset").textContent = stats.total_aset;
  document.getElementById("statTotalItem").textContent = stats.total_item;
  document.getElementById("statKondisiBaik").textContent = stats.kondisi.baik;
  document.getElementById("statKondisiRusak").textContent =
    Number(stats.kondisi.rusak_ringan) + Number(stats.kondisi.rusak_berat);
}

let kondisiChartInstance = null;
let kategoriChartInstance = null;

async function loadChart() {
  const stats = await apiFetch("/dashboard/stats");

  const kondisiValues = [
    Number(stats.kondisi.baik),
    Number(stats.kondisi.rusak_ringan),
    Number(stats.kondisi.rusak_berat),
  ];

  if (kondisiChartInstance) {
    kondisiChartInstance.data.datasets[0].data = kondisiValues;
    kondisiChartInstance.update();
  } else {
    kondisiChartInstance = new Chart(document.getElementById("kondisiChart"), {
      type: "doughnut",
      data: {
        labels: ["Baik", "Rusak ringan", "Rusak berat"],
        datasets: [
          {
            data: kondisiValues,
            backgroundColor: ["#3F6E52", "#B08A2E", "#A1453B"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { family: "Inter", size: 12 }, padding: 12 },
          },
        },
      },
    });
  }

  const kategoriLabels = stats.aset_per_kategori.map((k) => k.nama_kategori);
  const kategoriValues = stats.aset_per_kategori.map((k) => Number(k.total));

  if (kategoriChartInstance) {
    kategoriChartInstance.data.labels = kategoriLabels;
    kategoriChartInstance.data.datasets[0].data = kategoriValues;
    kategoriChartInstance.update();
  } else {
    kategoriChartInstance = new Chart(
      document.getElementById("kategoriChart"),
      {
        type: "bar",
        data: {
          labels: kategoriLabels,
          datasets: [
            {
              data: kategoriValues,
              backgroundColor: "#9C6B2E",
              borderRadius: 6,
              maxBarThickness: 40,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      },
    );
  }
}

async function loadRecentActivity() {
  const result = await apiFetch("/assets");
  const recent = result.data.slice(0, 5);
  const list = document.getElementById("activityList");

  if (!list) return;

  if (recent.length === 0) {
    list.innerHTML =
      '<p class="empty-state" style="border:none;margin:0;padding:1rem 0;">Belum ada aktivitas.</p>';
    return;
  }

  list.innerHTML = recent
    .map(
      (asset) => `
        <div class="activity-item">
            <div class="activity-icon">
                <svg class="icon" viewBox="0 0 24 24"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
            </div>
            <div class="activity-body">
                <div class="activity-title">${asset.nama_aset} <span class="tag-code" style="font-size:0.7rem;">${asset.kode_aset}</span></div>
                <div class="activity-meta">Ditambahkan oleh ${asset.created_by} · ${kondisiLabel(asset.kondisi)}</div>
            </div>
        </div>
    `
    )
    .join("");
}

loadAssets();
loadCategoriesForFilter();
loadStats();
loadChart();
loadRecentActivity();