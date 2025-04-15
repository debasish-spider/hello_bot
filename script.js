const target = document.querySelector('.nxt-listing-title');

if (target) {
  const newDiv = document.createElement('div');
  newDiv.className = 'tm-test';
  newDiv.style.fontWeight = 'bold';
  newDiv.textContent = 'hello world';
  
  target.appendChild(newDiv);
}
const theme = "CODE PRESENT";
