const { json } = require('express');
const express = require('express');
const fs = require('fs');
const lodash = require('lodash');

const app = express();
const port = 3000
var loggedUserId;

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

app.get('/', (req, res) => {
    var listOftasks = [];
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

app.post('/',(req, res, next) => {
    var data=req.body;
    var tasksList = JSON.parse(fs.readFileSync('todolist.txt', 'utf8'));
    if (lodash.find(tasksList,data) !== undefined) {
      tasksList.splice(lodash.findIndex(tasksList,data),1);
    } else if (lodash.find(tasksList, obj => obj.id == data.id && obj.userId == loggedUserId) !== undefined){
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

app.get('/loggedUser',(req, res) => {
  res.json(loggedUserId.toString());
});

app.post('/loggedUser',(req,res,next) =>  {
  var loggedUser = req.body;
  var userList = JSON.parse(fs.readFileSync('users.txt', 'utf8'));
  var index = lodash.find(userList , (exp) => exp.username === loggedUser.username);
  if (index === undefined) {
    res.json('noUser');
  } else if(index.password !== loggedUser.password) {
    res.json('noPass');
  }else {
    loggedUserId = index.id;
    res.json('acces');
  }
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

app.post('/users',(req, res, next) => {
  var data=req.body;
  var dataList =JSON.parse(fs.readFileSync('users.txt', 'utf8'));
  if (lodash.findIndex(dataList, (exp) => exp.username === data.username) !== -1) {
    res.json('exist');
  }
  else {
    data.id = dataList.length;
    dataList.push(data);
    fs.writeFile('users.txt', JSON.stringify(dataList), err => {
        if (err) {
          console.error(err)
          return
        }
      })
      res.json('');
  }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

