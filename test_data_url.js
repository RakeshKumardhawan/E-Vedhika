const testDataUrl = async () => {
    const fetch = (await import('node-fetch')).default;
    const url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const proxyUrl = "http://localhost:3000/api/download?url=" + encodeURIComponent(url) + "&filename=" + encodeURIComponent("Document");
    const res = await fetch(proxyUrl);
    console.log(res.status);
    console.log(res.headers.get('content-disposition'));
}
testDataUrl();
