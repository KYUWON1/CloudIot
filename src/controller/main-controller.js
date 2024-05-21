const axios = require("axios");
const dataController = require("./data-controller");

// Lambda 함수의 API Gateway 엔드포인트 URL
const lambdaUrl =
  "https://860s5tqs2b.execute-api.ap-northeast-2.amazonaws.com/24-05-15/test-resource";

async function getMain(req,res){
  res.status(200).render("main");
}

// GET 요청을 Lambda 함수로 전달하는 함수
async function getSleepTime(req, res) {
  try {
    const response = await axios.get(lambdaUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    res.status(200).render("timeinfo", { data: response.data });
  } catch (error) {
    console.error("Error during HTTP request:", error.message);
    res.status(500).json({ message: "Error sending data to Lambda" });
  }
}

// POST 요청을 Lambda 함수로 전달하는 함수
async function postSleepTime(req, res) {
  try {
    // 클라이언트 요청 본문에서 데이터 추출
    const data = req.body;
    console.log("POST request data:", data);
    // Lambda 함수에 POST 요청 전송
    const response = await axios.post(lambdaUrl, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Lambda 함수의 응답을 클라이언트에 반환
    res.status(200).render("main", { data: response.data });
  } catch (error) {
    console.error("Error during HTTP request:", error.message);
    res.status(500).json({ message: "Error sending data to Lambda" });
  }
}

// DELETE 요청을 Lambda 함수로 전달하는 함수
async function deleteSleepTime(req, res) {
  try {
    const id = req.params.id;
    console.log('DELETE request id:', id);

    const response = await axios.delete(`${lambdaUrl}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error during HTTP request:', error.message);
    res.status(500).json({ message: 'Error sending data to Lambda' });
  }
}

// PUT 요청을 Lambda 함수로 전달하는 함수
async function putSleepTime(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;
    console.log('PUT request id:', id);
    console.log('PUT request data:', data);

    const response = await axios.put(`${lambdaUrl}/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error during HTTP request:', error.message);
    res.status(500).json({ message: 'Error sending data to Lambda' });
  }
}

module.exports = {
  getMain,
  postSleepTime,
  getSleepTime,
  putSleepTime,
  deleteSleepTime,
};
