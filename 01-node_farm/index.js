// SERVER
const http = require("http");

// Create a server
const server = http.createServer((req, res) => {
  // Send back a response
  //   console.log(req);
  res.end("Hello from the server!");
});

// Start server. Listen to incoming traffic
server.listen(8000, "127.0.0.1", () => {
  console.log("Listening to requests on port 8000");
});
