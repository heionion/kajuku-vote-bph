// Import Firebase SDK dari CDN resmi
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- MASUKKAN CONFIG FIREBASE KAMU DI SINI ---
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAH6CwWtmE27SHd0BUKgZLxE-xCWf3Wqng",
  authDomain: "e-kajuku-vote.firebaseapp.com",
  projectId: "e-kajuku-vote",
  storageBucket: "e-kajuku-vote.firebasestorage.app",
  messagingSenderId: "791524112099",
  appId: "1:791524112099:web:588600c24f60119122f7d6",
  measurementId: "G-J8RCNXDHCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const ADMIN_PASSWORD = "admin123";
const docRef = doc(db, "voting_data", "hasil_suara");

let voteData = {
  'Kandidat 1': 0,
  'Kandidat 2': 0,
  'Kandidat 3': 0
};

let voteChart = null;

// Cek apakah perangkat ini sudah pernah memilih
window.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('hasVoted_v3_candidates') === 'true') {
    lockVotingInterface();
  }

  // Ambil data awal dari Firebase & pasang Real-time Listener (onSnapshot)
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      voteData = docSnap.data();
      if (voteChart) {
        updateChart();
      }
    } else {
      // Jika dokumen belum ada di database, buat data awal 0
      setDoc(docRef, voteData);
    }
  });
});

// Fungsi Submit Vote
window.submitVote = async function(candidate) {
  if (localStorage.getItem('hasVoted_v3_candidates') === 'true') {
    alert("Kamu sudah memberikan suara sebelumnya!");
    return;
  }

  const konfirmasi = confirm(`Apakah kamu yakin ingin memilih ${candidate}?\nPilihan tidak dapat diubah setelah dikonfirmasi.`);
  if (!konfirmasi) return;

  try {
    // Ambil data terbaru langsung dari Firestore untuk menghindari bentrok
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let currentData = docSnap.data();
      currentData[candidate]++;

      // Update data ke Firestore Cloud
      await updateDoc(docRef, currentData);
      
      // Simpan status di perangkat lokal agar tidak bisa vote 2 kali
      localStorage.setItem('hasVoted_v3_candidates', 'true');
      lockVotingInterface();
      
      alert(`Berhasil! Pilihan kamu untuk ${candidate} telah tersimpan secara online.`);
    }
  } catch (error) {
    console.error("Gagal mengirim suara: ", error);
    alert("Terjadi kesalahan koneksi. Coba lagi.");
  }
};

function lockVotingInterface() {
  document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
  const statusEl = document.getElementById('voteStatus');
  if(statusEl) statusEl.style.display = 'block';
}

window.toggleAdminPanel = function() {
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
    } else if (inputPassword !== null) {
      alert("Password salah!");
    }
  } else {
    panel.style.display = 'none';
    btn.innerHTML = "<span>🔒</span> Panel Khusus Admin";
  }
};

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
  if (voteChart) {
    voteChart.data.datasets[0].data = Object.values(voteData);
    voteChart.update();
  }
}

window.exportToExcel = function() {
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
};

window.resetVotes = async function() {
  if (confirm("Reset seluruh data suara di server dan buka kembali akses voting?")) {
    const resetData = { 'Kandidat 1': 0, 'Kandidat 2': 0, 'Kandidat 3': 0 };
    await setDoc(docRef, resetData);
    localStorage.removeItem('hasVoted_v3_candidates');
    alert("Data berhasil direset dari server!");
    location.reload();
  }
};