const testDownload = async () => {
    const fetch = (await import('node-fetch')).default;
    const url = "https://w3c.github.io/FileAPI/index.html";
    const proxyUrl = "http://localhost:3000/api/download?url=" + encodeURIComponent(url) + "&filename=mytest.html";
    const res = await fetch(proxyUrl);
    console.log(res.status);
    console.log("Content-Disposition:", res.headers.get("content-disposition"));
    console.log("Content-Type:", res.headers.get("content-type"));
}
testDownload();
