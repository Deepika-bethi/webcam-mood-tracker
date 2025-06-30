// Load the models before starting the video
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models/tiny_face_detector_model');
  await faceapi.nets.faceExpressionNet.loadFromUri('./models/face_expression_model');
}

async function startVideo() {
  const video = document.getElementById('video');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    console.error('Error accessing webcam:', err);
  }
}

function getEmoji(expression) {
  switch (expression) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'angry':
      return '😠';
    case 'surprised':
      return '😲';
    case 'neutral':
      return '😐';
    case 'disgusted':
      return '🤢';
    case 'fearful':
      return '😱';
    default:
      return '';
  }
}

async function onPlay() {
  const video = document.getElementById('video');
  const emojiDiv = document.getElementById('emoji');

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(emojiDiv, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();

    if (detections) {
      const expressions = detections.expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const dominantExpression = Object.keys(expressions).find(
        item => expressions[item] === maxValue
      );

      emojiDiv.textContent = getEmoji(dominantExpression);
    } else {
      emojiDiv.textContent = '';
    }
  }, 500);
}

// Initialize
loadModels().then(() => {
  startVideo();
  document.getElementById('video').addEventListener('play', onPlay);
});
