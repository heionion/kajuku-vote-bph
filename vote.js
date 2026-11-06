// Import Firebase SDK dari CDN resmi
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// KONFIGURASI FIREBASE ANDA (SUDAH DIMASUKKAN)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAH6CwWtmE27SHd0BUKgZLxE-xCWf3Wqng",
  authDomain: "e-kajuku-vote.firebaseapp.com",
  projectId: "e-kajuku-vote",
  storageBucket: "e-kajuku-vote.firebasestorage.app",
  messagingSenderId: "791524112099",
  appId: "1:791524112099:web:588600c24f60119122f7d6",
};

let db = null;
let docRef = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  docRef = doc(db, "voting_data", "hasil_suara");
  console.log("Firebase berhasil diinisialisasi!");
} catch (e) {
  console.error("Gagal menginisialisasi Firebase:", e);
}

const ADMIN_PASSWORD = "admin123";
let voteData = {
  'Kandidat 1': 0,
  'Kandidat 2': 0,
  'Kandidat 3': 0
};
let voteChart = null;

// Saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('hasVoted_v3_candidates') === 'true') {
    lockVotingInterface();
  }

  if (docRef) {
    // Ambil data awal & pasang Real-time Listener dari Firebase Cloud
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        voteData = docSnap.data();
        if (voteChart) {
          updateChart();
        }
      } else {
        setDoc(docRef, voteData);
      }
    }, (error) => {
      console.error("Gagal mendengarkan data real-time:", error);
    });
  }
});

// Fungsi Submit Vote (Dijamin Global)
window.submitVote = async function(candidate) {
  if (localStorage.getItem('hasVoted_v3_candidates') === 'true') {
    alert("Kamu sudah memberikan suara sebelumnya!");
    return;
  }

  const konfirmasi = confirm(`Apakah kamu yakin ingin memilih ${candidate}?\nPilihan tidak dapat diubah setelah dikonfirmasi.`);
  if (!konfirmasi) return;

  if (!docRef) {
    alert("Koneksi database belum siap.");
    return;
  }

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let currentData = docSnap.data();
      currentData[candidate]++;

      await updateDoc(docRef, currentData);
      localStorage.setItem('hasVoted_v3_candidates', 'true');
      lockVotingInterface();
      
      alert(`Berhasil! Pilihan kamu untuk ${candidate} telah tersimpan secara online.`);
    }
  } catch (error) {
    console.error("Gagal mengirim suara: ", error);
    alert("Terjadi kesalahan koneksi ke database. Cek Console (F12) untuk detailnya.");
  }
};

function lockVotingInterface() {
  document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
  const statusEl = document.getElementById('voteStatus');
  if(statusEl) statusEl.style.display = 'block';
}

// Fungsi Admin Panel (Dijamin Global)
window.toggleAdminPanel = function() {
  const panel = document.getElementById('adminPanel');
  const btn = document.getElementById('toggleAdminBtn');
  
  if (panel.style.display !== 'block') {
    const inputPassword = prompt("Masukkan password admin:");
    if (inputPassword === ADMIN_PASSWORD) {
      panel.style.display = 'block';
      if(btn) btn.innerHTML = "<span>🔒</span> Keluar Panel Admin";
      if (!voteChart) {
        initChart();
      } else {
        updateChart();
      }
    } else if (inputPassword !== null) {
      alert("Password salah!");
    }
  } else {
    panel.style.display = 'none';
    if(btn) btn.innerHTML = "<span>🔒</span> Panel Khusus Admin";
  }
};

function initChart() {
  const canvasElement = document.getElementById('voteChart');
  if (!canvasElement) return;
  
  const ctx = canvasElement.getContext('2d');
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
  if (voteChart) {
    voteChart.data.datasets[0].data = Object.values(voteData);
    voteChart.update();
  }
}

// Fungsi Export Excel (Dijamin Global)
window.exportToExcel = function() {
  const total = (voteData['Kandidat 1'] || 0) + (voteData['Kandidat 2'] || 0) + (voteData['Kandidat 3'] || 0);
  const dataArray = [
    ["Kandidat", "Jumlah Suara"],
    ["Kandidat 1", voteData['Kandidat 1'] || 0],
    ["Kandidat 2", voteData['Kandidat 2'] || 0],
    ["Kandidat 3", voteData['Kandidat 3'] || 0],
    ["Total Suara", total]
  ];

  const ws = XLSX.utils.aoa_to_sheet(dataArray);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hasil Voting 3 Kandidat");
  XLSX.writeFile(wb, "Hasil_Voting_3_Kandidat.xlsx");
};

// Fungsi Reset Suara (Dijamin Global)
window.resetVotes = async function() {
  if (!docRef) return;
  if (confirm("Reset seluruh data suara di server dan buka kembali akses voting?")) {
    const resetData = { 'Kandidat 1': 0, 'Kandidat 2': 0, 'Kandidat 3': 0 };
    await setDoc(docRef, resetData);
    localStorage.removeItem('hasVoted_v3_candidates');
    alert("Data berhasil direset dari server!");
    location.reload();
  }
};
