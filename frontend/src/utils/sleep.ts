export const sleep = (time = 0) => new Promise<void>((resolve) => {
  setTimeout(resolve, time)
})
