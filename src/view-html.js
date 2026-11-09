export const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>TV Player - Vídeos & Imagens</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html {
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .media-element {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.4s ease-in-out;
      background: #000;
    }

    .active {
      opacity: 1;
      z-index: 10;
    }

    /* Painel Flutuante de Controle de Áudio */
    #audioControls {
      position: absolute;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      padding: 10px 18px;
      border-radius: 40px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: translateY(10px);
    }

    #audioControls.show {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    #muteBtn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      outline: none;
    }

    #muteBtn svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    #volumeSlider {
      -webkit-appearance: none;
      width: 90px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.3);
      outline: none;
      cursor: pointer;
    }

    #volumeSlider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
    }

    #status {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #777;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div id="status">Carregando mídias...</div>
  
  <video id="videoEl" class="media-element" playsinline></video>
  <img id="imageEl" class="media-element" alt="Slide" />

  <div id="audioControls">
    <button id="muteBtn" title="Ativar/Desativar Som">
      <svg id="iconVolumeHigh" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
      <svg id="iconVolumeMuted" viewBox="0 0 24 24" style="display: none;">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
    </button>
    <input id="volumeSlider" type="range" min="0" max="1" step="0.05" value="1" />
  </div>

  <script>
    const videoEl = document.getElementById('videoEl');
    const imageEl = document.getElementById('imageEl');
    const statusEl = document.getElementById('status');
    const audioControls = document.getElementById('audioControls');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const iconHigh = document.getElementById('iconVolumeHigh');
    const iconMuted = document.getElementById('iconVolumeMuted');

    let playlist = [];
    let currentIndex = 0;
    let imageTimer = null;
    let hideControlsTimeout = null;

    videoEl.volume = 1;
    videoEl.muted = false;

    function updateIcons() {
      if (videoEl.muted || videoEl.volume === 0) {
        iconHigh.style.display = 'none';
        iconMuted.style.display = 'block';
      } else {
        iconHigh.style.display = 'block';
        iconMuted.style.display = 'none';
      }
    }

    muteBtn.addEventListener('click', () => {
      videoEl.muted = !videoEl.muted;
      updateIcons();
    });

    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      videoEl.volume = val;
      videoEl.muted = (val === 0);
      updateIcons();
    });

    function isCurrentMediaVideo() {
      return playlist[currentIndex] && playlist[currentIndex].type === 'video';
    }

    function showControlsBriefly() {
      if (!isCurrentMediaVideo()) return;

      audioControls.classList.add('show');
      document.body.style.cursor = 'default';

      clearTimeout(hideControlsTimeout);
      hideControlsTimeout = setTimeout(() => {
        audioControls.classList.remove('show');
        document.body.style.cursor = 'none';
      }, 3500);
    }

    window.addEventListener('mousemove', showControlsBriefly);

    async function loadPlaylist() {
      try {
        const res = await fetch('/api/playlist');
        const data = await res.json();
        playlist = data.playlist;

        if (playlist.length === 0) {
          statusEl.innerText = 'Nenhuma mídia encontrada na pasta /media';
          return;
        }

        statusEl.style.display = 'none';
        playItem();
      } catch (err) {
        statusEl.innerText = 'Falha ao conectar. Tentando novamente...';
        setTimeout(loadPlaylist, 5000);
      }
    }

    function playItem() {
      if (playlist.length === 0) return;
      if (imageTimer) clearTimeout(imageTimer);

      const item = playlist[currentIndex];
      const mediaUrl = '/media/' + encodeURIComponent(item.name);

      if (item.type === 'video') {
        imageEl.classList.remove('active');

        videoEl.src = mediaUrl;
        videoEl.load();

        videoEl.play().then(() => {
          videoEl.classList.add('active');
          showControlsBriefly();
        }).catch(err => {
          console.warn('Autoplay com som recusado pelo navegador. Mudo provisório ativado.', err);
          videoEl.muted = true;
          updateIcons();
          videoEl.play();
          videoEl.classList.add('active');
          showControlsBriefly();
        });

      } else if (item.type === 'image') {
        audioControls.classList.remove('show');
        document.body.style.cursor = 'none';

        videoEl.pause();
        videoEl.classList.remove('active');

        imageEl.src = mediaUrl;
        imageEl.onload = () => {
          imageEl.classList.add('active');
          imageTimer = setTimeout(nextItem, item.duration || 10000);
        };
        imageEl.onerror = () => nextItem();
      }
    }

    function nextItem() {
      currentIndex++;
      if (currentIndex >= playlist.length) {
        currentIndex = 0;
      }
      playItem();
    }

    videoEl.addEventListener('ended', nextItem);
    videoEl.addEventListener('error', nextItem);

    loadPlaylist();
  </script>
</body>
</html>
`;