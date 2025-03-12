// Non-Blocking Asynchronous way
const fs = require("fs");

fs.readFile("./txt/start.txt", "utf-8", (err, data1) => {
  fs.readFile(`./txt/${data1}.txt`, "utf-8", (err, data2) => {
    console.log(data2);
    fs.readFile(`./txt/append.txt`, "utf-8", (err, data3) => {
      console.log(data3);
      fs.writeFile("./txt/final.txt", `${data2}\n${data2}`, (err) => {
        console.log("Your file has been written");
      });
    });
  });
});
console.log("Will read file!");
