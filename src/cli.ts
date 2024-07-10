while (true) {
  // sleep for 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Hello world!");
}
