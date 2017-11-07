# ui5-nabi-demo

A UI5 Library for demo purposes. I use this library mostly for my tutorials.


## Getting started

1. Install [node.js](http://nodejs.org/) (make sure to choose the LTS version, i.e. v6.11.2 LTS)
    
1. Install [git](https://git-scm.com/) if you haven't

1. Optional: Proxy Configuration in case you are working behind a proxy (see [Developing UI5](https://github.com/SAP/openui5/blob/master/docs/developing.md) for details)
	
	```
	HTTP_PROXY=http://proxy:8080
	HTTPS_PROXY=http://proxy:8080
	FTP_PROXY=http://proxy:8080
	NO_PROXY=localhost,127.0.0.1,.mycompany.corp
	```


1. Clone the repository and navigate into it

	```sh
	git clone https://github.com/nzamani/ui5-nabi-demo
	cd ui5-nabi-demo
	```

1. Install all npm dependencies (also installs all bower dependencies)

	```sh
	npm install
	```

1. Run npm start to lint, build and run a local server (have a look into `Gruntfile.js` to see all the tasks).

	```sh
	npm start
	```

1. Open a test page in your browser:
	- [Browser](http://localhost:8080/test-resources/ui5lab/browser/index.html) A sample browser
	- [Customer Selection Component](http://localhost:8080/test-resources/nabi/demo/CustomerSelection.html)
