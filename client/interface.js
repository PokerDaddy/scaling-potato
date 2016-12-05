/**
 * Chat interface
 * really really simple, but im not sure what else to add for now?
 **/

class Display {
    recieve(timestamp, nick, body) {
        console.log(`[${timestamp}]${nick}: ${body}`);
    }
}

module.exports = Display;