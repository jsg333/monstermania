export default {
  base: './',
  build: { target: 'es2020' },
  define: {
    // A visible build stamp. Without one, "is he even running my fix?" is
    // guesswork — and we lost real time to exactly that.
    __BUILD__: JSON.stringify(
      new Date().toISOString().slice(2, 16).replace('T', ' ').replace(/-/g, '')
    )
  }
};
