// 05.03 규원 컨트롤러 추가 및 데이터가져오기 및 저장하기, 저장된 데이터 가져오기 함수 추가
// 코드 재정리
const axios = require("axios");
const db = require("../data/Database");

// Lambda 함수의 API Gateway 엔드포인트 URL
const lambdaUrl =
  "https://860s5tqs2b.execute-api.ap-northeast-2.amazonaws.com/24-05-15/test-resource";

  // 보낼 데이터
const data = {
  "deviceId": "device123",
  "sleepDate": "2024-05-16T08:00:00Z",
  "asleepTotal": 480,
  "asleepMin": 400,
  "awakeMin": 80,
  "sleepSummary": {
    "deep": {
      "count": 2,
      "minutes": 120,
      "thirtyDayAvgMinutes": 110
    },
    "light": {
      "count": 4,
      "minutes": 200,
      "thirtyDayAvgMinutes": 190
    },
    "rem": {
      "count": 3,
      "minutes": 160,
      "thirtyDayAvgMinutes": 150
    },
    "wake": {
      "count": 1,
      "minutes": 60,
      "thirtyDayAvgMinutes": 50
    }
  },
  "sleepState": [
    {
      "dateTime": "2024-05-16T00:00:00Z",
      "level": "deep",
      "seconds": 180
    },
    {
      "dateTime": "2024-05-16T02:00:00Z",
      "level": "light",
      "seconds": 240
    },
    {
      "dateTime": "2024-05-16T04:00:00Z",
      "level": "rem",
      "seconds": 300
    },
    {
      "dateTime": "2024-05-16T06:00:00Z",
      "level": "awake",
      "seconds": 180
    }
  ]
};

// POST 요청을 Lambda 함수로 전달하는 함수
async function sendToLambda(req,res) {
   try {
        // 클라이언트 요청 본문에서 데이터 추출
        const data = req.body;

        // Lambda 함수에 POST 요청 전송
        const response = await axios.post(lambdaUrl, data, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Lambda 함수의 응답을 클라이언트에 반환
        res.status(200).json(response.data);
      } catch (error) {
        console.error('Error during HTTP request:', error.message);
        res.status(500).json({ message: 'Error sending data to Lambda' });
      }
}

module.exports = {
  sendToLambda,
};