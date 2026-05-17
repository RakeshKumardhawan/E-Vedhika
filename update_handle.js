import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const newFunc = `export const handleForceDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!url) return;

  try {
    const proxyUrl = \`/api/download?url=\${encodeURIComponent(url)}&filename=\${encodeURIComponent(fileName)}\`;
    const link = document.createElement("a");
    link.href = proxyUrl;
    link.download = fileName; // The proxy also sets Content-Disposition
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Download failed:", error);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};`;

// replace handleForceDownload definition
content = content.replace(/export const handleForceDownload = async \([^]*?}\n};/, newFunc);

// Also we need to fix the "Download Now" button!
// In TechSpot view, "Download Now" button currently is:
// href={post.attachments.filter...[0]?.url || post.attachments[0].url}
// target="_blank"
// Let's find it.
const downloadNowTargetRegex = /<a\s+href=\{post\.attachments\.filter[^{]*\?\.url \|\| post\.attachments\[0\]\.url\}\s+target="_blank"\s+rel="noopener noreferrer"([^>]*?)>/g;

content = content.replace(downloadNowTargetRegex, (match, p1) => {
  return `<a 
                       href={post.attachments.filter(att => !(/\\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(att.url) || att.url.includes("image")))[0]?.url || post.attachments[0].url}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={(e) => {
                          const attToDownload = post.attachments.filter(att => !(/\\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(att.url) || att.url.includes("image")))[0] || post.attachments[0];
                          handleForceDownload(e, attToDownload.url, attToDownload.name || "Download.zip");
                       }}
                       ${p1}>`;
});

fs.writeFileSync('src/App.tsx', content);
console.log("Updated App.tsx");
