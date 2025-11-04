/**
 * TF-IDF Labeler Tests
 */

import { TFIDFLabeler } from '../tfidf_labeler';

describe('TFIDFLabeler', () => {
  let labeler: TFIDFLabeler;

  beforeEach(() => {
    labeler = new TFIDFLabeler();
  });

  describe('buildCorpus()', () => {
    it('should build corpus from signal names', () => {
      const signals = [
        'player_health_changed',
        'player_died',
        'enemy_health_changed',
        'item_collected',
      ];

      labeler.buildCorpus(signals);

      const stats = labeler.getCorpusStats();
      expect(stats.totalSignals).toBe(4);
      expect(stats.uniqueTerms).toBeGreaterThan(0);
    });

    it('should handle empty corpus', () => {
      labeler.buildCorpus([]);

      const stats = labeler.getCorpusStats();
      expect(stats.totalSignals).toBe(0);
      expect(stats.uniqueTerms).toBe(0);
    });

    it('should filter noise words', () => {
      const signals = ['on_button_pressed', 'health_changed', 'item_collected'];
      
      labeler.buildCorpus(signals);
      const stats = labeler.getCorpusStats();
      
      // 'on' and 'changed' should be filtered out
      expect(stats.uniqueTerms).toBeLessThan(7); // button, pressed, health, item, collected
    });
  });

  describe('generateLabel()', () => {
    beforeEach(() => {
      // Build corpus with diverse signal names
      const corpus = [
        'player_health_changed',
        'player_health_decreased',
        'player_died',
        'player_spawned',
        'enemy_health_changed',
        'enemy_died',
        'item_collected',
        'item_dropped',
        'coin_collected',
        'gem_collected',
      ];
      labeler.buildCorpus(corpus);
    });

    it('should generate label for single-signal cluster', () => {
      const label = labeler.generateLabel(['player_health_changed']);
      expect(label).toBe('player_health_changed');
    });

    it('should generate label for empty cluster', () => {
      const label = labeler.generateLabel([]);
      expect(label).toBe('empty_cluster');
    });

    it('should generate semantic label for player health cluster', () => {
      const signals = ['player_health_changed', 'player_health_decreased'];
      const label = labeler.generateLabel(signals, 3);

      // Should contain 'player' and 'health' (high TF-IDF in this cluster)
      expect(label).toContain('player');
      expect(label).toContain('health');
    });

    it('should generate semantic label for collection cluster', () => {
      const signals = ['item_collected', 'coin_collected', 'gem_collected'];
      const label = labeler.generateLabel(signals, 3);

      // 'collected' appears in all 3 signals (high TF)
      // but also in only 3/10 corpus signals (moderate IDF)
      expect(label).toContain('item');
    });

    it('should prioritize discriminative terms', () => {
      const signals = ['player_died', 'player_spawned'];
      const label = labeler.generateLabel(signals, 3);

      // 'player' appears in 4/10 corpus signals (lower IDF)
      // 'died', 'spawned' are more discriminative
      expect(label).toMatch(/died|spawned/);
    });

    it('should respect topN parameter', () => {
      const signals = ['player_health_changed', 'player_health_decreased'];
      
      const label1 = labeler.generateLabel(signals, 1);
      const label2 = labeler.generateLabel(signals, 2);
      const label3 = labeler.generateLabel(signals, 3);

      expect(label1.split('_').length).toBe(1);
      expect(label2.split('_').length).toBe(2);
      expect(label3.split('_').length).toBe(3);
    });
  });

  describe('generateLabelWithScores()', () => {
    beforeEach(() => {
      const corpus = [
        'player_health_changed',
        'player_died',
        'enemy_health_changed',
        'item_collected',
      ];
      labeler.buildCorpus(corpus);
    });

    it('should return label and term scores', () => {
      const signals = ['player_health_changed'];
      const result = labeler.generateLabelWithScores(signals, 3);

      expect(result.label).toBe('player_health_changed');
      expect(result.topTerms).toEqual([]);
    });

    it('should include TF-IDF scores for multi-signal cluster', () => {
      const signals = ['player_health_changed', 'player_died'];
      const result = labeler.generateLabelWithScores(signals, 3);

      expect(result.topTerms.length).toBeGreaterThan(0);
      
      for (const term of result.topTerms) {
        expect(term.term).toBeTruthy();
        expect(term.tf).toBeGreaterThan(0);
        expect(term.idf).toBeGreaterThanOrEqual(0);
        expect(term.tfidf).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort terms by TF-IDF score', () => {
      const signals = ['player_health_changed', 'player_died'];
      const result = labeler.generateLabelWithScores(signals, 3);

      // Verify scores are in descending order
      for (let i = 1; i < result.topTerms.length; i++) {
        expect(result.topTerms[i - 1].tfidf).toBeGreaterThanOrEqual(result.topTerms[i].tfidf);
      }
    });
  });

  describe('getCorpusStats()', () => {
    it('should return zero stats for empty corpus', () => {
      labeler.buildCorpus([]);
      const stats = labeler.getCorpusStats();

      expect(stats.totalSignals).toBe(0);
      expect(stats.uniqueTerms).toBe(0);
      expect(stats.avgTermsPerSignal).toBe(0);
    });

    it('should calculate corpus statistics', () => {
      const signals = [
        'player_health_changed',  // 2 terms (after filtering)
        'player_died',            // 2 terms
        'item_collected',         // 2 terms
      ];

      labeler.buildCorpus(signals);
      const stats = labeler.getCorpusStats();

      expect(stats.totalSignals).toBe(3);
      expect(stats.uniqueTerms).toBeGreaterThan(0);
      expect(stats.avgTermsPerSignal).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle signals with no underscores', () => {
      labeler.buildCorpus(['health', 'damage', 'heal']);
      const label = labeler.generateLabel(['health', 'damage']);

      expect(label).toBeTruthy();
      expect(label.split('_').length).toBeGreaterThan(0);
    });

    it('should handle signals with many underscores', () => {
      const signals = [
        'player_character_health_bar_changed',
        'player_character_health_bar_updated',
      ];
      labeler.buildCorpus(signals);
      const label = labeler.generateLabel(signals, 3);

      expect(label).toBeTruthy();
    });

    it('should handle duplicate signals in cluster', () => {
      labeler.buildCorpus(['player_died', 'enemy_died', 'item_collected']);
      const label = labeler.generateLabel(['player_died', 'player_died']);

      expect(label).toBeTruthy();
    });
  });
});
