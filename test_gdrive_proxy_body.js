const test = async () => {
    const fetch = (await import('node-fetch')).default;
    const url = "https://drive.google.com/uc?export=download&id=1C-Y1kOveXF2J9Z01_zS-0XU-wY2-h_qH"; 
    const proxyUrl = "http://localhost:3000/api/download?url=" + encodeURIComponent(url) + "&filename=download";
    const res = await fetch(proxyUrl);
    console.log(res.status);
    console.log(await res.text());
};
test();
