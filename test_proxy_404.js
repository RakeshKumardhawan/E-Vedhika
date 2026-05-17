const test = async () => {
    const fetch = (await import('node-fetch')).default;
    const url = "https://httpbin.org/status/404";
    const res = await fetch("http://0.0.0.0:3000/api/download?url=" + encodeURIComponent(url) + "&filename=Document");
    console.log(res.status);
    console.log("Headers:");
    res.headers.forEach((v, k) => console.log(k, ":", v));
};
test();
