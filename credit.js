const msgpack = require("msgpack-lite"); const fs = require("fs"); const data = {}; fs.writeFileSync("credit.msgpack", msgpack.encode(data));
