const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 5000;

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ETRI API 설정
const etriApiUrl = 'http://aiopen.etri.re.kr:8000/WiseQAnal';
const etriApiKey = 'f16b981f-df46-4136-9cbd-81e5b49ed0b0';

let input = [];
let plans = [];

// GET 요청 시 입력 폼을 제공
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>목표 설정하기</h1>
                <form action="/submit" method="post">
                    <input type="text" name="userInput" placeholder="목표를 이루어가요" required />
                    <button type="submit">함께하기</button>
                </form>
                <h2>목표 및 계획</h2>
                <ul>
                    ${input.map((item, index) => `
                        <li>
                            <strong>목표:</strong> ${item}<br/>
                            <strong>계획:</strong> ${plans[index] || '계획을 수립 중입니다...'}
                        </li>
                    `).join('')}
                </ul>
            </body>
        </html>
    `);
});

// POST 요청 시 입력값을 저장하고 계획 생성
app.post('/submit', async (req, res) => {
    const userInput = req.body.userInput;
    input.push(userInput);

    try {
        // ETRI API 호출로 계획 생성
        const response = await axios.post(etriApiUrl, {
            argument: {
                text: userInput
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${etriApiKey}`  // 'Bearer' 방식으로 설정
            }
        });

        // ETRI API 응답을 처리
        const gptResponse = response.data.result; // API 응답에서 'result'를 추출 (문서에 맞게 수정 필요)
        plans.push(gptResponse || '계획을 수립 중입니다...');
    } catch (error) {
        console.error('ETRI API 호출 중 오류 발생:', error.response ? error.response.data : error.message);
        plans.push('AI의 조언을 가져오는 중 오류가 발생했습니다.');
    }

    res.redirect('/');
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});