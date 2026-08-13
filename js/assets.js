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