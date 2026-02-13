/**
 * Tests for shared violation helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatEvidenceDetails,
  formatEvidenceDescription,
  type GroupEvidence,
} from '@tracearr/shared';

describe('Violation Helpers', () => {
  describe('formatEvidenceDetails', () => {
    it('returns string values, not objects', () => {
      const evidence: GroupEvidence[] = [
        {
          groupIndex: 0,
          matched: true,
          conditions: [
            {
              field: 'concurrent_streams',
              operator: 'gt',
              threshold: 2,
              actual: 3,
              matched: true,
            },
          ],
        },
      ];

      const details = formatEvidenceDetails(evidence, 'metric');

      // Should return string '3', not { actual: '3', threshold: '> 2', matched: true }
      expect(details['Concurrent Streams']).toBe('3');
      expect(typeof details['Concurrent Streams']).toBe('string');
    });

    it('returns user_id as string UUID (frontend handles display name)', () => {
      const userId = '3dae593c-6406-45f2-9615-f3ea1dbe250d';
      const evidence: GroupEvidence[] = [
        {
          groupIndex: 0,
          matched: true,
          conditions: [
            {
              field: 'user_id',
              operator: 'eq',
              threshold: userId,
              actual: userId,
              matched: true,
            },
          ],
        },
      ];

      const details = formatEvidenceDetails(evidence, 'metric');

      // Returns UUID string - frontend is responsible for resolving to display name
      expect(details['User']).toBe(userId);
      expect(typeof details['User']).toBe('string');
    });

    it('formats speed values with unit system', () => {
      const evidence: GroupEvidence[] = [
        {
          groupIndex: 0,
          matched: true,
          conditions: [
            {
              field: 'travel_speed_kmh',
              operator: 'gt',
              threshold: 500,
              actual: 1200,
              matched: true,
            },
          ],
        },
      ];

      const metricDetails = formatEvidenceDetails(evidence, 'metric');
      expect(metricDetails['Travel Speed']).toBe('1200 km/h');

      const imperialDetails = formatEvidenceDetails(evidence, 'imperial');
      expect(imperialDetails['Travel Speed']).toBe('746 mph');
    });
  });

  describe('formatEvidenceDescription', () => {
    it('returns human-readable description string', () => {
      const evidence: GroupEvidence[] = [
        {
          groupIndex: 0,
          matched: true,
          conditions: [
            {
              field: 'concurrent_streams',
              operator: 'gt',
              threshold: 2,
              actual: 5,
              matched: true,
            },
          ],
        },
      ];

      const description = formatEvidenceDescription(evidence, 'metric');

      expect(typeof description).toBe('string');
      expect(description).toContain('Concurrent Streams');
      expect(description).toContain('5');
    });
  });
});
