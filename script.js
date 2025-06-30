const video = document.getElementById('video');
const emojiDiv = document.getElementById('emoji');

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam:", err);
  }
}

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models/tiny_face_detector_model');
  await faceapi.nets.faceExpressionNet.loadFromUri('./models/face_expression_model');
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.getElementById('video-container').append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (detections[0]) {
      const expressions = detections[0].expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).find(
        (item) => expressions[item] === maxValue
      );
      emojiDiv.textContent = getEmoji(emotion);
    } else {
      emojiDiv.textContent = "";
    }
  }, 500);
});

function getEmoji(emotion) {
  switch (emotion) {
    case 'happy':
      return '😄';
    case 'sad':
      return '😢';
    case 'angry':
      return '😠';
    case 'surprised':
      return '😲';
    case 'disgusted':
      return '🤢';
    case 'fearful':
      return '😨';
    case 'neutral':
      return '😐';
    default:
      return '';
  }
}

// Start everything
(async () => {
  await loadModels();
  startVideo();
})();
