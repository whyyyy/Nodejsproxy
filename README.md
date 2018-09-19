<h1>This script implements a static resource server and a proxy for cross site requests.</h1>
<h2>For static resource server:</h2>
<p>File structure must be the following style</p>
<p>root/<br>
  |_ index.html<br>
  |_/static/<br>
       |_your static file, ex. js, css, etc</p>
	   
<h2>For proxy:</h2>
<p>request must contains the header named
1. forwardtohost. (the host you want to forward to)
2. forwardtohost. (the port for request host)</p>
