// pages/api/upload.js
import multer from 'multer';

const upload = multer({
    storage: multer.diskStorage({
        destination: './public/uploads/',
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        },
    }),
});

const uploadMiddleware = upload.single('file');

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await new Promise((resolve, reject) => {
                uploadMiddleware(req, res, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            res.status(200).json({ message: 'File uploaded successfully!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error uploading file' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
