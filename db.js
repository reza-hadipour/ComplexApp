const dotenv = require('dotenv');
dotenv.config();

const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env.DATABASE_CONNECTION);

async function run(){
    client.connect()
    .then(()=>{
        console.log('MongoDb is ready to use.');
        module.exports = client.db();
        const app = require('./app');
        app.listen(process.env.APPLICATION_PORT,()=>{
            console.log(`Server is running on port ${process.env.APPLICATION_PORT}`);
        })
    })
}

run();
