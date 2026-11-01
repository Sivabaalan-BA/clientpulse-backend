export interface PulseBreakdown {
  paymentScore: number;       // 0-100
  feedbackScore: number;      // 0-100
  milestoneScore: number;     // 0-100
  activityScore: number;      // 0-100
  compositeScore: number;     // 0-100
  riskStatus: 'healthy' | 'moderate_risk' | 'high_churn_risk';
  factors: string[];
  recommendations: string[];
}

export class ClientPulseEngine {
  /**
   * Computes multi-factor health score for a given client
   */
  static calculateHealth(params: {
    totalInvoices: number;
    overdueInvoices: number;
    averageRating: number; // 1-5
    pendingMilestoneApprovalsDays: number;
    completedProjects: number;
  }): PulseBreakdown {
    const {
      totalInvoices,
      overdueInvoices,
      averageRating,
      pendingMilestoneApprovalsDays,
      completedProjects,
    } = params;

    // 1. Payment Velocity Factor (Weight: 35%)
    let paymentScore = 100;
    if (totalInvoices > 0) {
      const overdueRatio = overdueInvoices / totalInvoices;
      paymentScore = Math.max(0, Math.round(100 - (overdueRatio * 100)));
    }

    // 2. Feedback Sentiment Factor (Weight: 30%)
    const feedbackScore = Math.round((Math.max(1, Math.min(5, averageRating)) / 5) * 100);

    // 3. Milestone Engagement Factor (Weight: 20%)
    let milestoneScore = 100;
    if (pendingMilestoneApprovalsDays > 14) {
      milestoneScore = 30; // stalled
    } else if (pendingMilestoneApprovalsDays > 7) {
      milestoneScore = 65; // laggy
    }

    // 4. Activity & Retention Factor (Weight: 15%)
    const activityScore = Math.min(100, 50 + (completedProjects * 15));

    // Weighted Composite: 35% + 30% + 20% + 15% = 100%
    const compositeScore = Math.round(
      (paymentScore * 0.35) +
      (feedbackScore * 0.30) +
      (milestoneScore * 0.20) +
      (activityScore * 0.15)
    );

    let riskStatus: 'healthy' | 'moderate_risk' | 'high_churn_risk' = 'healthy';
    const factors: string[] = [];
    const recommendations: string[] = [];

    if (compositeScore >= 80) {
      riskStatus = 'healthy';
      factors.push('Consistent payment habits and high customer review satisfaction.');
      recommendations.push('Ideal candidate for retainer renewal or case study testimonial.');
    } else if (compositeScore >= 50) {
      riskStatus = 'moderate_risk';
      if (overdueInvoices > 0) factors.push(`${overdueInvoices} overdue invoice(s) outstanding.`);
      if (pendingMilestoneApprovalsDays > 7) factors.push('Client milestone sign-offs are experiencing delays.');
      recommendations.push('Schedule a 15-minute sync with client project sponsor to clear blockers.');
    } else {
      riskStatus = 'high_churn_risk';
      factors.push('Elevated payment delinquency and/or dissatisfied feedback sentiment.');
      recommendations.push('Executive check-in required immediately. Audit ongoing deliverables.');
    }

    return {
      paymentScore,
      feedbackScore,
      milestoneScore,
      activityScore,
      compositeScore,
      riskStatus,
      factors,
      recommendations,
    };
  }
}
