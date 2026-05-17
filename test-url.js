import fs from 'fs';
import path from 'path';

const testUrl = "https://firebasestorage.googleapis.com/v0/b/example/o/files%2FUBD_Site_Setup.bat?alt=media&token=123";
const urlObj = new URL(testUrl);
const decodedPath = decodeURIComponent(urlObj.pathname);
const parts = decodedPath.split('/');
const lastPart = parts[parts.length - 1];
console.log(lastPart);
