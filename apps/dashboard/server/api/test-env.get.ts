export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  return { public: config.public }
})
