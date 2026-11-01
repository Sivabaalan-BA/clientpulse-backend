import app from './app';
import { OllamaService } from './modules/ai/ollama.service';
import { DatabaseService } from './database/db-service';

const PORT = parseInt(process.env.PORT || '5000', 10);

const bootstrap = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  ClientPulse Backend running on http://localhost:${PORT}`);
      console.log(`  API Health Endpoint: http://localhost:${PORT}/api/v1/health`);
      console.log(`=======================================================`);
    });

    // Check Database connection
    DatabaseService.testConnection();

    // Check Ollama AI readiness in background
    OllamaService.checkHealth().then((status) => {
      if (status.isAvailable) {
        console.log(`[AI] Connected to Ollama local daemon. Models available:`, status.models);
      } else {
        console.log(`[AI] Notice: ${status.message}`);
      }
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\n[Server] Gracefully terminating HTTP server...');
      server.close(() => {
        console.log('[Server] Process closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
};

bootstrap();
