const testExpress = async () => {
    const express = require('express');
    const app = express();
    app.get('*', (req, res) => {
        res.json({ original: req.originalUrl, path: req.path });
    });
    const server = app.listen(3006, async () => {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch("http://localhost:3006/my%2Fpath%20with%20spaces");
        console.log("node-fetch:", await res.json());

        const res2 = await globalThis.fetch("http://localhost:3006/my%2Fpath%20with%20spaces");
        console.log("native fetch:", await res2.json());
        
        server.close();
    });
}
testExpress();
