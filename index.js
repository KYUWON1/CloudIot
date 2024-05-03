// 05.03 규원 index.js 추가 

const express = require("express");
const mqtt = require("mqtt");

const app = express(); // 오류 수정: express 함수 호출
const db = require("./src/data/Database");
const dataRoute = require("./src/routes/get-data-route");

app.use(express.urlencoded({extended: false}));
app.use(express.json()); //json형식의 데이터 체크

// 포트 번호
const port = 3000;

// MQTT 클라이언트 설정
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// 클라이언트 연결 및 초기화
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  // 특정 토픽 구독
  client.subscribe("home/sensors/temperature");
});

// 데이터 라우트 추가
app.use('/api',dataRoute);

// MQTT 메시지를 받을 때마다 처리
client.on("message", (topic, message) => {
  console.log(`Received message from ${topic}: ${message.toString()}`);
  // 받은 메시지를 저장하거나 처리
  // 예: 최신 온도 데이터를 전역 변수에 저장
  lastTemperature = message.toString(); // 실제 사용 시 좀 더 복잡한 로직 구현
});

// 루트 URL에 대한 응답 추가
app.get("/", (req, res) => {
  res.send(
    "Hello World! This is the MQTT and Database integrated Node.js server."
  );
});

// 데이터베이스 연결 및 서버 시작
db.connectToDatabase()
  .then(function () {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(function (error) {
    console.log("DB 연결실패:", error);
  });
