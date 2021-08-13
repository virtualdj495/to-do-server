const express = require('express');
const {body, validationResult} = require('express-validator');
const fs = require('fs');
const lodash = require('lodash');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('token');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
    if (req.method == 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
    }
  
    next();
  });

app.get('/',(req,res) =>{
  res.json(JSON.parse(fs.readFileSync('users.txt', 'utf8'))); 
})

app.get('/:id', (req, res) => {
    var listOftasks = [];
    try {
      var loggedUserId =JSON.parse(cryptr.decrypt(req.params.id)).id;
    } catch(err) {
      res.status(401).json();
    }
    
    try {
        const data =JSON.parse(fs.readFileSync('todolist.txt', 'utf8'));
        for (let task of data) {
          if ( task.userId == loggedUserId) {
            listOftasks.push(task);
          }
        }
    } catch (err) {
        console.error(err);
    }
    res.json(listOftasks);
    
});

app.post('/',(req, res) => {
    var data=req.body;
    data.userId = JSON.parse(cryptr.decrypt(data.userId)).id;
    var tasksList = JSON.parse(fs.readFileSync('todolist.txt', 'utf8'));
    if (lodash.find(tasksList,data) !== undefined) {
      tasksList.splice(lodash.findIndex(tasksList,data),1);
    } else if (lodash.find(tasksList, obj => obj.id == data.id && obj.userId == data.userId) !== undefined){
      tasksList.splice(lodash.findIndex(tasksList,obj => obj.id == data.id), 1, data);
    } else {
      tasksList.push(data);
    }
    fs.writeFile('todolist.txt',  JSON.stringify(tasksList), err => {
        if (err) {
          console.error(err)
          return
        }
      })
      res.json();
});

app.post(
  '/loggedUser',
  body().custom(value =>{
    var dataList =JSON.parse(fs.readFileSync('users.txt', 'utf8'));
    if ( lodash.findIndex(dataList, (exp) => exp.username == value.username) === -1) {
      throw new Error('Username not found');
    }
    return true;
}).bail().custom(value =>{
    var dataList =JSON.parse(fs.readFileSync('users.txt', 'utf8'));
    if ( lodash.findIndex(dataList, (exp) => exp.password == value.password && exp.username == value.username) === -1) {
      throw new Error('Password incorrect');
    }
    return true;
}),
(req,res) =>  {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log('click')
    return res.json({errors: errors.array()});
  }
  var loggedUser = req.body;
  var userList = JSON.parse(fs.readFileSync('users.txt', 'utf8'));
  var index = lodash.find(userList , (exp) => exp.username === loggedUser.username);
  const encryptedID = cryptr.encrypt(JSON.stringify(index));
  res.json(encryptedID);
});

app.get('/users', (req, res) => {
  var stream;
  try {
      const data = fs.readFileSync('users.txt', 'utf8');
      stream =JSON.parse(data);
  } catch (err) {
      console.error(err);
  }
  res.json(stream); 
  
});

app.post(
  '/users',
  body('username').custom(value =>{
    var dataList =JSON.parse(fs.readFileSync('users.txt', 'utf8'));
    if ( lodash.findIndex(dataList, (exp) => exp.username === value) !== -1) {
      throw new Error('Username already in use');
    }
    return true;
}),
  body('password').custom((value, req) =>{
    if ( value.length < 5) {
      throw new Error('Password is too short');
    }
    return true;
}),
(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.json({errors: errors.array()});
  }
  var data=req.body;
  var dataList =JSON.parse(fs.readFileSync('users.txt', 'utf8'));
    data.id = dataList.length;
    dataList.push(data);
    fs.writeFile('users.txt', JSON.stringify(dataList), err => {
        if (err) {
          console.error(err)
          return;
        }
      })
      res.json('');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

