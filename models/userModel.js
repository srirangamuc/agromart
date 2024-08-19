const mongoose = require('mongoose');

//Define the User Class
class User{
    //Constructor function for the user class
    constructor(name,email,password,role='normal'){
        this.name=name
        this.email=email
        this.password = password
        this.role = role
    }
    //Method to get Mongoose Schema
    static getSchema(){
        return new mongoose.Schema({
            name:{
                type:String,
                required:true
            },
            email:{
                type:String,
                required:true,
                unique:true
            },
            password:{
                type:String,
                required:true
            },
            //their are three roles for our project
            role:{
                type:String,
                enum :['admin','normal','farmer'],
                default:'normal'
            }
        });
    }
    //Method to return the Mongoose Model
    static getModel(){
        return mongoose.model('User',User.getSchema());
    }
}

//Export The User Model
module.exports = User.getModel()