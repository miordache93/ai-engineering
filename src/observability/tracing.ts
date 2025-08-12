import { Client } from 'langsmith';
import winston from 'winston';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';

interface TraceEvent {
  name: string;
  type: 'llm' | 'chain' | 'tool' | 'agent' | 'retriever';
  inputs: Record<string, any>;
  metadata?: Record<string, any>;
}

// Custom tracer implementation
export class AgentTracer {
  private client: Client;
  private logger: winston.Logger;
  private runId: string;

  constructor() {
    this.client = new Client({
      apiKey: config.apiKeys.langsmith,
      apiUrl: config.tracing.endpoint,
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({
          filename: 'logs/agent.log',
        }),
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });

    this.runId = uuidv4();
  }

  // Trace different type of events
  async traceEvent(event: TraceEvent) {
    const span = {
      id: uuidv4(),
      runId: this.runId,
      name: event.name,
      type: event.type,
      startTime: new Date(),
      inputs: event.inputs,
      metadata: event.metadata,
    };

    this.logger.debug('Trace Event', span);

    try {
      await this.client.createRun({
        ...span,
        run_type: 'llm',
        project_name: config.tracing.project,
      });

      return span.id;
    } catch (error) {
      this.logger.error('Failed to create trace event', error);
      return null;
    }
  }

  // Complete a traced span
  async completeSpan(spanId: string, output: any, error?: Error) {
    const endTime = new Date();

    try {
      await this.client.updateRun(spanId, {
        outputs: output,
        error: error ? error.message : undefined,
        end_time: endTime.getTime(),
      });
    } catch (error) {
      this.logger.error('Failed to complete span', error);
    }
  }

  // Custom metrics
  async recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ) {
    this.logger.info('Metric', { name, value, tags });
  }
}
