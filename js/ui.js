function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
            <div class="confirm-box">
                <p>${message}</p>
                <div class="confirm-actions">
                    <button type="button" class="btn-ghost" id="confirmCancel">Batal</button>
                    <button type="button" class="btn-primary" id="confirmOk">Ya, lanjutkan</button>
                </div>
            </div>
        `;
    document.body.appendChild(overlay);

    overlay.querySelector("#confirmCancel").onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.querySelector("#confirmOk").onclick = () => {
      overlay.remove();
      resolve(true);
    };
  });
}