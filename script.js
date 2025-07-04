let stream = null;
let detectionInterval = null;
let lastSpoken = '';
let selectedVoice = null;

// Load the voices and pick a female one
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  // Find the first female voice
  selectedVoice = voices.find(v => v.name.toLowerCase().includes('female')) 
                 || voices.find(v => v.name.toLowerCase().includes('woman')) 
                 || voices.find(v => v.gender === 'female') 
                 || voices[0]; // fallback to any voice
}

// Load the models
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models/tiny_face_detector_model');
  await faceapi.nets.faceExpressionNet.loadFromUri('./models/face_expression_model');
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

function speak(text) {
  if (text !== lastSpoken) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    speechSynthesis.speak(utterance);
    lastSpoken = text;
  }
}

async function startVideo() {
  const video = document.getElementById('video');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    video.addEventListener('play', () => {
      const emojiDiv = document.getElementById('emoji');
      const emotionTextDiv = document.getElementById('emotionText');

      detectionInterval = setInterval(async () => {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections) {
          const expressions = detections.expressions;
          const maxValue = Math.max(...Object.values(expressions));
          const dominantExpression = Object.keys(expressions).find(
            (e) => expressions[e] === maxValue
          );

          const emoji = getEmoji(dominantExpression);
          emojiDiv.textContent = emoji;
          emotionTextDiv.textContent = dominantExpression;

          speak(`You look ${dominantExpression}`);
        } else {
          emojiDiv.textContent = '';
          emotionTextDiv.textContent = '';
        }
      }, 1000);
    });
  } catch (err) {
    console.error('Error accessing webcam:', err);
  }
}

function stopVideo() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  const video = document.getElementById('video');
  video.srcObject = null;

  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }

  document.getElementById('emoji').textContent = '';
  document.getElementById('emotionText').textContent = '';
  lastSpoken = '';
}

// Initialize
document.getElementById('startBtn').addEventListener('click', async () => {
  await loadModels();
  loadVoices();
  startVideo();
});

document.getElementById('stopBtn').addEventListener('click', () => {
  stopVideo();
});

// Some browsers load voices asynchronously
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}
