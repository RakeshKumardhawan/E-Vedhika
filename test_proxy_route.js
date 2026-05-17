const test = async () => {
    const fetch = (await import('node-fetch')).default;
    const url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";
    const res = await fetch("http://0.0.0.0:3000/api/download?url=" + encodeURIComponent(url) + "&filename=googlelogo.png");
    console.log(res.status);
    console.log("Headers:");
    res.headers.forEach((v, k) => console.log(k, ":", v));
};
test();
