export const FILE_SIZE_MB = 50;
// The UI uses MB; the byte threshold follows the project's existing MiB convention.
export const LIMITS = Object.freeze({ bytes: FILE_SIZE_MB * 1024 * 1024, pixels: 16_000_000, side: 8192, workingSide: 2048, exportSide: 16384 });
