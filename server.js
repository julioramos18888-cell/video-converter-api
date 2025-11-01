const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static('downloads'));

if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
}

app.get('/', (req, res) => {
    res.send(`
        <h1>🎵 API de Conversión de Videos</h1>
        <p>✅ Servidor funcionando correctamente!</p>
        <p>Endpoints:</p>
        <ul>
            <li>POST /convert - Convertir video</li>
        </ul>
    `);
});

app.post('/convert', (req, res) => {
    const { url, format } = req.body;

    console.log('📥 Petición recibida:', { url, format });

    if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
    }

    if (!['mp3', 'mp4'].includes(format)) {
        return res.status(400).json({ error: 'Formato debe ser mp3 o mp4' });
    }

    const timestamp = Date.now();
    const outputTemplate = `downloads/video_${timestamp}.%(ext)s`;

    let command;
    if (format === 'mp3') {
        command = `yt-dlp -x --audio-format mp3 "${url}" -o "${outputTemplate}"`;
    } else {
        command = `yt-dlp -f "best[ext=mp4]" "${url}" -o "${outputTemplate}"`;
    }

    console.log('⚙️ Ejecutando comando...');

    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Error:', error.message);
            return res.status(500).json({ error: 'Error al procesar el video' });
        }

        const files = fs.readdirSync('downloads').filter(f => f.startsWith(`video_${timestamp}`));
        
        if (files.length === 0) {
            return res.status(500).json({ error: 'Archivo no generado' });
        }

        const fileName = files[0];
        const host = req.get('host');
        const protocol = req.protocol;
        const downloadUrl = `${protocol}://${host}/downloads/${fileName}`;

        console.log('🎉 ¡Conversión completada!:', fileName);

        res.json({
            success: true,
            fileName: fileName,
            downloadUrl: downloadUrl,
            message: 'Conversión completada'
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 Listo para recibir peticiones`);
});
