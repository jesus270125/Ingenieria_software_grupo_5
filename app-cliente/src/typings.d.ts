declare module 'socket.io-client' {
  const io: any;
  type Socket = any;
  export { io, Socket };
  export default io;
}
