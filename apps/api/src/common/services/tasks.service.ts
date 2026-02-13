import { Injectable, Logger } from '@nestjs/common';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import type { NewTask } from '@/db/schema';

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  sourceType: string;
  tags?: string[];
  priority?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  async createTask(input: CreateTaskInput) {
    try {
      const newTask: NewTask = {
        userId: input.userId,
        title: input.title,
        description: input.description || null,
        sourceType: input.sourceType,
        tags: input.tags || [],
        priority: input.priority || 'medium',
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        status: 'pending',
      };

      const result = await db.insert(tasks).values(newTask).returning();
      this.logger.log(`Task created: ${result[0]?.id}`);
      return result[0];
    } catch (error) {
      this.logger.error(`Failed to create task: ${error}`);
      throw error;
    }
  }

  async createManyTasks(inputs: CreateTaskInput[]) {
    try {
      if (inputs.length === 0) {
        return [];
      }

      const newTasks: NewTask[] = inputs.map((input) => ({
        userId: input.userId,
        title: input.title,
        description: input.description || null,
        sourceType: input.sourceType,
        tags: input.tags || [],
        priority: input.priority || 'medium',
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        status: 'pending',
      }));

      const result = await db.insert(tasks).values(newTasks).returning();
      this.logger.log(`Created ${result.length} tasks`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create tasks: ${error}`);
      throw error;
    }
  }

  async getTasksByUserId(userId: string) {
    try {
      const userTasks = await db.query.tasks.findMany({
        where: (table, { eq }) => eq(table.userId, userId),
      });
      return userTasks;
    } catch (error) {
      this.logger.error(`Failed to get tasks: ${error}`);
      throw error;
    }
  }
}
