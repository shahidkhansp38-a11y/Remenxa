'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  label: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const classMap: Record<string, string> = {
    overdue: 'status-overdue',
    expires_today: 'status-overdue',
    urgent: 'status-urgent',
    upcoming: 'status-upcoming',
    later: 'status-valid',
  };

  return (
    <span className={`status-badge ${classMap[status] || 'status-upcoming'}`}>
      {label}
    </span>
  );
}
