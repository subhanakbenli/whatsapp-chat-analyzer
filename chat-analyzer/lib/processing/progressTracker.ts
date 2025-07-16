type SessionStatus = 'initialized' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface Step {
  name: string;
  progress: number;
  status: StepStatus;
  startTime: number;
  endTime: number | null;
  result?: any;
  error?: any;
}

interface SessionError {
  step: string;
  error: any;
  timestamp: number;
}

interface SessionWarning {
  step: string;
  warning: any;
  timestamp: number;
}

interface Session {
  id: string;
  totalSteps: number;
  currentStep: number;
  progress: number;
  status: SessionStatus;
  startTime: number;
  endTime: number | null;
  steps: Step[];
  errors: SessionError[];
  warnings: SessionWarning[];
  result?: any;
  error?: any;
}

interface ProgressInfo {
  id: string;
  progress: number;
  status: SessionStatus;
  currentStep: number;
  totalSteps: number;
  elapsedTime: number;
  estimatedTimeRemaining: number | null;
  steps: {
    name: string;
    status: StepStatus;
    progress: number;
    duration: number | null;
  }[];
  errors: SessionError[];
  warnings: SessionWarning[];
}

interface SessionStats {
  sessionId: string;
  totalDuration: number;
  averageStepDuration: number;
  completedSteps: number;
  failedSteps: number;
  totalSteps: number;
  errorCount: number;
  warningCount: number;
  stepStats: {
    name: string;
    duration: number | null;
    status: StepStatus;
    progress: number;
  }[];
}

export class ProgressTracker {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map<string, Session>();
  }

  createSession(sessionId: string, totalSteps: number): Session {
    const session: Session = {
      id: sessionId,
      totalSteps,
      currentStep: 0,
      progress: 0,
      status: 'initialized' as SessionStatus,
      startTime: Date.now(),
      endTime: null,
      steps: [],
      errors: [],
      warnings: []
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  updateStep(sessionId: string, stepName: string, progress: number | null = null, status: StepStatus = 'in_progress'): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update or add step
    const existingStepIndex = session.steps.findIndex(step => step.name === stepName);
    const stepData = {
      name: stepName,
      progress: progress || 0,
      status,
      startTime: existingStepIndex === -1 ? Date.now() : session.steps[existingStepIndex].startTime,
      endTime: status === 'completed' ? Date.now() : null
    };

    if (existingStepIndex === -1) {
      session.steps.push(stepData);
    } else {
      session.steps[existingStepIndex] = stepData;
    }

    // Update overall progress
    this.calculateOverallProgress(sessionId);
    
    return session;
  }

  completeStep(sessionId: string, stepName: string, result: any = null): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const step = session.steps.find(s => s.name === stepName);
    if (step) {
      step.status = 'completed';
      step.progress = 100;
      step.endTime = Date.now();
      step.result = result;
    }

    this.calculateOverallProgress(sessionId);
    return session;
  }

  failStep(sessionId: string, stepName: string, error: any): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const step = session.steps.find(s => s.name === stepName);
    if (step) {
      step.status = 'failed';
      step.endTime = Date.now();
      step.error = error;
    }

    session.errors.push({
      step: stepName,
      error: error,
      timestamp: Date.now()
    });

    session.status = 'failed';
    return session;
  }

  addWarning(sessionId: string, stepName: string, warning: any): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.warnings.push({
      step: stepName,
      warning: warning,
      timestamp: Date.now()
    });

    return session;
  }

  calculateOverallProgress(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const completedSteps = session.steps.filter(step => step.status === 'completed').length;
    const totalSteps = session.steps.length;
    
    if (totalSteps > 0) {
      session.progress = Math.round((completedSteps / totalSteps) * 100);
      session.currentStep = completedSteps;
    }

    // Update overall status
    if (session.errors.length > 0) {
      session.status = 'failed';
    } else if (completedSteps === totalSteps && totalSteps > 0) {
      session.status = 'completed';
      session.endTime = Date.now();
    } else if (completedSteps > 0) {
      session.status = 'in_progress';
    }
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionProgress(sessionId: string): ProgressInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      progress: session.progress,
      status: session.status,
      currentStep: session.currentStep,
      totalSteps: session.totalSteps,
      elapsedTime: session.endTime ? 
        (session.endTime - session.startTime) : 
        (Date.now() - session.startTime),
      estimatedTimeRemaining: this.estimateTimeRemaining(session),
      steps: session.steps.map(step => ({
        name: step.name,
        status: step.status,
        progress: step.progress,
        duration: step.endTime ? (step.endTime - step.startTime) : null
      })),
      errors: session.errors,
      warnings: session.warnings
    };
  }

  estimateTimeRemaining(session: Session): number | null {
    if (session.progress === 0) return null;

    const elapsedTime = Date.now() - session.startTime;
    const estimatedTotalTime = (elapsedTime / session.progress) * 100;
    return Math.max(0, estimatedTotalTime - elapsedTime);
  }

  completeSession(sessionId: string, result: any = null): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'completed';
    session.progress = 100;
    session.endTime = Date.now();
    session.result = result;

    return session;
  }

  failSession(sessionId: string, error: any): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'failed';
    session.endTime = Date.now();
    session.error = error;

    return session;
  }

  cancelSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'cancelled';
    session.endTime = Date.now();

    return session;
  }

  cleanupSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(session => 
      session.status === 'in_progress' || session.status === 'initialized'
    );
  }

  getSessionStats(sessionId: string): SessionStats | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalDuration = session.endTime ? 
      (session.endTime - session.startTime) : 
      (Date.now() - session.startTime);

    const stepStats = session.steps.map(step => ({
      name: step.name,
      duration: step.endTime ? (step.endTime - step.startTime) : null,
      status: step.status,
      progress: step.progress
    }));

    return {
      sessionId: session.id,
      totalDuration,
      averageStepDuration: stepStats.reduce((sum, step) => 
        sum + (step.duration || 0), 0) / stepStats.length,
      completedSteps: stepStats.filter(step => step.status === 'completed').length,
      failedSteps: stepStats.filter(step => step.status === 'failed').length,
      totalSteps: stepStats.length,
      errorCount: session.errors.length,
      warningCount: session.warnings.length,
      stepStats
    };
  }
}

export default new ProgressTracker();