// private async processVideo(job: ProcessingJob): Promise<void> {
//   // Download from MinIO
//   const originalKey = job.filename;
//   const videoPath = path.join('./videos/temp', path.basename(originalKey));
  
//   // Download original video
//   await this.storageService.downloadToFile(originalKey, videoPath);
  
//   // ... rest of processing logic (FFmpeg)
  
//   // Upload processed segments to MinIO
//   for (const quality of this.qualities) {
//     const outputDir = path.join(this.outputDir, job.videoId, quality.label);
//     const files = await fs.readdir(outputDir);
    
//     for (const file of files) {
//       const localPath = path.join(outputDir, file);
//       const minioKey = `videos/processed/${job.videoId}/${quality.label}/${file}`;
//       await this.storageService.uploadFile(localPath, minioKey);
//     }
//   }
// }
