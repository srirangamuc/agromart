import mongoose from 'mongoose'

class Database{
    constructor(){
        this.__connect();
    }
    __connect(){
        mongoose.connect('mongodb://localhost:27017/myapp', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(()=> console.log('Database connection successful'))
        .catch(()=>console.error("Database connection error",err))
    }
}

export default new Database()