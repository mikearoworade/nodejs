// Routing
const http = require('http');
const url = require('url');

// Server
const server = http.createServer((req, res) => {
    // console.log(req.url);
    const pathName = req.url;

    if (pathName === '/' || pathName === '/overview') {
        res.end("This is the OVERVIEW");
    } else if (pathName === '/product') {
        res.end("This is the PRODUCT");
    } else {
        res.writeHead(404, {
            'Content-Type': 'text/html'
        });
        res.end("<h1>Page Not Found</h1>");
    }
});

server.listen(8000, '127.0.0.1', () => {
    console.log("Server is running on port 8080");
});
