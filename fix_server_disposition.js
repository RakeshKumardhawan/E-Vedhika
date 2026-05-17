const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /let safeFilename = \(extractedFilename \|\| "download"\)\.replace\(\/\["\\\\\/\]\/g, ""\);[^]*?safeFilename \+= '\.' \+ ext;\s+\}\s+\}/;

const newBlock = `let safeFilename = (extractedFilename || "download").replace(/["\\\\/]/g, "");

      const remoteDisposition = fetchResp.headers.get('content-disposition');
      if (remoteDisposition) {
        const match = remoteDisposition.match(/filename(?:\\*=[A-Za-z0-9-]+\\'\\')?=?["']?([^"';\\s]+)["']?/i);
        if (match && match[1]) {
          const remoteName = decodeURIComponent(match[1]);
          if (remoteName.includes('.')) {
            safeFilename = remoteName.replace(/["\\\\/]/g, "");
          }
        }
      }

      const contentType = fetchResp.headers.get('content-type') || '';
      if (!safeFilename.includes('.') && contentType) {
        const mimeToExt: Record<string, string> = {
          'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'application/pdf': 'pdf', 'application/msword': 'doc', 'text/plain': 'txt',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.ms-excel': 'xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'application/zip': 'zip',
          'application/x-zip-compressed': 'zip', 'application/vnd.rar': 'rar',
          'application/x-rar-compressed': 'rar', 'application/octet-stream': 'bin',
          'application/vnd.android.package-archive': 'apk'
        };
        const ext = mimeToExt[contentType.split(';')[0].toLowerCase() as any];
        if (ext) {
          safeFilename += '.' + ext;
        }
      }`;

code = code.replace(regex, newBlock);
fs.writeFileSync('server.ts', code);
