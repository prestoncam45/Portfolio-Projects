const mongoose = require('mongoose');
const Activity = require('../models/todolist');

mongoose.connect('mongodb://localhost:27017/todolist', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const seedDB = async () => {
    await Activity.deleteMany({});
    const a = new Activity({
        activity: 'Grocery Shopping',
        author: '618ff79992408a31cda61d19'
    })
    await a.save()
}

seedDB().then(() => {
    mongoose.connection.close();
})