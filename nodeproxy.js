var http = require('http');
var fs = require('fs');
var url = require('url');
var zlib = require('zlib');

var log4js = require("log4js");
var log4js_config = require("./log4js.json");
log4js.configure(log4js_config);
var log = log4js.getLogger('monitor');

var ctntype = {
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "tar": "application/tar",
  "woff2": "application/font-woff",
  "woff": "application/font-woff",
  "ttf": "application/ttf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml"
};

http.createServer(function (request, response) {
	var parseObj = url.parse(request.url, true);
	var pathname = parseObj.pathname;
	var pathattr = pathname && pathname.split('/');
	var firstDir = pathattr && pathattr[1];
	var last = pathattr && pathattr[pathattr.length-1];
// 	log.debug("Request for " + pathname + " received.");
// 	log.debug("headers: "+ JSON.stringify(request.headers));
	if (pathname.match(/^\/static/) != null || pathname.match(/^\/.*\.html/) != null){
		//log.debug("match");
		var filetype = last && last.split('.')[(last.split('.')).length-1];
		var contentType = null
		if (filetype){
			contentType = {'Content-Type': eval("ctntype."+filetype)};
		}
		fs.readFile(pathname.substr(1), "binary", function (err, data) {
		if (err) {
			log.info(err);
			response.writeHead(404, {'Content-Type': 'text/html'});
		}else{
			response.setHeader('Access-Control-Allow-Origin',"*");	
			response.writeHead(200, contentType);  
			response.write(data, "binary");        
		  }
		  response.end();
		});
	}else{
// 		log.debug("forward request");
		if(request.headers && request.headers['forwardtohost']){
			//log.debug(request.headers['forwardtohost'] +" " +request.headers['forwardtoport']);
			delete request.headers.host;
			var opts={
				host:request.headers['forwardtohost'],
				path:request.url,
				headers:request.headers,
				method:request.method
// 				data:parseObj.query
			};
			if(request.headers['forwardtoport']){
		    	opts.port = request.headers['forwardtoport'];
			}
			log.debug("opts: "+ JSON.stringify(opts));
			var exec = true;
			request.on("data",function(data){
				log.info("data is "+data);
				exec = false;
				forward(request, response, opts, data);
			});
			if(exec){
				forward(request, response, opts);
			}
        }else{
			log.info("no host to forward");
        	response.writeHead(404, {'Content-Type': 'text/html'});
        	response.end();
        }
	}
}).listen(1111);

log.info('Server running');

function forward(request, response, opts, data){
	var chunks =[];
	try{	
		var request_timer = null, req = null;
		request_timer = setTimeout(function() {
			req.abort();
			log.error('Request Timeout.');
		}, 5000); 
		req = http.request(opts, function(res) {
			clearTimeout(request_timer);
// 			log.debug("=======resheaders=====",JSON.stringify(res.headers));
// 			log.debug("=======resstatusCode=====",res.statusCode);
			var response_timer = setTimeout(function() {
				res.destroy();
				log.error('Response Timeout.');
			}, 20000);
			res.on('data',function(body){
// 				log.debug("=======body=====",body);
				chunks.push(body)
				}).on("end", function () {
//					log.debug("=======end=====");
					try{
						var buffer = Buffer.concat(chunks);
						clearTimeout(response_timer);
						response.writeHead(200, res.headers);
						response.write(buffer, function(err) {response.end();});
						response.end();
					}catch(err){
						clearTimeout(response_timer);
						response.writeHead(500, {'Content-Type': 'text/html'});
						response.write("server error: "+err);
						response.end();
					};
				}).on('error', function(e) {
					clearTimeout(response_timer);
					printCmnInfo(request.url,request.headers,opts,e,data);
					response.writeHead(500, {'Content-Type': 'text/html'});
					response.write("server error: "+e);
					response.end();
				});
		}).on('error', function(e) {
			clearTimeout(request_timer);
			printCmnInfo(request.url,request.headers,opts,e,data);
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("server error: "+e);
			response.end();
		});
	}catch(e){
		clearTimeout(request_timer);
		if(response_timer){
			clearTimeout(response_timer);
		};
		printCmnInfo(request.url,request.headers,opts,e,data);
		response.writeHead(500, {'Content-Type': 'text/html'});
		response.write("server error: "+e);
        response.end();
	};
	if(request.headers.cookie != null ){
		req.setHeader('Cookie',request.headers.cookie);
	}
	if(data){
		req.write(data+"\n");
	}
	req.end();
}

process.on('uncaughtException', function (err) {
  log.error(err);
  log.error(err.stack);
});

function printCmnInfo(pathname, headers, opts, err, data){
	log.info("===request info start===")
	log.info("===Request for", pathname, "received.");
	log.info("===headers:", JSON.stringify(headers));
	log.info("===opts:", JSON.stringify(opts));
	log.info("===Got req error:", err.message);
	log.info("===data:", data);
	log.info("===request info end===")
}