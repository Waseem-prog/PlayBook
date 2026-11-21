const TRANSITIONS = {
  proposed: ['approved', 'on_hold', 'rejected'],
  on_hold: ['approved', 'rejected'],
  approved: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
};

export const nextStatuses = (status) => TRANSITIONS[status] || [];
