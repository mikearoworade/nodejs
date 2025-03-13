// Routing
const http = require('http');
const fs = require('fs');
const url = require('url');
const replaceTemplate = require('./modules/replaceTemplate')

const tempOverview = fs.readFileSync(`${__dirname}/templates/template-overview.html`, 'utf8');
const tempCard = fs.readFileSync(`${__dirname}/templates/template-card.html`, 'utf8');
const tempProduct = fs.readFileSync(`${__dirname}/templates/template-product.html`, 'utf8');

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

// Server
const server = http.createServer((req, res) => {
    const {query, pathname} = url.parse(req.url, true);

    // Overview Page
    if (pathname === '/' || pathname === '/overview') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        const cardHtml = dataObj.map(el => replaceTemplate(tempCard, el)).join('');
        const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardHtml);
        res.end(output);

        // Product Page
    } else if (pathname === '/product') {
        // console.log(query);
        const product = dataObj[query.id];
        const output = replaceTemplate(tempProduct, product);
        res.end(output);

        // API Page
    } else if (pathname === '/api') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(data);

        // Not Found
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
