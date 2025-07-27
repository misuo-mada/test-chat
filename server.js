import express from 'express';
import 'dotenv/config';
import { Configuration, OpenAIApi } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ミドルウェア
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// チャットエンドポイント
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  let contextText = '';

  try {
    contextText = fs.readFileSync('uploads/latest_text.txt', 'utf8');
  } catch {
    contextText = '(アップロードされた文書が見つかりませんでした)';
  }

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `以下の文書を参照して質問に答えてください：\n${contextText}` },
        { role: 'user', content: prompt }
      ]
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error('質問エラー:', error);
    res.status(500).json({ error: '処理中にエラーが発生しました。' });
  }
});

// アップロード＆要約/箇条書きエンドポイント
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const bulletMode = req.body.bullet === 'true';
    let text = '';

    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ path: file.path });
      text = data.value;
    } else if (file.mimetype === 'text/plain') {
      text = fs.readFileSync(file.path, 'utf8');
    } else {
      return res.status(400).json({ error: '対応していないファイル形式です。' });
    }

    const promptText = bulletMode
      ? '以下の文書を日本語で簡潔に箇条書きにしてください。'
      : '以下の文書を日本語で要約してください。';

    const summaryResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: promptText },
        { role: 'user', content: text }
      ]
    });

    const summary = summaryResponse.data.choices[0].message.content;

    fs.writeFileSync('uploads/latest_text.txt', text, 'utf8');
    res.json({ summary });

  } catch (err) {
    console.error('アップロードエラー:', err);
    res.status(500).json({ error: 'ファイル処理に失敗しました。' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
