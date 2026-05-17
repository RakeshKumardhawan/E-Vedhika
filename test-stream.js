import { Readable } from 'stream';
const testDownload = async () => {
    const url = "https://firebasestorage.googleapis.com/v0/b/e-vedhika.appspot.com/o/MPO%20E%20VEDHIKA%20UPLOADS%2FUBD_Site_Setup.bat?alt=media&token=c16b2bb6-6fa2-430c-ab22-793db5f8f5ea";
    try {
        const fetchResp = await fetch(url);
        console.log("Body:", fetchResp.body.constructor.name);
        const readableNodeStream = Readable.fromWeb(fetchResp.body);
        console.log("Stream built.")
    } catch (e) {
        console.error("Error:", e);
    }
}
testDownload();
