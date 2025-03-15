const fs = require('fs');
const superagent = require("superagent");

const readFilePro = file => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err) reject("I could not read file 😩");
            resolve(data);
        });
    });
};

const writeFilePro = (file, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, err => {
            if (err) reject("Could not write file 😩");
            resolve("Successfully written!");
        });
    });
};

const getDogPic = async () => {
    try {
        const data = await readFilePro(`${__dirname}/dog.txt`)
        console.log(`Breed: ${data}`);

        const res = await superagent.get(`https://dog.ceo/api/breed/${data}/images/random`);
        console.log(res.body.message);

        await writeFilePro('dog-img.txt', res.body.message);
        console.log("Random dog image saved to file!");
    } catch (err) {
        console.log(err)
        throw (err);
    }
    return '2: Ready 🐶'
}

(async () => {
    try {
        console.log('1: Will get dog pics!');
        const x = await getDogPic();
        console.log(x);
        console.log('3: Done getting Dog Pics!');
    } catch(err) {
        console.log('Error getting Dog Pics🐦‍🔥');
    }
})()
/*
console.log('1: Will get dog pics!');
getDogPic()
    .then(x => {
    console.log(x);
    console.log('3: Done getting Dog Pics!');
    })
    .catch(err => {
        console.log('Error getting Dog Pics🐦‍🔥');
    });
*/