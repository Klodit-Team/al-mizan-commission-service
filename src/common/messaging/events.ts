/**
 * Patterns d'événements RabbitMQ publiés par le Commission Service.
 * Consommés par : Audit Service, Notification Service.
 */
export const COMMISSION_EVENTS = {
  // Commission d'évaluation
  EVALUATION_CREATED: 'commission.evaluation.created',
  EVALUATION_STATUT_CHANGED: 'commission.evaluation.statut_changed',
  EVALUATION_MEMBRE_ADDED: 'commission.evaluation.membre_added',

  // Commission de marché
  MARCHE_CREATED: 'commission.marche.created',
  MARCHE_STATUT_CHANGED: 'commission.marche.statut_changed',
  MARCHE_PV_GENERATED: 'commission.marche.pv_generated',
  MARCHE_ATTRIBUTED: 'commission.marche.attributed',
  MARCHE_MEMBRE_ADDED: 'commission.marche.membre_added',

  // Séances d'ouverture
  SEANCE_PROGRAMMEE: 'commission.seance.programmee',
  SEANCE_DEMARREE: 'commission.seance.demarree',
  SEANCE_TERMINEE: 'commission.seance.terminee',
  PV_OUVERTURE_GENERATED: 'commission.seance.pv_generated',
} as const;

// Alias for backward compatibility
export const CommissionEvents = COMMISSION_EVENTS;
