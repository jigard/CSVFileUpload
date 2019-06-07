//import require packages
const fs = require('fs');
const csv = require('fast-csv');
const mongoose = require('mongoose');

//Access health category service
const csvService = require('../services/csv.service');
const employeeService = require('../services/employee.service');
const healthCatService = require('../services/healthcat.service');
const healthQueService = require('../services/healthques.service');
const quaterService = require('../services/quarter.service');

//Access response helper function
const response = require('../../modules/response.helper');

//Get csv upload page
exports.getCsv = async (req, res) => {
    try {
        //render csv page
        let quarter = await quaterService.getAllQuarter();
        return res.render('csv', { quarter });

    } catch (err) {
        //error response
        return response.sendJsonResponse(req, res, 500, null, err, "Error while render csv page");

    }
}

//Get all answers data and render to view health data page
exports.viewAnswerData = async (req, res) => {
    try {
        //access id from csv page
        let id = req.params.id;

        //fetch all data quarter wise
        let quarter = await quaterService.getAllQuarter();

        //fetch all category
        let catData = await healthCatService.getAllHealthCat();

        //fetch all answers data
        let answerDetail = await csvService.viewAnswerData(id);

        //fetch employee/user data by id
        let empDetail = await employeeService.getEmployeeById(id);

        //render view_health_data page
        res.render('view_health_data', { answerDetail, catData, empDetail, quarter });
        // let empDetail = await employeeService.getAllEmployee(id);

        // return response.sendJsonResponse(req, res, 200, answerDetail, null, "Get all data successfully");

    } catch (err) {
        //error response
        return response.sendJsonResponse(req, res, 500, null, err, "Error while fetch answers data");

    }
}

//get all json data
exports.getJsonData = async (req, res) => {
    try {
        //fetch all employee/user data
        let empDetail = await employeeService.getAllEmployee();

        // let empDetail = await csvService.viewAllAnswerData();

        //pass the data in json form
        return response.sendJsonResponse(req, res, 200, empDetail, null, "Get all data successfully");

    } catch (err) {
        //error response
        return response.sendJsonResponse(req, res, 500, null, err, "Error while get json data");

    }
}

exports.getOtherJsonData = async (req, res) => {
    try {
        console.log(req.params.id);
        //fetch all employee/user data
        let emailDetail = await csvService.viewAnswerData(req.body.id);
        // let empDetail = await csvService.viewAllAnswerData();

        //pass the data in json form
        return response.sendJsonResponse(req, res, 200, emailDetail, null, "Get all data successfully");

    } catch (err) {
        //error response
        return response.sendJsonResponse(req, res, 500, null, err, "Error while get json data");

    }
}


//for store data into multiple collections of csv file
exports.csvUpload = async (req, res) => {
    try {

        //define arrays variables
        let rows = [];
        let columns = [];
        let questions = [];
        let answers = [];

        //define variables
        let firstIndex = 0;
        let nextIndex = 0;
        let columnIndex = 0;
        let newIndex = 0;



        //get csv data using file path
        csv.fromPath(req.file.path)
            .on('data', async (data) => {

                //if csv has no data
                if (data.length == 0) {
                    return res.send('No csv data');
                }

                //data push into array
                rows.push(data);

            })
            .on('end', async () => {

                //attempt actions on csv data
                for (let i = 0; i < rows.length; i++) {

                    //action on first row
                    if (i === 0) {

                        //store first row data into new variable
                        let categoryData = rows[0];

                        for (let j = 0; j < categoryData.length; j++) {
                            //if space in data is not count

                            if (categoryData[j] != '') {
                                let category = await healthCatService.checkHealthCat({ category_name: categoryData[j] });
                                //if data not exist then push and create new data into database
                                //and set index value
                                if (!category) {
                                    columns.push({
                                        _id: new mongoose.Types.ObjectId,
                                        category_name: categoryData[j],
                                        index: j
                                    });

                                }
                            }
                        }
                        //insert new data 
                        if (columns.length >= 1) {
                            await healthCatService.addHealthCat(columns);
                        }
                    }

                    //action on second row
                    if (i === 1) {

                        //if length of column is equal to 1
                        if (columns.length == 0) {
                            continue;
                        }
                        else if (columns.length == 1) {
                            newIndex = columns[0].index;
                        } else {
                            firstIndex = columns[0].index;
                            nextIndex = columns[1].index;
                        }

                        //set row 2 data into new variable
                        let questionData = rows[1];

                        for (let j = 0; j < questionData.length; j++) {

                            let quesheal = await healthQueService.getQuesByName({ question: questionData[j] });

                            //if data not already exist
                            if (!quesheal) {

                                //if column data is equal to 1
                                if (columns.length == 1) {

                                    if (newIndex <= j && j < questionData.length) {
                                        //push question data
                                        questions.push({
                                            question: questionData[j],
                                            categoryId: columns[columnIndex]._id,
                                            index: j
                                        });
                                    }
                                } else {
                                    if (nextIndex <= j) {
                                        firstIndex = columns[columnIndex + 1].index;
                                        //if columnIndex is greater than columns length
                                        if (columnIndex + 2 >= columns.length) {
                                            //set question length 
                                            nextIndex = questionData.length;
                                        } else {

                                            nextIndex = columns[columnIndex + 2].index;
                                        }
                                        columnIndex++;
                                        //push question data
                                        questions.push({
                                            question: questionData[j],
                                            categoryId: columns[columnIndex]._id,
                                            index: j

                                        })

                                    } else if (j < nextIndex && j >= firstIndex) {
                                        //push question data
                                        questions.push({
                                            question: questionData[j],
                                            categoryId: columns[columnIndex]._id,
                                            index: j
                                        })
                                    }
                                }
                            }
                        }
                        //insert question data
                        await healthQueService.addQuestions(questions);
                    }

                    //row greater than 1
                    if (i > 1 && i < rows.length) {

                        //set answer row wise
                        let answerData = rows[i];

                        //set questions
                        let questionData = rows[1];

                        //every loop it changes to 0
                        let columnIndex1 = 0;


                        // console.log('quarterCheck: ', quarterCheck);
                        // process.exit();
                        let employeeData = await employeeService.getAllEmployee();
                        console.log('000');

                        if (employeeData.length + 1 < i) {
                            console.log('111');
                            console.log('main if');

                            let quarterCheck = await csvService.checkQuarter(req.body.quarterId);

                            if (!quarterCheck) {

                                console.log('main sub if');
                                // let quarterCheck = await csvService.checkQuarter(req.body.quarterId);
                                // console.log(quarterCheck.length);
                                // if (quarterCheck.length > 1) {
                                //     console.log('fweu');
                                // } else {

                                //store email into user table
                                let employee = await employeeService.addNewEmployee({ email_id: answerData[1] });

                                //get all question data
                                let questionHeal = await healthQueService.viewAllQuestions();

                                //data mapping id wise
                                let questionIds = questionHeal.map(element => {
                                    return element._id
                                })

                                //if columns length is 1
                                if (columns.length == 0) {
                                    continue;
                                }
                                else if (columns.length == 1) {
                                    newIndex = columns[0].index;
                                } else {
                                    firstIndex = columns[0].index;
                                    nextIndex = columns[1].index;
                                }

                                //action on answers
                                for (let j = 0; j < answerData.length; j++) {
                                    //if columns length is 1

                                    if (columns.length == 1) {



                                        if (newIndex <= j && j < answerData.length) {
                                            //push answer data
                                            answers.push({
                                                question_id: questionIds[j - 2],
                                                answer: answerData[j],
                                                user_id: employee._id,
                                                category_id: columns[columnIndex1]._id,
                                                quarter_id: req.body.quarterId,
                                            });
                                            // console.log('answers1: ', answers);
                                        }

                                    } else {
                                        if (nextIndex <= j) {

                                            firstIndex = columns[columnIndex1 + 1].index;
                                            if (columnIndex1 + 2 >= columns.length) {
                                                nextIndex = questionData.length;
                                            } else {
                                                nextIndex = columns[columnIndex1 + 2].index;
                                            }
                                            columnIndex1++;
                                            //push answer data
                                            answers.push({

                                                question_id: questionIds[j - 2],
                                                answer: answerData[j],
                                                user_id: employee._id,
                                                category_id: columns[columnIndex1]._id,
                                                quarter_id: req.body.quarterId,

                                            })
                                            // console.log('answers2: ', answers);


                                        } else if (j < nextIndex && j >= firstIndex) {

                                            //push answer data
                                            answers.push({
                                                question_id: questionIds[j - 2],
                                                answer: answerData[j],
                                                user_id: employee._id,
                                                category_id: columns[columnIndex1]._id,
                                                quarter_id: req.body.quarterId,
                                            })
                                            // console.log('answers3: ', answers);

                                        }
                                    }
                                }
                                console.log('amswer: ', answers);
                            } else {
                                console.log('main sub else');
                                let checkEmail = await employeeService.checkEmail(answerData[1]);
                                if (!checkEmail) {

                                    let quarterCheck2 = await csvService.checkQuarter(req.body.quarterId);
                                    if (quarterCheck2) {

                                        var employee = await employeeService.addNewEmployee({ email_id: answerData[1] });
                                        console.log('employee: ', employee);
                                        if (employee) {
                                            //get all question data
                                            let questionHeal = await healthQueService.viewAllQuestions();

                                            //data mapping id wise
                                            let questionIds = questionHeal.map(element => {
                                                return element._id
                                            })

                                            let categoryIds = questionHeal.map(element => {
                                                return element.categoryId
                                            })
                                            let categorysId = categoryIds.map(element => {
                                                return element._id
                                            })


                                            //action on answers
                                            for (let j = 0; j < answerData.length; j++) {

                                                //if columns length is 1
                                                if (questionHeal.length) {

                                                    if (j > 1) {

                                                        answers.push({
                                                            question_id: questionIds[j - 2],
                                                            answer: answerData[j],
                                                            user_id: employee._id,
                                                            category_id: categorysId[j - 2],
                                                            quarter_id: req.body.quarterId,
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                console.log('main else1');

                            }
                            console.log('main else2');
                        } else {

                            console.log('222if');


                            let checkEmail = await employeeService.checkEmail(answerData[1]);
                            if (checkEmail) {
                                console.log('else checkEmail if');

                                let quarterCheck2 = await csvService.checkQuarter(req.body.quarterId);
                                if (!quarterCheck2) {
                                    console.log('else quarter if');
                                    // var employee = await employeeService.addNewEmployee({ email_id: answerData[1] });
                                    // if (employee) {

                                    //get all question data
                                    let questionHeal = await healthQueService.viewAllQuestions();

                                    //data mapping id wise
                                    let questionIds = questionHeal.map(element => {
                                        return element._id
                                    })

                                    let categoryIds = questionHeal.map(element => {
                                        return element.categoryId
                                    })
                                    let categorysId = categoryIds.map(element => {
                                        return element._id
                                    })


                                    //action on answers
                                    for (let j = 0; j < answerData.length; j++) {

                                        //if columns length is 1
                                        if (questionHeal.length) {

                                            // console.log('questionIds[j - 2]: ', answerData[j + 2]);
                                            // process.exit();
                                            // process.exit();
                                            // if (columns.length == 1) {

                                            if (j > 1) {
                                                //push answer data
                                                // console.log('question_id: ', questionIds[j - 2]);
                                                answers.push({
                                                    question_id: questionIds[j - 2],
                                                    answer: answerData[j],
                                                    user_id: checkEmail._id,
                                                    category_id: categorysId[j - 2],
                                                    quarter_id: req.body.quarterId,
                                                });
                                                // console.log('answers1: ', answers);
                                            }
                                        }
                                    }
                                    // }
                                    console.log('jfdjji');
                                } else {

                                    console.log('else quarter else');


                                    let checkEmail = await employeeService.checkEmail(answerData[1]);
                                    if (checkEmail) {
                                        console.log('quarterCheck2');



                                        let quarterCheck3 = await csvService.checkQuarter(req.body.quarterId);
                                        console.log("req.body.quarterId; ", quarterCheck3);

                                        if (quarterCheck3) {
                                            console.log('quarterCheck2');


                                            //get all question data
                                            let questionHeal = await healthQueService.viewAllQuestions();

                                            //data mapping id wise
                                            let questionIds = questionHeal.map(element => {
                                                return element._id
                                            })


                                            let categoryIds = questionHeal.map(element => {
                                                return element.categoryId
                                            })
                                            let categorysId = categoryIds.map(element => {
                                                return element._id
                                            })
                                            //action on answers
                                            for (let j = 0; j < answerData.length; j++) {
                                                //if columns length is 1


                                                if (questionHeal.length) {

                                                    if (j > 1) {

                                                        answers.push({
                                                            question_id: questionIds[j - 2],
                                                            answer: answerData[j],
                                                            user_id: checkEmail._id,
                                                            category_id: categorysId[j - 2],
                                                            quarter_id: req.body.quarterId,
                                                        });

                                                    }
                                                }

                                                console.log('already exist');
                                                // }
                                                console.log('checkAnswer');

                                            }
                                        }
                                    }
                                    // }

                                    // }
                                }


                            }

                        }
                    }

                }
                // console.log('answers: ', answers);
                await csvService.addNewAnswer(answers);

                return res.render('csv', { flag: 0 });

            })
        fs.unlink(req.file.path, function (err) {
            if (err) {
                console.log(err)
            }
        });

    } catch (err) {
        //error response
        console.log(err)
        return response.sendJsonResponse(req, res, 500, null, err, "Error while upload csv");

    }
}
