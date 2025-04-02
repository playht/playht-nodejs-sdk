// Create mock lease data
export const __createLease = () => {
  // Create a buffer with mock lease data
  const buffer = Buffer.alloc(256);

  // Set EPOCH time (current time + 1 hour in seconds since EPOCH)
  const now = Math.floor(Date.now() / 1000);

  // Write created time at position 64 (4 bytes)
  buffer.writeUInt32BE(now, 64);

  // Write duration at position 68 (4 bytes)
  buffer.writeUInt32BE(3600, 68); // 1 hour in seconds

  // Write metadata as JSON at position 72
  const metadata = JSON.stringify({
    inference_address: 'mock-inference-server.play.ht:11045',
    premium_inference_address: 'mock-premium-inference-server.play.ht:11045',
  });
  Buffer.from(metadata).copy(buffer, 72);

  return buffer;
};
