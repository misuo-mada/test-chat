const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatOutput = document.getElementById('chat-output');






chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // ユーザーの入力を取得
  const message = userInput.value;
  userInput.value = '';

  // ユーザーのメッセージを右側に表示
  const userMessage = document.createElement('div');
  userMessage.classList.add('message', 'user'); // クラスを追加
  const userBubble = document.createElement('div');
  userBubble.classList.add('bubble'); // 吹き出し
  userBubble.textContent = message;
  userMessage.appendChild(userBubble);
  chatOutput.appendChild(userMessage);

  // チャット画面をスクロール
  chatOutput.scrollTop = chatOutput.scrollHeight;

  try {
    // サーバーにリクエストを送信
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message }),
    });

    const data = await response.json();

    // 相手（真島）のメッセージを左側に表示
    const characterMessage = document.createElement('div');
    characterMessage.classList.add('message', 'character'); // クラスを追加
    const characterBubble = document.createElement('div');
    characterBubble.classList.add('bubble'); // 吹き出し
    characterBubble.textContent = data.reply;
    characterMessage.appendChild(characterBubble);
    chatOutput.appendChild(characterMessage);

    // チャット画面をスクロール
    chatOutput.scrollTop = chatOutput.scrollHeight;
  } catch (error) {
    console.error('エラー:', error.message);
  }
});

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('file', document.getElementById('file').files[0]);
  formData.append('bullet', document.getElementById('as-bullets').checked);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
document.getElementById('summary-output').innerHTML = 
  (data.summary || data.error).replace(/\n/g, '<br>');

});

const bulletChecked = document.getElementById('as-bullets').checked;
formData.append('bullet', bulletChecked);
