const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = { kategori: document.getElementById('tabKategori'), lokasi: document.getElementById('tabLokasi') };

tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(tabPanels).forEach((panel) => (panel.style.display = 'none'));
        tabPanels[btn.dataset.tab].style.display = 'block';
    });
});

async function apiRequest(endpoint, method = 'GET', body = null) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
    });

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    return { ok: response.ok, data: await response.json() };
}

async function loadCategories() {
    const { data } = await apiRequest('/categories');
    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = data.data.map((cat) => `
        <tr>
            <td>${cat.nama_kategori}</td>
            <td>${cat.total_aset ?? 0}</td>
            <td>
                <button onclick="editMaster('category', ${cat.id}, '${cat.nama_kategori}')">Edit</button>
                <button onclick="deleteMaster('category', ${cat.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

async function loadLocations() {
    const { data } = await apiRequest('/locations');
    const tbody = document.getElementById('locationTableBody');
    tbody.innerHTML = data.data.map((loc) => `
        <tr>
            <td>${loc.nama_ruangan}</td>
            <td>${loc.lokasi_gedung ?? '-'}</td>
            <td>${loc.total_aset ?? 0}</td>
            <td>
                <button onclick="editMaster('location', ${loc.id}, '${loc.nama_ruangan}', '${loc.lokasi_gedung ?? ''}')">Edit</button>
                <button onclick="deleteMaster('location', ${loc.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

const masterModal = document.getElementById('masterModal');
const masterForm = document.getElementById('masterForm');
const masterFormError = document.getElementById('masterFormError');

function openMasterModal(type, id = '', name = '', building = '') {
    document.getElementById('masterType').value = type;
    document.getElementById('masterId').value = id;
    document.getElementById('masterName').value = name;
    document.getElementById('masterBuilding').value = building;
    document.getElementById('masterModalTitle').textContent = id
        ? `Edit ${type === 'category' ? 'Kategori' : 'Lokasi'}`
        : `Tambah ${type === 'category' ? 'Kategori' : 'Lokasi'}`;
    document.getElementById('masterNameLabel').textContent = type === 'category' ? 'Nama Kategori' : 'Nama Ruangan';
    document.getElementById('masterBuildingGroup').style.display = type === 'location' ? 'block' : 'none';
    masterModal.style.display = 'flex';
}

function closeMasterModal() {
    masterModal.style.display = 'none';
    masterForm.reset();
    masterFormError.textContent = '';
}

function editMaster(type, id, name, building = '') {
    openMasterModal(type, id, name, building);
}

async function deleteMaster(type, id) {
    if (!confirm('Yakin hapus data ini?')) return;
    const endpoint = type === 'category' ? `/categories/${id}` : `/locations/${id}`;
    const { ok, data } = await apiRequest(endpoint, 'DELETE');
    if (!ok) {
        alert(data.message || 'Gagal menghapus data.');
        return;
    }
    type === 'category' ? loadCategories() : loadLocations();
}

masterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    masterFormError.textContent = '';

    const type = document.getElementById('masterType').value;
    const id = document.getElementById('masterId').value;
    const name = document.getElementById('masterName').value;
    const building = document.getElementById('masterBuilding').value;

    const endpoint = type === 'category'
        ? (id ? `/categories/${id}` : '/categories')
        : (id ? `/locations/${id}` : '/locations');

    const payload = type === 'category'
        ? { nama_kategori: name }
        : { nama_ruangan: name, lokasi_gedung: building || null };

    const { ok, data } = await apiRequest(endpoint, id ? 'PUT' : 'POST', payload);

    if (!ok) {
        const firstError = data.errors ? Object.values(data.errors)[0][0] : data.message;
        masterFormError.textContent = firstError || 'Gagal menyimpan data.';
        return;
    }

    closeMasterModal();
    type === 'category' ? loadCategories() : loadLocations();
});

loadCategories();
loadLocations();