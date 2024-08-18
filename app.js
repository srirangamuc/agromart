const express = require("express")
const bodyparser = require('body-parser')
const mongoose = require("mongoose")
// const userRoutes = require('./routes/userRoutes');

const app = express()

app.use(bodyparser.urlencoded({extended:false}))
app.use(express.static('public'))

app.set('view engine','ejs')

// app.use('/users',userRoutes)
app.get('/',(req,res)=>{
    res.render("index")
})

app.listen(3000,()=>{
    console.log('server is running on port 3000')
})