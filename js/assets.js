const tableBody = document.getElementById('assetTableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

document.getElementById('userName').textContent = user.name;

async function apiFetch(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    return response.json();
}

function kondisiLabel(kondisi) {
    const map = {
        baik: 'Baik',
        rusak_ringan: 'Rusak ringan',
        rusak_berat: 'Rusak berat',
    };
    return map[kondisi] || kondisi;
}

async function loadAssets() {
    const search = searchInput.value;
    const categoryId = categoryFilter.value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('category_id', categoryId);

    const result = await apiFetch(`/assets?${params.toString()}`);
    const assets = result.data;

    tableBody.innerHTML = '';
    emptyState.style.display = assets.length === 0 ? 'block' : 'none';

    assets.forEach((asset) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.kode_aset}</td>
            <td>${asset.nama_aset}</td>
            <td>${asset.category.nama_kategori}</td>
            <td>${asset.location.nama_ruangan}</td>
            <td>${kondisiLabel(asset.kondisi)}</td>
            <td>${asset.jumlah}</td>
            <td>
                ${user.role === 'admin' ? `
                    <button onclick="editAsset(${asset.id})">Edit</button>
                    <button onclick="deleteAsset(${asset.id})">Hapus</button>
                ` : '-'}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadCategoriesForFilter() {
    const result = await apiFetch('/categories');
    result.data.forEach((cat) => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nama_kategori;
        categoryFilter.appendChild(option);
    });
}

async function deleteAsset(id) {
    if (!confirm('Yakin hapus aset ini?')) return;

    await fetch(`${API_BASE_URL}/assets/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });

    loadAssets();
}

searchInput.addEventListener('input', () => loadAssets());
categoryFilter.addEventListener('change', () => loadAssets());

loadAssets();
loadCategoriesForFilter();

const modal = document.getElementById('assetModal');
const modalTitle = document.getElementById('modalTitle');
const assetForm = document.getElementById('assetForm');
const formError = document.getElementById('formError');
let allCategories = [];
let allLocations = [];

async function loadFormDropdowns() {
    const catResult = await apiFetch('/categories');
    allCategories = catResult.data;
    document.getElementById('categoryId').innerHTML = allCategories
        .map(c => `<option value="${c.id}">${c.nama_kategori}</option>`)
        .join('');

    const locResult = await apiFetch('/locations');
    allLocations = locResult.data;
    document.getElementById('locationId').innerHTML = allLocations
        .map(l => `<option value="${l.id}">${l.nama_ruangan}</option>`)
        .join('');
}

function openModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    assetForm.reset();
    document.getElementById('assetId').value = '';
    formError.textContent = '';
}

document.getElementById('btnTambah').addEventListener('click', async () => {
    modalTitle.textContent = 'Tambah Aset';
    await loadFormDropdowns();
    openModal();
});

async function editAsset(id) {
    modalTitle.textContent = 'Edit Aset';
    await loadFormDropdowns();

    const result = await apiFetch(`/assets/${id}`);
    const asset = result.data;

    document.getElementById('assetId').value = asset.id;
    document.getElementById('kodeAset').value = asset.kode_aset;
    document.getElementById('namaAset').value = asset.nama_aset;
    document.getElementById('categoryId').value = asset.category.id;
    document.getElementById('locationId').value = asset.location.id;
    document.getElementById('kondisi').value = asset.kondisi;
    document.getElementById('jumlah').value = asset.jumlah;
    document.getElementById('tanggalPerolehan').value = asset.tanggal_perolehan || '';
    document.getElementById('keterangan').value = asset.keterangan || '';

    openModal();
}

assetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    const id = document.getElementById('assetId').value;
    const payload = {
        kode_aset: document.getElementById('kodeAset').value,
        nama_aset: document.getElementById('namaAset').value,
        category_id: document.getElementById('categoryId').value,
        location_id: document.getElementById('locationId').value,
        kondisi: document.getElementById('kondisi').value,
        jumlah: document.getElementById('jumlah').value,
        tanggal_perolehan: document.getElementById('tanggalPerolehan').value || null,
        keterangan: document.getElementById('keterangan').value || null,
    };

    const url = id ? `${API_BASE_URL}/assets/${id}` : `${API_BASE_URL}/assets`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        const firstError = data.errors
            ? Object.values(data.errors)[0][0]
            : data.message;
        formError.textContent = firstError || 'Gagal menyimpan data.';
        return;
    }

    closeModal();
    loadAssets();
});