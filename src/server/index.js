import express from 'express';
import apiController from './controllers/api.js'
import manager from '../lib/Manager.js'

var app = express();

app.use(function timeLog (req, res, next) {
    console.log('Time: ', Date.now())
    next()
})

app.use('/api', apiController);


// err
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

// app.get('/', (req, res) => {
// res.send('Hello World!')
// })

app.listen(3000, () => {
console.log(`Example app listening at http://localhost:${3000}`);
manager.run();
})