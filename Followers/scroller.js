


  // Get the height of the rendered page
  async function scroller() {
    // body heigh of page
    let bodyHandle = await page.$('body');
    let { height } = await bodyHandle.boundingBox();
    console.log("height");
    console.log(height);
    await bodyHandle.dispose();
    await page.evaluate(scrolling => {
        window.scrollTo(0,document.body.scrollHeight)
      });
    await page.waitFor(12000);
    // new body height after scroll pagination
    const newBodyHandle = await page.$('body');
    const { height: newHeight } = await newBodyHandle.boundingBox();
    console.log("newHeight");
    console.log(newHeight);

    if (scrollEnd == 1){
      console.log("end of pagination");
      await page.waitFor(1000);
      followerRev(page);
    }

    // if scroll continues to render a new height then rescroll
    if (height < newHeight){
      console.log("rescroll");
      scroller();
    }
    // else we are at the end of scroll, move on
    else {
      scrollEnd = 1;
      scroller();
    }
}

modules.export = scroller;