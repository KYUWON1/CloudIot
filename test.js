const http = require("http");

// 요청 옵션 설정
const options = {
  hostname: "localhost",
  port: 8080,
  path: "/hello",
  method: "GET",
};

// 요청 보내기
const req = http.request(options, (res) => {
  let data = "";

  // 응답 받기
  res.on("data", (chunk) => {
    data += chunk;
  });

  // 응답 완료 후 처리
  res.on("end", () => {
    console.log("Response:", data);
  });
});

// 요청 에러 처리
req.on("error", (error) => {
  console.error("Error:", error);
});

// 요청 종료
req.end();
