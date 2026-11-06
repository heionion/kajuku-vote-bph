function switchCandidate(candNum) {
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`card-candidate-${i}`).classList.remove('active');
    const btn = document.querySelectorAll('.tab-btn')[i-1];
    btn.className = "tab-btn";
  }

  document.getElementById(`card-candidate-${candNum}`).classList.add('active');
  const activeBtn = document.querySelectorAll('.tab-btn')[candNum-1];
  activeBtn.className = `tab-btn active-${candNum}`;
}

function switchSubTab(candNum, tabName, btnElement) {
  const parentCard = document.getElementById(`card-candidate-${candNum}`);
  const buttons = parentCard.querySelectorAll('.sub-btn');
  const contents = parentCard.querySelectorAll('.tab-content');

  buttons.forEach(btn => btn.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  btnElement.classList.add('active');
  document.getElementById(`${candNum}-${tabName}`).classList.add('active');
}