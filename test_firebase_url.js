import { URL } from 'url';
const test = () => {
    let url = "https://firebasestorage.googleapis.com/v0/b/e-vedhika.appspot.com/o/MPO%20E%20VEDHIKA%20UPLOADS%2FUBD_Site_Setup.bat?alt=media&token=c16b2bb6-6fa2-430c-ab22-793db5f8f5ea";
    const urlObj = new URL(url);
    const decodedPath = decodeURIComponent(urlObj.pathname);
    const parts = decodedPath.split('/');
    const lastPart = parts[parts.length - 1];
    console.log(lastPart);
};
test();
