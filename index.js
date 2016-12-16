// application start

let opt = require("node-getopt").create([
	['s', 'server',		'run as a server'		],
	['h', 'help',		'display this help message'	]
])
.bindHelp()
.parseSystem();

if (opt.options.server) {
	console.log("Starting server...");
	require("./server/");
} else {
	console.log("Starting client...");
	require("./client/");
}

