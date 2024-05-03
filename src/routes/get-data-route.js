// 05.03 규원 router 추가 
const express = require("express");
const dataController = require("../controller/data-controller");

const router = express.Router();

router.get("/", (req, res) => {
  let data = "hello";
  res.send(data);
});

router.get("/getdata", dataController.getSleepData);

router.get("/getStoredData", dataController.getStoredSleepData);

module.exports = router;
