const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 5001;

const cors = require('cors');

// 모든 도메인에 대해 CORS 허용
app.use(cors());

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// Ollama AI 설정
const ollamaApiUrl = 'http://localhost:11434/v1/chat/completions';
const ollamaApiKey = 'ollama'; // 사용되지 않지만 필요함

// Google Cloud Translation API 설정
const translateApiUrl = 'https://translation.googleapis.com/language/translate/v2';
const googleApiKey = 'YOUR_GOOGLE_CLOUD_API_KEY'; // 자신의 Google Cloud Translation API 키로 교체

let input = [];
let plans = [];

// 텍스트를 한국어로 번역하는 함수
const translateText = async (text, targetLanguage = 'ko') => {
    try {
        const response = await axios.post(translateApiUrl, {
            q: text,
            target: targetLanguage,
            format: 'text'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${googleApiKey}`
            }
        });

        if (response.data && response.data.data && response.data.data.translations.length > 0) {
            return response.data.data.translations[0].translatedText;
        } else {
            console.error('번역 중 문제가 발생했습니다:', response.data);
            return '번역 중 오류가 발생했습니다.';
        }
    } catch (error) {
        console.error('번역 API 호출 중 오류 발생:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return '번역 API 오류가 발생했습니다.';
    }
};

// GET 요청 시 입력 폼을 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// POST 요청 시 입력값을 저장하고 계획 생성
app.post('/submit', async (req, res) => {
    const { months, goal } = req.body;
    input.push({ months, goal });

    try {
        let gptResponse;
        if (months && goal) {
            // Ollama AI 호출로 특정 목표에 대한 경비 조사 및 저축 계획 생성
            const response = await axios.post(ollamaApiUrl, {
                model: 'llama2',  // 모델 이름을 다운로드한 모델 이름으로 수정
                messages: [{
                    role: 'user',
                    content: `사용자가 ${months}달 동안 돈을 모아서 ${goal}를 하고 싶어합니다. 목표를 달성하기 위해 필요한 경비를 조사하고, 매달 저축해야 할 금액을 한국어로 알려주세요.`
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ollamaApiKey}` // 올바른 Authorization 헤더 설정
                }
            });

            // Ollama AI 응답을 처리
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                gptResponse = response.data.choices[0].message.content || '계획을 수립 중입니다...';
                // AI 응답을 번역
                gptResponse = await translateText(gptResponse);
                // 각 문장 끝에 줄 바꿈 추가
                gptResponse = gptResponse.replace(/(?:\r\n|\r|\n)/g, '<br/>');
            } else {
                gptResponse = 'AI의 응답을 처리하는 중 문제가 발생했습니다.';
            }
        } else {
            gptResponse = '목표 또는 기간을 정확히 입력해주세요.';
        }

        plans.push(gptResponse);
    } catch (error) {
        console.error('Ollama AI 호출 중 오류 발생:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        plans.push('AI의 조언을 가져오는 중 오류가 발생했습니다.');
    }

    res.redirect('/');
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
