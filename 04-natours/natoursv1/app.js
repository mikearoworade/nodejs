const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

// middleware
app.use(morgan('dev'));
app.use(express.json());
// creating middleware
app.use((req,res,next) => {
    console.log('Hello from middleware!');
    next();
})

app.use((req,res,next) => {
    req.resquestTime = new Date().toISOString();
    next();
})
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf8')
);

// Route handlers
const getAllTours = (req, res) => {
    console.log(req.resquestTime)
    res.status(200).json({
        status: 'success',
        requestedTime: req.resquestTime,
        results: tours.length,
        data: {
            tours,
        }
    })
}

const getTour = (req, res) => {
    // console.log(req.params.id);
    const id = req.params.id * 1;
    const tour = tours.find(el => el.id === id);

    if (!tour) {
        return res.status(404).json({ status: "fail", message: "Invalid Id" });
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour,
        }
    })
}

const createTour = (req, res) => {
    // console.log(req.body);
    const newId = tours[tours.length - 1].id +1;
    const newTour = Object.assign({id: newId}, req.body);
    tours.push(newTour);

    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status: 'success',
            data : {
                tour: newTour,
            }
        })
    });
}

const updateTour = (req, res) => {
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({ status: "fail", message: "Invalid Id" });
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here..>'
        }
    })
}

const deleteTour = (req, res) => {
    if (req.params.id * 1 > tours.length) {
        return res.status(204).json({ status: "fail", message: "Invalid Id" });
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
}

const getAllUsers = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

const getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

const updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

const deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

// routes
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.route('/api/v1/tours')
    .get(getAllTours)
    .post(createTour);

app.route('/api/v1/tours/:id')
    .get(getTour)
    .patch(updateTour)
    .delete(deleteTour);

app.route('/api/v1/users')
    .get(getAllUsers)
    .post(createUser);

app.route('/api/v1/users/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`)
});
