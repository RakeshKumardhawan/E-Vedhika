const test = async () => {
    const fetch = (await import('node-fetch')).default;
    // URL without extension
    const url = "https://httpbin.org/image/png";
    const res = await fetch("http://0.0.0.0:3000/api/download?url=" + encodeURIComponent(url) + "&filename=Document");
    console.log(res.status);
    console.log("Headers:");
    res.headers.forEach((v, k) => console.log(k, ":", v));
};
test();
