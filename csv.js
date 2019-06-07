var express = require('express');
var router = express.Router();
const csvController = require('../app/controllers/CsvController');

var path = require('path');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/files');
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + path.extname(file.originalname));
    }
});
var upload = multer({ storage: storage });


//doctor speciality route
router.get('/', csvController.getCsv);
router.post('/csvupload', upload.single('file'), csvController.csvUpload);
router.get('/view-health-data/:id', csvController.viewAnswerData);
router.get('/getJsonData', csvController.getJsonData);
// router.get('/getOtherJsonData', csvController.getOtherJsonData);



module.exports = router;