document.addEventListener("DOMContentLoaded", function () {
    // If the photobooth video element exists, run the Photobooth code.
    if (document.getElementById("video")) {
      runPhotobooth();
    }
    // If the canvas element exists, run the Photostrip code.
    if (document.getElementById("canvas")) {
      runPhotostrip();
    }
  });
  
  /* ------------------- Photobooth  ------------------- */
  function runPhotobooth() {
    const video = document.getElementById("video");
    const startButton = document.getElementById("startCapture");
    const countdownText = document.getElementById("countdown");
    const flashEffect = document.querySelector(".flash");
    let images = [];
  
    navigator.mediaDevices
      .getUserMedia({
        video: true
      })
      .then((stream) => {
        video.srcObject = stream;
        const settings = stream.getVideoTracks()[0].getSettings();
        video.dataset.width = settings.width;
        video.dataset.height = settings.height;
      })
      .catch((err) => console.error("Error accessing camera:", err));
  
    function capturePhoto() {
      const canvas = document.createElement("canvas");
      canvas.width = video.dataset.width;
      canvas.height = video.dataset.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      images.push(imageData);
  
      flashEffect.style.opacity = 1;
      setTimeout(() => {
        flashEffect.style.opacity = 0;
      }, 200);
    }
  
    startButton.addEventListener("click", () => {
      startButton.disabled = true;
      images = [];
      captureWithCountdown(3);
    });
  
    function captureWithCountdown(count, shots = 3) {
      if (shots === 0) {
        localStorage.setItem("capturedPhotos", JSON.stringify(images));
        window.location.href = "photostrip.html";
        return;
      }
      countdownText.style.display = "block";
      countdownText.innerText = count;
  
      if (count > 0) {
        setTimeout(() => captureWithCountdown(count - 1, shots), 1000);
      } else {
        countdownText.style.display = "none";
        capturePhoto();
        setTimeout(() => captureWithCountdown(3, shots - 1), 1000);
      }
    }
  }
  
  /* ------------------- Photostrip ------------------- */
  function runPhotostrip() {
    // Back button functionality
    const backButton = document.querySelector(".back-button");
    if (backButton) {
      backButton.addEventListener("click", function () {
        window.location.href = "index.html";
      });
    }
  
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const images = JSON.parse(localStorage.getItem("capturedPhotos")) || [];
    let filter = "none";
    let frameColor = "#ffffff";
  
    const frameColorInput = document.getElementById("frameColor");
    if (frameColorInput) {
      frameColorInput.addEventListener("input", (event) => {
        frameColor = event.target.value;
        const strip = document.getElementById("strip");
        if (strip) {
          strip.style.background = frameColor;
        }
        drawPhotostrip();
      });
    }
  
    function drawPhotostrip() {
      if (images.length === 0) return;
  
      const stripWidth = Math.min(250, window.innerWidth * 0.9);
      const maxStripHeight = window.innerHeight * 0.95; 
      const spacing = 10; // Space between images
      const margin = 10; // Margin around the strip
      const bottomMargin = 80; // Extra space at the bottom
  
      const scaledImages = images.map((imgSrc) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = imgSrc;
          img.onload = () => {
            const aspectRatio = (img.width / img.height) * 1;
            const scaledHeight = stripWidth / aspectRatio;
            resolve({ img, scaledHeight, aspectRatio });
          };
        });
      });
  
      Promise.all(scaledImages).then((imageData) => {
        // Calculate total height required for all images
        let totalHeight = imageData.reduce(
          (sum, { scaledHeight }) => sum + scaledHeight,
          0
        );
        totalHeight += (images.length - 1) * spacing;
        totalHeight += margin * 2;
        totalHeight += bottomMargin;
  
        
        if (totalHeight > maxStripHeight) {
          const scaleFactor = maxStripHeight / totalHeight;
          imageData = imageData.map(({ img, scaledHeight, aspectRatio }) => ({
            img,
            scaledHeight: scaledHeight * scaleFactor,
            aspectRatio,
          }));
          totalHeight = maxStripHeight;
        }
  
        
        renderPhotostrip(imageData, totalHeight, stripWidth, spacing, margin);
      });
    }
  
    function renderPhotostrip(images, totalHeight, width, spacing, margin) {
      canvas.width = width;
      canvas.height = totalHeight;
  
      // Fill the background with the frame color
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      let yOffset = margin;
  
      images.forEach(({ img, scaledHeight, aspectRatio }) => {
        const imgWidth = width - margin * 2;
        const imgHeight = imgWidth / aspectRatio;
  
        
        ctx.filter = filter === "none" ? "none" : `${filter}(1)`;
  
        ctx.drawImage(img, margin, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + spacing;
      });
    }
  
    function applyFilter(type) {
      filter = type;
      drawPhotostrip();
    }
  
    const saveButton = document.getElementById("saveButton");
    if (saveButton) {
      saveButton.addEventListener("click", function () {
        const link = document.createElement("a");
        link.download = "photostrip.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
    window.applyFilter = applyFilter;
  
    drawPhotostrip();
  }
  
