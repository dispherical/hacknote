require('dotenv').config()
const express = require('express');
const { createServer } = require('node:http');
const { WebSocket } = require("ws")
const { Server } = require('socket.io');
const { join } = require('node:path');
const app = express();
const server = createServer(app);
const io = new Server(server);
function calculateRadius(length) {
    const minChars = 2;
    const maxChars = 1000;
    const minR = 20;
    const maxR = 400;
    const clampedLength = Math.min(Math.max(length, minChars), maxChars);
    const r = minR + ((clampedLength - minChars) / (maxChars - minChars)) * (maxR - minR);

    return r;
}
function connect() {
    ws = new WebSocket('wss://l.hack.club');
    ws.on('open', function open() {

        ws.send(JSON.stringify({
            apiKey: process.env.WS_API_KEY
        }))
    });
    ws.on('close', function close() {
        connect();
    });
    ws.on('message', async function message(data) {
        const message = JSON.parse(data)
        if (message.bot_id) return
        var json
        try {
            json = await (await fetch(`https://l.hack.club/name/${message.channel}`)).json()
        } catch (e) {
            json = {
                name: null
            }
        }
        io.emit("message", {
            radius: calculateRadius(message.text.length),
            channel: json?.name ? `#${json.name}` : message.channel,
            link: `https://hackclub.slack.com/archives/${message.channel}/p${message.ts.replace(".", "")}`,
            thread: !!message?.thread_ts,
            length: message.text.length
        })
    })
}
connect()
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, () => {
    console.log('hacknote running at http://localhost:3000');
});