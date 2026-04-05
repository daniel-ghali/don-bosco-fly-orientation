
window.handleMenuClick = function (event) {

};

let signatureCtx = null;
let signatureCanvas = null;

function getSignature2dContext(canvas) {
  try {
    return canvas.getContext('2d', { alpha: true, desynchronized: true }) || canvas.getContext('2d');
  } catch (e) {
    return canvas.getContext('2d');
  }
}

window.clearSignaturePad = function () {
  if (signatureCanvas && signatureCtx) {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  } else {
    const canvas = document.getElementById('signaturePad');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
};

function resetToStartMenu() {
  const gameOverScreen = document.getElementById('gameOverScreen');
  gameOverScreen.classList.remove('active');
  gameOverScreen.style.display = 'none';


  window.clearSignaturePad();

  document.getElementById('playerName').value = '';


  resetGame();
  if (typeof hideReplay === 'function') hideReplay();

  document.getElementById('startMenu').style.display = 'flex';
  document.getElementById('initialMenu').style.display = 'block';
  document.getElementById('handLoadingMenu').style.display = 'none';
  document.getElementById('startHandBtn').style.display = 'none';
  window.isHandTrackingReady = false;

  if (typeof game !== 'undefined') {
    game.status = "waitingStart";
  }
}

window.cancelGame = function () {
  resetToStartMenu();
};

function applySignatureStrokeStyle(ctx) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.strokeStyle = '#59332e';
  ctx.lineWidth = Math.max(2, 2 * dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function resizeSignatureCanvasForDisplay() {
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.min(Math.ceil(rect.width * dpr), 2400));
  const h = Math.max(1, Math.min(Math.ceil(rect.height * dpr), 1200));
  if (canvas.width === w && canvas.height === h && signatureCtx) return;
  canvas.width = w;
  canvas.height = h;
  signatureCtx = getSignature2dContext(canvas);
  applySignatureStrokeStyle(signatureCtx);
  signatureCanvas = canvas;
}

window.showGameOverScreen = function () {

  setTimeout(function () {
    const gameOverScreen = document.getElementById('gameOverScreen');


    const dist = document.getElementById('distValue').innerText;
    const level = document.getElementById('levelValue').innerText;
    document.getElementById('finalScoreDisplay').innerText = `Distance: ${dist} | Level: ${level}`;


    gameOverScreen.style.display = 'flex';


    requestAnimationFrame(function () {
      gameOverScreen.classList.add('active');

      requestAnimationFrame(function () {
        resizeSignatureCanvasForDisplay();
      });
    });
  }, 3000);
};

let isHandDrawing = false;
let lastStrokeX = 0;
let lastStrokeY = 0;

function loopHandSignature() {
  const canvas = signatureCanvas || document.getElementById('signaturePad');
  const ctx = signatureCtx;
  const cursor = document.getElementById('handCursor');

  if (canvas && ctx && window.handGesture && window.handGesture.x !== undefined) {
    const rect = canvas.getBoundingClientRect();
    const x = window.handGesture.x * canvas.width;
    const y = window.handGesture.y * canvas.height;

    if (cursor) {
      cursor.style.display = 'block';
      cursor.style.left = (rect.left + window.handGesture.x * rect.width - 10) + 'px';
      cursor.style.top = (rect.top + window.handGesture.y * rect.height - 10) + 'px';
      if (window.handGesture.isPinching) {
        cursor.classList.add('pinching');
      } else {
        cursor.classList.remove('pinching');
      }
    }

    if (window.handGesture.isPinching) {
      if (!isHandDrawing) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastStrokeX = x;
        lastStrokeY = y;
        isHandDrawing = true;
      } else {
        const midX = (lastStrokeX + x) * 0.5;
        const midY = (lastStrokeY + y) * 0.5;
        ctx.quadraticCurveTo(lastStrokeX, lastStrokeY, midX, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        lastStrokeX = x;
        lastStrokeY = y;
      }
    } else if (isHandDrawing) {
      ctx.beginPath();
      isHandDrawing = false;
    }
  } else if (cursor) {
    cursor.style.display = 'none';
  }
  requestAnimationFrame(loopHandSignature);
}

window.submitScore = function () {
  const name = document.getElementById('playerName').value;
  if (!name) {
    alert("Please enter your name!");
    return;
  }


  const existingCanvas = document.getElementById('signaturePad');
  const certificate = document.createElement('canvas');
  certificate.width = 1200;
  certificate.height = 800;
  const ctx = certificate.getContext('2d');


  const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
  gradient.addColorStop(0, '#f7d9aa');
  gradient.addColorStop(1, '#d1b790');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 800);


  ctx.strokeStyle = '#59332e';
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, 1120, 720);


  ctx.fillStyle = '#59332e';
  ctx.textAlign = 'center';
  ctx.font = 'bold 80px Playfair Display, serif';
  ctx.fillText('FLIGHT CERTIFICATE', 600, 150);

  ctx.font = '50px Playfair Display, serif';
  ctx.fillText(`Pilot: ${name}`, 600, 250);

  const dist = document.getElementById('distValue').innerText;
  const level = document.getElementById('levelValue').innerText;
  ctx.fillText(`Distance: ${dist} | Level: ${level}`, 600, 320);


  ctx.font = 'italic 30px Playfair Display, serif';
  ctx.fillText('Signature:', 600, 400);
  ctx.drawImage(existingCanvas, 0, 100, existingCanvas.width, existingCanvas.height - 200, 100, 420, 1000, 300);


  const certLink = document.createElement('a');
  certLink.download = `${name}.png`;
  certLink.href = certificate.toDataURL('image/png');
  certLink.click();



  resetToStartMenu();
};

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;
  signatureCanvas = canvas;
  signatureCtx = getSignature2dContext(canvas);
  applySignatureStrokeStyle(signatureCtx);

  let drawing = false;

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startPosition(e) {
    drawing = true;
    const pos = getMousePos(e);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
    draw(e);
  }

  function endPosition() {
    drawing = false;
    signatureCtx.beginPath();
  }

  function draw(e) {
    if (!drawing) return;
    if (e.type === 'touchmove' && e.cancelable) e.preventDefault();

    const pos = getMousePos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();

    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
  }


  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseout', endPosition);


  canvas.addEventListener('touchstart', startPosition, { passive: false });
  canvas.addEventListener('touchend', endPosition);
  canvas.addEventListener('touchmove', draw, { passive: false });


  loopHandSignature();
});
