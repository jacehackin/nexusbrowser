const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path'); // We need this to handle file paths
const app = express();

app.use(cors());

// --- 1. SERVE THE FRONTEND UI ---
// When you visit your Render URL, it will load your browser UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'nexus.html'));
});

// --- 2. THE PROXY ENGINE ---
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.send("Please provide a URL to proxy.");

    try {
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            responseType: 'text' 
        });

        let html = response.data;

        // Server-Side Ad Blocking
        html = html.replace(/<script.*googlesyndication.*<\/script>/gi, "");
        html = html.replace(/<script.*doubleclick.*<\/script>/gi, "");
        
        // Base Tag Injection (Fixes relative links)
        const headMatch = html.match(/<head[^>]*>/i);
        if (headMatch) {
            html = html.replace(headMatch[0], `${headMatch[0]}\n<base href="${targetUrl}">`);
        }

        res.send(html);
    } catch (err) {
        console.error("Proxy Error:", err.message);
        res.status(500).send(`Nexus Proxy Error fetching site: ${err.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nexus Server running on port ${PORT}`));