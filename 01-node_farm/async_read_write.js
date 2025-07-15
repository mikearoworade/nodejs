// Non-Blocking
const fs = require("fs");

fs.readFile("./txt/start.txt", "utf-8", (err, data) => {
  console.log(data);
});
console.log("Will read file!");

//Callback hell
fs.readFile("./txt/start.txt", "utf-8", (err, data1) => {
  fs.readFile(`${data1}`, "utf-8", (err, data2) => {
    fs.readFile(`append.txt`, "utf-8", (err, data3) => {
      fs.writeFile(`final.txt`, `${data2} ${data3}`, "utf-8", err => {
        if (err) throw err;
        console.log("Your file has been written");
      })
    })
  })
})