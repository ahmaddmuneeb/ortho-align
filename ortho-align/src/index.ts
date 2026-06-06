import app from './app';
import { config } from './config';
import { isS3Configured } from './config/aws';
import prisma from './lib/prisma';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    if (!isS3Configured()) {
      console.warn('⚠️  AWS S3 not configured — file uploads will fail (set AWS_S3_BUCKET_NAME in .env)');
    } else if (!process.env.AWS_ACCESS_KEY_ID) {
      console.log('📦 S3: using EC2 IAM role / default AWS credential chain');
    } else {
      console.log('📦 S3: using explicit AWS access keys');
    }

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${config.port}`);
      console.log(`🏥 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

startServer();
