// 05.03 규원 router 추가

//추가할것 람다를 이용한 Restful API
/*
    POST /bedtime: 사용자의 희망 취침시간을 등록하기 위한 엔드포인트입니다. 
    클라이언트는 이 엔드포인트를 사용하여 사용자가 입력한 희망 취침시간을 서버에 전송합니다.

    GET /bedtime: 등록된 사용자의 희망 취침시간을 확인하기 위한 엔드포인트입니다. 
    클라이언트는 이 엔드포인트를 통해 사용자가 입력한 희망 취침시간을 서버로부터 받아올 수 있습니다.

    DELETE /bedtime: 등록된 사용자의 희망 취침시간을 삭제하기 위한 엔드포인트입니다. 
    클라이언트는 이 엔드포인트를 통해 서버에 등록된 희망 취침시간 정보를 삭제할 수 있습니다.

    PUT /bedtime: 등록된 사용자의 희망 취침시간을 수정하기 위한 엔드포인트입니다. 
    클라이언트는 이 엔드포인트를 통해 서버에 등록된 희망 취침시간 정보를 수정할 수 있습니다.
*/
const express = require("express");
const MainController = require("../controller/main-controller");

const router = express.Router();

router.get("/",MainController.getMain)
router.get("/timeinfo",MainController.getSleepTime);
router.post("/bedtime", MainController.postSleepTime);
router.put("/bedtime/:id",MainController.putSleepTime);
router.delete("/bedtime/:id",MainController.deleteSleepTime);

module.exports = router;
