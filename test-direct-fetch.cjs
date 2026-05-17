const fetchTest = async () => {
    const fetch = (await import('node-fetch')).default;
    const url = "https://firebasestorage.googleapis.com/v0/b/e-vedhika.appspot.com/o/MPO%20E%20VEDHIKA%20UPLOADS%2FUBD_Site_Setup.bat?alt=media&token=c16b2bb6-6fa2-430c-ab22-793db5f8f5ea";
    const res = await fetch(url);
    console.log(res.status, await res.text());
}
fetchTest();
