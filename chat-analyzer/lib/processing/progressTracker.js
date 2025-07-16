export class ProgressTracker {
  constructor() {
    this.sessions = new Map();
  }

  createSession(sessionId, totalSteps) {
    const session = {
      id: sessionId,
      totalSteps,
      currentStep: 0,
      progress: 0,
      status: 'initialized',
      startTime: Date.now(),
      endTime: null,
      steps: [],
      errors: [],
      warnings: []
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  updateStep(sessionId, stepName, progress = null, status = 'in_progress') {
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

  completeStep(sessionId, stepName, result = null) {
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

  failStep(sessionId, stepName, error) {
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

  addWarning(sessionId, stepName, warning) {
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

  calculateOverallProgress(sessionId) {
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

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getSessionProgress(sessionId) {
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

  estimateTimeRemaining(session) {
    if (session.progress === 0) return null;

    const elapsedTime = Date.now() - session.startTime;
    const estimatedTotalTime = (elapsedTime / session.progress) * 100;
    return Math.max(0, estimatedTotalTime - elapsedTime);
  }

  completeSession(sessionId, result = null) {
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

  failSession(sessionId, error) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'failed';
    session.endTime = Date.now();
    session.error = error;

    return session;
  }

  cancelSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'cancelled';
    session.endTime = Date.now();

    return session;
  }

  cleanupSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  getActiveSessions() {
    return Array.from(this.sessions.values()).filter(session => 
      session.status === 'in_progress' || session.status === 'initialized'
    );
  }

  getSessionStats(sessionId) {
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