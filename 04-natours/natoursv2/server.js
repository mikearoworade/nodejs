const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');

// console.log(process.env)
const DB = process.env.DATABASE.replace(
  '<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to DB');
});

// Schema
const tourSchema = new mongoose.Schema({
    name: { // schema type option
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true
    },
    rating: {
        type: Number,
        default: 4.5,
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    }

})

// Model
// const Tour = mongoose.model('Tour', tourSchema);
//
// // Test
// const testTour = new Tour({
//     name: 'The Park Camper',
//     rating: 4.6,
//     price: 399
// });
//
// testTour.save().then(doc => {
//     console.log(doc);
// }).catch(err => {
//     console.log(`ERROR: ${err}`);
// });

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});
