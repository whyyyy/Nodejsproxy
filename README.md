This scprit implements a static resource server and a proxy for cross site requests.

For static resource server:
File structure must be the following style
root/
  |_ index.html
  |_/static/
       |_your static file, ex. js, css, etc
	   
For proxy:
request must contains the header named
1. forwardtohost. (the host you want to forward to)
2. forwardtohost. (the port for request host)