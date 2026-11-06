const ADMIN_PASSWORD = "admin123";

let voteData = JSON.parse(localStorage.getItem('voteData_v3_candidates')) || {
  'Kandidat 1': 0,
  'Kandidat 2': 0,
  'Kandidat 3': 0
};

let voteChart = null;

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('hasVoted_v3_candidates') === 'true') {
    lockVotingInterface();
  }
});

// Fitur Real-time: Mendengarkan perubahan localStorage dari tab/browser lain
window.addEventListener('storage', (event) => {
  if (event.key === 'voteData_v3_candidates') {
    voteData = JSON.parse(event.newValue);
    if (voteChart) {
      updateChart();
    }
  }
});

function submitVote(candidate) {
  if (localStorage.getItem('hasVoted_v3_candidates') === 'true') {
    alert("Kamu sudah memberikan suara sebelumnya!");
    return;
  }

  const konfirmasi = confirm(`Apakah kamu yakin ingin memilih ${candidate}?\nPilihan tidak dapat diubah setelah dikonfirmasi.`);
  if (!konfirmasi) return;

  // Ambil data terbaru dari localStorage
  let currentData = JSON.parse(localStorage.getItem('voteData_v3_candidates')) || voteData;
  currentData[candidate]++;
  
  voteData = currentData;
  localStorage.setItem('voteData_v3_candidates', JSON.stringify(voteData));
  localStorage.setItem('hasVoted_v3_candidates', 'true');
  
  lockVotingInterface();

  if (voteChart) {
    updateChart();
  }
}

function lockVotingInterface() {
  document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
  document.getElementById('voteStatus').style.display = 'block';
}

function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  const btn = document.getElementById('toggleAdminBtn');
  
  if (panel.style.display !== 'block') {
    const inputPassword = prompt("Masukkan password admin:");
    if (inputPassword === ADMIN_PASSWORD) {
      panel.style.display = 'block';
      btn.innerHTML = "<span>🔒</span> Keluar Panel Admin";
      if (!voteChart) {
        initChart();
      } else {
        updateChart();
      }
      
      // Mulai pengecekan real-time setiap 1 detik
      startRealtimePolling();

    } else if (inputPassword !== null) {
      alert("Password salah!");
    }
  } else {
    panel.style.display = 'none';
    btn.innerHTML = "<span>🔒</span> Panel Khusus Admin";
    stopRealtimePolling();
  }
}

let pollingInterval = null;

function startRealtimePolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => {
    const latestData = JSON.parse(localStorage.getItem('voteData_v3_candidates'));
    if (latestData) {
      if (JSON.stringify(latestData) !== JSON.stringify(voteData)) {
        voteData = latestData;
        if (voteChart) {
          updateChart();
        }
      }
    }
  }, 1000); // Cek otomatis tiap 1 detik
}

function stopRealtimePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function initChart() {
  const ctx = document.getElementById('voteChart').getContext('2d');
  voteChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(voteData),
      datasets: [{
        label: 'Jumlah Suara',
        data: Object.values(voteData),
        backgroundColor: ['#ff3b5c', '#f59e0b', '#d97706'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { 
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function updateChart() {
  voteChart.data.datasets[0].data = Object.values(voteData);
  voteChart.update();
}

function exportToExcel() {
  const total = voteData['Kandidat 1'] + voteData['Kandidat 2'] + voteData['Kandidat 3'];
  const dataArray = [
    ["Kandidat", "Jumlah Suara"],
    ["Kandidat 1", voteData['Kandidat 1']],
    ["Kandidat 2", voteData['Kandidat 2']],
    ["Kandidat 3", voteData['Kandidat 3']],
    ["Total Suara", total]
  ];

  const ws = XLSX.utils.aoa_to_sheet(dataArray);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hasil Voting 3 Kandidat");
  XLSX.writeFile(wb, "Hasil_Voting_3_Kandidat.xlsx");
}

function resetVotes() {
  if (confirm("Reset seluruh data suara dan buka kembali akses voting?")) {
    voteData = { 'Kandidat 1': 0, 'Kandidat 2': 0, 'Kandidat 3': 0 };
    localStorage.setItem('voteData_v3_candidates', JSON.stringify(voteData));
    localStorage.removeItem('hasVoted_v3_candidates');
    alert("Data berhasil direset!");
    location.reload();
  }
}