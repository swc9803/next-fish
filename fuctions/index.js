const functions = require("firebase-functions");
const { default: next } = require("next");

const nextApp = next({
	dev: false,
	conf: {
		distDir: ".next",
	},
});

const handle = nextApp.getRequestHandler();

let dailyCount = 0;
const DAILY_LIMIT = 100;

exports.nextApp = functions.https.onRequest((req, res) => {
	if (dailyCount >= DAILY_LIMIT) {
		res.status(429).send("Function usage limit reached.");
		return;
	}

	dailyCount++;
	return nextApp.prepare().then(() => handle(req, res));
});
