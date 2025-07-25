const express = require('express');

const app = express();

// routes
app.get('/', (req, res) => {
    res.status(200)
        .json({message: 'Hello from the server!', app: 'Natours'});
    // res.status(200).send('Hello from the server!');
})

app.post('/', (req, res) => {
    res.send("You can post to the endpoint now!");
})

const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`)
});
