// 05.03 규원 컨트롤러 추가 및 데이터가져오기 및 저장하기, 저장된 데이터 가져오기 함수 추가
// 코드 재정리 
const axios = require("axios");
const db = require("../data/Database");
const formatData = require("../utils/formatData");

function getSleepData(req, res) {
  // 오늘 날짜와 7일 전 날짜를 계산합니다.
  const today = new Date();
  const sevenDaysAgo = new Date(today);

  // 7일을 빼서 7일 전 날짜를 설정합니다.
  sevenDaysAgo.setDate(today.getDate() - 7);

  // 오늘 날짜와 7일 전 날짜를 콘솔에 출력합니다.
  console.log("Today's date: " + formatDate(today));
  console.log("Seven days ago: " + formatDate(sevenDaysAgo));

  // 사용할 accessToken
  var accessToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1MzN0siLCJzdWIiOiJDMlZaSE4iLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNzE0NzM1MzM1LCJpYXQiOjE3MTQ3MDY1MzV9.n6x1DnP32FxY5sZcBVcPLya7xJ68KGiAMPdMlywVSME";

  // 디바이스 정보 요청 설정
  const deviceConfig = {
    method: "get",
    url: "https://api.fitbit.com/1.2/user/-/devices.json",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // 수면 정보 요청 설정
  const sleepConfig = {
    method: "get",
    url: `https://api.fitbit.com/1.2/user/-/sleep/date/${formatDate(
      sevenDaysAgo
    )}/${formatDate(today)}.json`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return axios(deviceConfig)
    .then((deviceResponse) => {
      //console.log("Device Data:", JSON.stringify(deviceResponse.data));
      return axios(sleepConfig)
        .then((sleepResponse) => {
          //console.log("Sleep Data:", JSON.stringify(sleepResponse.data));
          const sleepData = {
            deviceId: deviceResponse.data[0].id,
            sleepDate: sleepResponse.data.sleep[0].dateOfSleep,
            asleepTotal: sleepResponse.data.sleep[0].timeInBed,
            asleepMin: sleepResponse.data.sleep[0].minutesAsleep,
            awakeMin: sleepResponse.data.sleep[0].minutesAwake,
            sleepSummary: sleepResponse.data.sleep[0].levels.summary,
            sleepState: sleepResponse.data.sleep[0].levels.data,
          };
          db.getDb().collection("sleepdata").insertOne(sleepData);
          res.send({
            sleepData,
          });
        })
        .catch((sleepError) => {
          console.error("Error fetching sleep data:", sleepError);
          throw sleepError; // 오류를 던져 상위 함수에 알림
        });
    })
    .catch((deviceError) => {
      console.error("Error fetching device data:", deviceError);
      throw deviceError; // 오류를 던져 상위 함수에 알림
    });
}

// 날짜를 'YYYY-MM-DD' 형식으로 포맷팅하는 함수
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function getStoredSleepData(req, res) {
  const result = await db.getDb().collection("sleepdata").find().toArray();
  res.send(result);
}

module.exports = {
  getSleepData,
  getStoredSleepData,
};
